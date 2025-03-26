//QUESTIONS
// Should I add a feature to delete an image - most likely
//Sorting
//FRONT END SUCKS but backend seems to be efficient

//IDEA
//- for album create a new folder under user that has album and then under the album images and then make a shareable link
// - might work lowkey

"use client";
import React, { useState, useEffect } from "react";
import { auth } from "../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { signInWithGoogle, signOutUser } from "../lib/firebase";
import ImageUpload from "../components/imageupload";
import UserImages from "../components/imagedisplay";

const Home = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Failed to sign in with Google.");
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Google Photos Clone</h1>

      {user ? (
        <>
          <p>Welcome, {user.displayName || user.email}</p>
          <button onClick={handleSignOut} style={{ marginBottom: "20px" }}>
            Sign Out
          </button>

          <ImageUpload />

          {/* COMPONENT REQUIRED - should display all images for the user at the moment*/}
          <UserImages />
        </>
      ) : (
        <>
          <p>Please sign in with Google to upload images.</p>
          <button onClick={handleSignIn}>Sign in with Google</button>
        </>
      )}
    </div>
  );
};

export default Home;
