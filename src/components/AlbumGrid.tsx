import React, { useEffect, useState } from "react";
import { auth, db } from "../lib/firebaseConfig";
import { collection, query, onSnapshot, where } from "firebase/firestore";

import { deleteAlbum, getImagebyId } from "@/lib/firebase";
import AlbumView from "./AlbumView";
import Link from "next/link";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaRegCopy } from "react-icons/fa";

interface Album {
  id: string;
  name: string;
  imageIds: string[];
  isPublic: boolean;
}

const AlbumGrid = () => {
  const [viewMode, setViewMode] = useState<"all" | "public">("all");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: string;
    isPublic: boolean;
  } | null>(null);

  const handleDeleteAlbum = async (albumId: string, isPublic: boolean) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (confirm("Are you sure you want to delete this album?")) {
        await deleteAlbum(user.uid, albumId, isPublic);
      }
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("Failed to delete album");
    }
  };

  // for all view
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || viewMode === "public") return;

    const q = query(collection(db, `users/${user.uid}/albums`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const albumList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        imageIds: doc.data().imageIds || [],
        isPublic: false,
      }));
      setAlbums(albumList);
    });

    return () => unsubscribe();
  }, [viewMode]);

  // for public
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || viewMode === "all") return;

    const q = query(
      collection(db, "publicAlbums"),
      where("ownerId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const publicAlbums = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        imageIds: doc.data().imageIds || [],
        isPublic: true,
      }));
      setAlbums(publicAlbums);
    });

    return () => unsubscribe();
  }, [viewMode]);

  if (selectedAlbum) {
    return (
      <div className="p-4">
        <button
          onClick={() => setSelectedAlbum(null)}
          className="mb-4 px-4 py-2 bg-pink-200 rounded hover:bg-pink-300 transition"
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

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center border-b pb-3 border-amber-200">
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "all"
                ? "bg-pink-300 text-white shadow-md"
                : "bg-pink-100 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setViewMode("public")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "public"
                ? "bg-pink-300 text-white shadow-md"
                : "bg-pink-50 hover:bg-gray-200"
            }`}
          >
            Public Albums
          </button>
        </div>
        <div className="flex justify-end">
          <Link
            href="/albums/create"
            className="bg-pink-400 hover:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex justify-end"
          >
            Create Album
          </Link>
        </div>
      </div>

      {viewMode === "all"}

      {/* Album Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ">
        {albums.map((album) => (
          <div
            key={album.id}
            className="bg-amber-50 rounded-xl shadow-sm hover:scale-103 transition-shadow overflow-hidden border border-gray-100"
          >
            {/* Album Cover*/}
            <div className="relative h-48">
              <img
                src="/cover.jpeg"
                alt="Album cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                }}
              />
            </div>

            {/* Album Info */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg truncate">{album.name}</h3>
                {album.isPublic && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-gray-800">
                    Public
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600">
                {album.imageIds.length}{" "}
                {album.imageIds.length === 1 ? "image" : "images"}
              </p>

              {album.isPublic && (
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-1">Share link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/share/${album.id}`}
                      readOnly
                      className="flex-1 text-xs p-2 border rounded truncate"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}/share/${album.id}`
                        )
                      }
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Copy link"
                    >
                      <FaRegCopy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() =>
                    setSelectedAlbum({ id: album.id, isPublic: album.isPublic })
                  }
                  className="flex-1 py-2 px-4 bg-pink-300 hover:bg-pink-400 text-white rounded-lg transition-colors"
                >
                  View Album
                </button>
                <button
                  onClick={() => handleDeleteAlbum(album.id, album.isPublic)}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Delete album"
                >
                  <FaRegTrashCan className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumGrid;
