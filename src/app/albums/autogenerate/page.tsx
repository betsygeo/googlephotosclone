"use client";

import React, { useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { api, createAlbum } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";

const AutoCreateAlbumPage = () => {
  const router = useRouter();
  const [albumName, setAlbumName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  const handleCreateAlbum = async () => {
    if (!albumName.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const res = await fetch(api.upsertText(user.uid, albumName), {
        method: "POST",
      });
      const data = await res.json();
      const matchVectorIds = data.matches
        .filter((match: any) => match.score > 0.2)
        .map((match: any) => match.id);

      if (matchVectorIds.length === 0) {
        console.log("No matches found above the threshold.");
        alert("No picture matches found");
        router.push("/");
        return;
      }

      const q = query(
        collection(db, `users/${user.uid}/images`),
        where("vectorId", "in", matchVectorIds)
      );

      const querySnapshot = await getDocs(q);

      const imageIds: string[] = querySnapshot.docs.map((doc) => doc.id);

      await createAlbum(user.uid, albumName, imageIds ?? [], isPublic);

      alert("Album created successfully!");
      router.push("/");
    } catch (err: any) {
      console.error("Album creation failed:", err);
      setError("Something went wrong creating the album.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f97316] to-[#f43f5e]">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Link
          href="/"
          className="inline-flex text-black hover:text-gray-600 mb-6"
        >
          ← Back
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Auto Generate Album
        </h1>

        <div className="bg-amber-100 p-6 rounded-lg shadow-md border border-gray-200">
          <div className="mb-4">
            <label
              htmlFor="albumName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Album Title
            </label>
            <input
              id="albumName"
              type="text"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Album name eg. friends, nature"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div className="mb-4">
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

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <button
            onClick={handleCreateAlbum}
            disabled={!albumName.trim() || isCreating}
            className={`px-4 py-2 rounded-md text-white ${
              !albumName.trim()
                ? "bg-pink-300 cursor-not-allowed"
                : "bg-pink-400 hover:bg-pink-500"
            } ${isCreating ? "opacity-75" : ""}`}
          >
            {isCreating ? "Creating..." : "Create Album"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoCreateAlbumPage;
