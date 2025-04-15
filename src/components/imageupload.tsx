"use client";

import React, { useState } from "react";
import { uploadImage } from "../lib/firebase";
import "./ImageUpload.css";

interface ImageUploadProps {
  onComplete?: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onComplete }) => {
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      alert("Please select an image to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const downloadURL = await uploadImage(image);
      onComplete?.();
      console.log("Image uploaded:", downloadURL);
      alert(`Image uploaded: ${downloadURL}`);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image.");
    } finally {
      setUploading(false);
      setImage(null);
    }
  };

  return (
    <div className="upload-container">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="file-input"
      />
      <button
        onClick={handleUpload}
        disabled={!image || uploading}
        className="upload-btn"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ImageUpload;
