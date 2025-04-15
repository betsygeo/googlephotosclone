"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { createAlbum } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Image {
  id: string;
  url: string;
  name?: string;
}

const CreateAlbumPage = () => {
  const router = useRouter();
  const [albumName, setAlbumName] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const q = query(collection(db, `users/${user.uid}/images`));
        const querySnapshot = await getDocs(q);
        const imagesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Image[];
        setImages(imagesData);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [router]);

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleCreateAlbum = async () => {
    if (!albumName.trim() || selectedImages.length === 0) return;

    setIsCreating(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      await createAlbum(user.uid, albumName, selectedImages, isPublic);
      alert("Album created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Album creation failed:", error);
      alert("Failed to create album");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f97316] to-[#f43f5e]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center text-black hover:text-gray-600 mb-6 transition-colors"
        >
          ← Back
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Create New Album
        </h1>

        <div className="bg-amber-100 p-6 rounded-lg shadow-md border border-gray-200">
          <div className="mb-4">
            <label
              htmlFor="albumName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Album Name
            </label>
            <input
              id="albumName"
              type="text"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Enter album name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div className="mb-6 ">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Select Images:
            </p>
            {images.length === 0 ? (
              <p className="text-gray-500">No images yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative cursor-pointer rounded-md overflow-hidden border-2 ${
                      selectedImages.includes(img.id)
                        ? "border-amber-100"
                        : "border-gray-200"
                    }`}
                    onClick={() => toggleImageSelection(img.id)}
                  >
                    <img
                      src={img.url}
                      alt={img.name || "Image"}
                      className="w-full h-32 object-cover"
                    />
                    {selectedImages.includes(img.id) && (
                      <div className="absolute top-2 right-2 bg-pink-300 text-white rounded-full w-6 h-6 flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={() => setIsPublic(!isPublic)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Make album publicly shareable
              </span>
            </label>
          </div>

          <button
            onClick={handleCreateAlbum}
            disabled={
              !albumName.trim() || selectedImages.length === 0 || isCreating
            }
            className={`px-4 py-2 rounded-md text-white ${
              !albumName.trim() || selectedImages.length === 0
                ? "bg-pink-300 cursor-not-allowed"
                : "bg-pink-400 hover:bg-pink-500"
            } ${isCreating ? "opacity-75" : ""}`}
          >
            {isCreating ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </span>
            ) : (
              "Create Album"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAlbumPage;
