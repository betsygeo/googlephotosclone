// Handles creating Albums
"use client";

import React, { useState } from "react";
import { auth } from "../lib/firebaseConfig";
import { createAlbum } from "../lib/firebase";

// Can only create an album from images already there - that makes sense
const AlbumManager = ({ images }: { images: any[] }) => {
  const [albumName, setAlbumName] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  //handler for create album
  const handleCreateAlbum = async () => {
    if (!albumName.trim() || selectedImages.length === 0) return;

    setIsCreating(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      await createAlbum(user.uid, albumName, selectedImages, isPublic);
      setAlbumName("");
      setSelectedImages([]);
      alert("Album created successfully!");
    } catch (error) {
      console.error("Album creation failed:", error);
      alert("Failed to create album");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    //box to create the album
    <div
      style={{ margin: "20px 0", padding: "20px", border: "1px solid #ddd" }}
    >
      <h3>Create New Album</h3>
      <input
        type="text"
        value={albumName}
        onChange={(e) => setAlbumName(e.target.value)}
        placeholder="Album name"
        style={{ padding: "8px", marginRight: "10px" }}
      />

      <div style={{ margin: "10px 0" }}>
        <p>Select images:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                position: "relative",
                border: selectedImages.includes(img.id)
                  ? "3px solid blue"
                  : "1px solid #ddd",
                borderRadius: "5px",
              }}
              onClick={() => toggleImageSelection(img.id)}
            >
              <img
                src={img.url}
                alt={img.name}
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
              {selectedImages.includes(img.id) && (
                <div
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    background: "blue",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: "10px 0" }}>
        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          Make album publicly shareable
        </label>
      </div>

      <button
        onClick={handleCreateAlbum}
        disabled={
          !albumName.trim() || selectedImages.length === 0 || isCreating
        }
        style={{
          padding: "8px 15px",
          background: "#4CAF50",
          color: "white",
          border: "none",
        }}
      >
        {isCreating ? "Creating..." : "Create Album"}
      </button>
    </div>
  );
};

export default AlbumManager;
