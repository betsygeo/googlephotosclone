"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebaseConfig";
import {
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
  query,
  collection,
  documentId,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";

interface PublicAlbum {
  id: string;
  name: string;
  imageIds: string[];
}

interface Images {
  id: string;
  name: string;
  url: string;
}
const AlbumView = ({
  albumId,
  isPublic,
}: {
  albumId: string;
  isPublic: boolean;
}) => {
  const [album, setAlbum] = useState<PublicAlbum | null>(null);
  const [images, setImages] = useState<Images[]>([]);
  const [availableImages, setAvailableImages] = useState<Images[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbum = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const albumRef = isPublic
          ? doc(db, "publicAlbums", albumId)
          : doc(db, `users/${user.uid}/albums`, albumId);
        const albumSnap = await getDoc(albumRef);

        if (albumSnap.exists()) {
          setAlbum({ id: albumSnap.id, ...albumSnap.data() } as PublicAlbum);
          const imagesQuery = query(
            collection(db, `users/${user.uid}/images`),
            where(documentId(), "in", albumSnap.data().imageIds || [])
          );
          const imagesSnap = await getDocs(imagesQuery);
          setImages(
            imagesSnap.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Images)
            )
          );
          const allImagesQuery = query(
            collection(db, `users/${user.uid}/images`)
          );
          const allImagesSnap = await getDocs(allImagesQuery);
          setAvailableImages(
            allImagesSnap.docs
              .filter((doc) => !albumSnap.data().imageIds.includes(doc.id))
              .map((doc) => ({ id: doc.id, ...doc.data() } as Images))
          );
        }
      } catch (error) {
        console.error("Error fetching album:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId, isPublic]);

  const handleAddImage = async (imageId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const batch = writeBatch(db);
      const privateRef = doc(db, `users/${user.uid}/albums`, albumId);
      batch.update(privateRef, { imageIds: arrayUnion(imageId) });
      if (isPublic) {
        const publicRef = doc(db, "publicAlbums", albumId);
        batch.update(publicRef, { imageIds: arrayUnion(imageId) });
      }
      await batch.commit();
      const foundImage = availableImages.find((img) => img.id === imageId);
      if (foundImage) {
        setImages([...images, foundImage]); // Add image only if it was found
        setAvailableImages(availableImages.filter((img) => img.id !== imageId));
      }
    } catch (error) {
      console.error("Error adding image:", error);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const batch = writeBatch(db);
      const privateRef = doc(db, `users/${user.uid}/albums`, albumId);
      batch.update(privateRef, { imageIds: arrayRemove(imageId) });

      if (isPublic) {
        const publicRef = doc(db, "publicAlbums", albumId);
        batch.update(publicRef, { imageIds: arrayRemove(imageId) });
      }

      await batch.commit();
      const foundImage = images.find((img) => img.id === imageId);

      if (foundImage) {
        setImages(images.filter((img) => img.id !== imageId));
        setAvailableImages([...availableImages, foundImage]);
      }
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  if (loading) return <div>Loading album...</div>;
  if (!album) return <div>Album not found</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{album.name}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {images.map((img) => (
          <div key={img.id} className="relative">
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={() => handleRemoveImage(img.id)}
              className="absolute top-2 right-2 cursor-pointer bg-amber-300 text-white rounded-full w-6 h-6 flex items-center justify-center hover:scale-110"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Add Images</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {availableImages.map((img) => (
          <div key={img.id} className="relative">
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={() => handleAddImage(img.id)}
              className="absolute top-2 right-2 cursor-pointer bg-pink-300 text-white rounded-full w-6 h-6 flex items-center justify-center hover:scale-110"
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumView;
