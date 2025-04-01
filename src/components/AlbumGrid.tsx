import React, { useEffect, useState } from "react";
import { auth, db } from "../lib/firebaseConfig";
import { collection, query, onSnapshot, where } from "firebase/firestore";

import { deleteAlbum, getImagebyId } from "@/lib/firebase";
import AlbumView from "./AlbumView";
import Link from "next/link";

interface Album {
  id: string;
  name: string;
  imageIds: string[];
  isPublic: boolean;
}

// I don't know why Font Awesome was not working
const CopyIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
    />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

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
                      <CopyIcon className="w-4 h-4" />
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
                  <TrashIcon className="w-5 h-5" />
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
