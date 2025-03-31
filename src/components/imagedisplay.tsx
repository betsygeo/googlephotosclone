import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../lib/firebaseConfig"; // maybe storage too bruh
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  where,
  getDocs,
  writeBatch,
  arrayRemove,
} from "firebase/firestore"; // will need "where" for sorting images
import { deleteObject, ref } from "firebase/storage";
import AlbumManager from "./AlbumManager";
import { deleteAlbum } from "@/lib/firebase";
import AlbumView from "./AlbumView";

// should i lowkey be defining this here? -- might edit later on
//STUFF TO NOTE ON FOR THIS FUNCTION
// binary blob - collection of binary data stored as a single entity
const downloadImage = async (url: string, name: string) => {
  try {
    // 1) fetch the image file based on the downloadurl
    const response = await fetch(url);
    //conver to a blob - basically binary shit
    const blob = await response.blob();
    //create a url for this blob
    const blobUrl = window.URL.createObjectURL(blob);
    //create an a tag(invisible link)
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name || `image-${Date.now()}.jpg`; // forces to actually download instead of navigate
    document.body.appendChild(a);
    a.click(); //triggers the download
    //clear
    window.URL.revokeObjectURL(blobUrl);
    a.remove();
  } catch (error) {
    console.error("Download failed:", error);
    alert("Failed to download image");
  }
};

const downloadAllImages = async (
  images: Array<{ url: string; name: string }>
) => {
  //download one by one
  for (const img of images) {
    await downloadImage(img.url, img.name);
    await new Promise((resolve) => setTimeout(resolve, 300)); // Small delay between downloads
  }
};

const UserImages = () => {
  const [images, setImages] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"images" | "albums">("images");
  const [albums, setAlbums] = useState<any[]>([]);
  const [publicAlbums, setPublicAlbums] = useState<Set<string>>(new Set());

  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: string;
    isPublic: boolean;
  } | null>(null);

  //delete one image
  const handleDelete = async (imageId: string, imageUrl: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // is it in private or public albums
      const albumsQuery = query(
        collection(db, `users/${user.uid}/albums`),
        where("imageIds", "array-contains", imageId)
      );

      const publicAlbumsQuery = query(
        collection(db, "publicAlbums"),
        where("imageIds", "array-contains", imageId)
      );

      const [privateAlbumsSnap, publicAlbumsSnap] = await Promise.all([
        getDocs(albumsQuery),
        getDocs(publicAlbumsQuery),
      ]);

      const batch = writeBatch(db);

      //private album removal ---
      privateAlbumsSnap.forEach((doc) => {
        batch.update(doc.ref, {
          imageIds: arrayRemove(imageId),
        });
      });

      //same for public
      publicAlbumsSnap.forEach((doc) => {
        batch.update(doc.ref, {
          imageIds: arrayRemove(imageId),
        });
      });

      await deleteDoc(doc(db, `users/${user.uid}/images`, imageId));

      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);

      //bruh commit
      await batch.commit();
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  };

  //calls the deletealbum-straightforwar
  const handleDeleteAlbum = async (albumId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const isPublic = publicAlbums.has(albumId);

      if (
        confirm(
          "Are you sure you want to delete this album? This will not delete the images."
        )
      ) {
        await deleteAlbum(user.uid, albumId, isPublic);
      }
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("Failed to delete album");
    }
  };

  //fetch all images for that user
  useEffect(() => {
    const fetchImages = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, `users/${user.uid}/images`));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const imageList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setImages(imageList);
      });
      return () => unsubscribe();
    };

    fetchImages();
  }, []);

  //display private albums
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || viewMode !== "albums") return;

    const q = query(collection(db, `users/${user.uid}/albums`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const albumList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlbums(albumList);
    });

    return () => unsubscribe();
  }, [viewMode]);

  //display public too
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || viewMode !== "albums") return;

    const publicAlbumsRef = collection(db, "publicAlbums");
    const unsubscribe = onSnapshot(publicAlbumsRef, (snapshot) => {
      const publicIds = new Set<string>();
      snapshot.forEach((doc) => {
        publicIds.add(doc.id);
      });
      setPublicAlbums(publicIds);
    });

    return () => unsubscribe();
  }, [viewMode]);

  // to view content/images in album
  if (selectedAlbum) {
    return (
      <div className="p-4">
        <button
          onClick={() => setSelectedAlbum(null)}
          className="mb-4 px-4 py-2 bg-gray-200 rounded"
        >
          ← Back to albums
        </button>
        <AlbumView
          albumId={selectedAlbum.id}
          isPublic={selectedAlbum.isPublic}
        />
      </div>
    );
  }

  //needs work lowkey
  return (
    <div>
      <h2>Images</h2>
      {images.length > 0 && (
        <button
          onClick={() => downloadAllImages(images)}
          style={{
            marginBottom: "10px",
            padding: "8px 16px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Download All Images
        </button>
      )}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {images.map((img) => (
          <div key={img.id} style={{ margin: "10px", position: "relative" }}>
            <img src={img.url} alt={img.name} style={{ width: "200px" }} />
            <p>{img.name}</p>
            <button
              onClick={() => handleDelete(img.id, img.url)}
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "25px",
                height: "25px",
                cursor: "pointer",
              }}
              title="Delete image"
            >
              ×
            </button>
            <button
              onClick={() => downloadImage(img.url, img.name)}
              style={{
                position: "absolute",
                top: "5px",
                left: "5px",
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "25px",
                height: "25px",
                cursor: "pointer",
              }}
              title="Download image"
            >
              ↓
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setViewMode("images")}
          style={{
            marginRight: "10px",
            fontWeight: viewMode === "images" ? "bold" : "normal",
          }}
        >
          My Images
        </button>
        <button
          onClick={() => setViewMode("albums")}
          style={{ fontWeight: viewMode === "albums" ? "bold" : "normal" }}
        >
          My Albums
        </button>
      </div>

      {viewMode === "images" ? (
        <>
          <AlbumManager images={images} />
          {/* Your existing images display */}
        </>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {albums.map((album) => (
            <div
              key={album.id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "5px",
                width: "250px",
                position: "relative",
              }}
            >
              <button
                onClick={() => handleDeleteAlbum(album.id)}
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "25px",
                  height: "25px",
                  cursor: "pointer",
                }}
                title="Delete album"
              >
                ×
              </button>
              <h3>{album.name}</h3>
              <p>Contains {album.imageIds?.length || 0} images</p>

              {publicAlbums.has(album.id) && (
                <p>
                  <a href={`/share/${album.id}`} target="_blank">
                    {`${window.location.origin}/share/${album.id}`}
                  </a>
                </p>
              )}
              <button
                onClick={() =>
                  setSelectedAlbum({
                    id: album.id,
                    isPublic: publicAlbums.has(album.id),
                  })
                }
                style={{
                  marginTop: "10px",
                  padding: "5px 10px",
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginRight: "5px",
                }}
              >
                View Album
              </button>
              {album.imageIds?.length > 0 && (
                <button
                  onClick={() =>
                    downloadAllImages(
                      album.imageIds.map((id: string) => {
                        const img = images.find((i) => i.id === id);
                        return img || { url: "", name: `image-${id}` };
                      })
                    )
                  }
                  style={{
                    marginTop: "10px",
                    padding: "5px 10px",
                    background: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Download Album
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserImages;
