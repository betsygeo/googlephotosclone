//UPDATE
//Does the work mehn

"use client"; // client component of course

import React, { useState } from "react";
import { uploadImage } from "../lib/firebase"; // firebase upload backend
import "./ImageUpload.css"; // styling vs tailwind - HANDLE FRONT END LAST

const ImageUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]); // only handles one for now, should i add a feature to add more than one?
    }
  };

  const handleUpload = async () => {
    if (!image) {
      // no image uploaded
      alert("Please select an image to upload.");
      return;
    }

    setUploading(true);
    setError(null);

    // probably  a try/ catch / finally to set setuploading and image back to default
    try {
      const downloadURL = await uploadImage(image);
      console.log("Image uploaded:", downloadURL); // print to console for now
      alert(`Image uploaded: ${downloadURL}`); // should we alert? alert for now not sure yet
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image.");
    } finally {
      setUploading(false);
      setImage(null);
    }
  };

  // css definitely needs work
  return (
    <div className="upload-container">
      <input
        type="file"
        accept="image/*" // only image type - png..
        onChange={handleFileChange}
        className="file-input"
      />
      <button
        onClick={handleUpload}
        disabled={!image || uploading} // grey out effect
        className="upload-btn"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ImageUpload;
