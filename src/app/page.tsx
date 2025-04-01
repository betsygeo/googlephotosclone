//Sorting
//FRONT END STILL SUCKS but backend seems to be efficient

//ALBUM
//probbaly add the feature of sharing albums

"use client";
import React, { useState, useEffect } from "react";
import { auth } from "../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { signInWithGoogle, signOutUser } from "../lib/firebase";

import PhotosLayout from "@/components/PhotosLayout";
import ImageGrid from "@/components/ImageGrid";

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
    <div>
      {user ? (
        <>
          <PhotosLayout>
            <ImageGrid />
          </PhotosLayout>
        </>
      ) : (
        <>
          <div className="min-h-screen bg-gradient-to-br from-[#f97316] to-[#f43f5e] flex flex-col items-center justify-center p-4">
            <div className="bg-black rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Google Photos Clone
                </h1>
                <p className="text-gray-300">
                  Let's store our favourite memories!
                </p>
              </div>

              <div className="space-y-6">
                <p className="text-gray-300 text-center">
                  Please sign in with Google to get started
                </p>
                <button
                  onClick={handleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white text-[#f4843f] hover:bg-white/90  font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  Google Sign In
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-400 text-sm">
                  Your photos will be securely stored in your private account
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
