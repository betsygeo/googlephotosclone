"use client";
import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
  arrayRemove,
  deleteDoc,
  doc,
  writeBatch,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebaseConfig";
import { downloadImage, groupByMonth, loadMoreImages } from "@/lib/firebase";
import { deleteObject, ref } from "firebase/storage";

export default function ImageGrid() {
  const [groupedImages, setGroupedImages] = useState<Record<string, any[]>>({});
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadInitialImages = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, `users/${user.uid}/images`),
      orderBy("uploadedAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const images = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setGroupedImages(groupByMonth(images));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(images.length >= 20);
      setLoading(false);
    });

    return unsubscribe; // Return cleanup function
  }, []);

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

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const user = auth.currentUser;
    if (!user || !lastVisible) return;

    setLoading(true);
    const { images, lastVisible: newLastVisible } = await loadMoreImages(
      lastVisible,
      user.uid
    );

    if (images.length > 0) {
      setGroupedImages((prev) => {
        const newGroups = groupByMonth(images);
        return Object.keys(newGroups).reduce(
          (acc, key) => {
            acc[key] = [...(acc[key] || []), ...newGroups[key]];
            return acc;
          },
          { ...prev }
        );
      });
      setLastVisible(newLastVisible);
      setHasMore(images.length >= 20);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  }, [lastVisible, hasMore, loading]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  useEffect(() => {
    loadInitialImages();
  }, [loadInitialImages]);

  return (
    <div className="space-y-8 pb-8">
      {Object.entries(groupedImages).map(([monthYear, images]) => (
        <div key={monthYear} className="space-y-4">
          <h2 className="text-xl font-bold  bg-amber-50/20 backdrop-blur-sm z-10 py-2">
            {monthYear}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-2">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square group">
                <a href={img.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={img.url}
                    className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
                    alt={img.name}
                  />
                </a>
                <div className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">
                  {new Date(
                    img.uploadedAt?.seconds * 1000
                  ).toLocaleDateString()}
                </div>
                <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded hover:scale-115">
                  <button
                    onClick={() => handleDelete(img.id, img.url)}
                    title="Delete image"
                  >
                    ×
                  </button>
                </div>

                <div className="absolute bottom-1 right-6 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded hover:scale-115">
                  <button
                    onClick={() => downloadImage(img.url, img.name)}
                    title="Download image"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      )}

      {!hasMore && !loading && (
        <div className="text-center text-gray-500 py-8">
          You've reached the end of your photos
        </div>
      )}
    </div>
  );
}
