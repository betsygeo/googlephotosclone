//Sorting
//FRONT END STILL SUCKS but backend seems to be efficient

//ALBUM
//probbaly add the feature of sharing albums

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
