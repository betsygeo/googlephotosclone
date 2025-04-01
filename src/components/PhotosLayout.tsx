"use client";
import {
  FiSearch,
  FiImage,
  FiFolder,
  FiPlus,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { auth } from "../lib/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ImageUpload from "./imageupload";
import ImageGrid from "./ImageGrid";

import AlbumGrid from "./AlbumGrid";

export default function PhotosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeView, setActiveView] = useState<"images" | "albums">("images");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>
      {/* Sidebar */}
      <div
        className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 transform transition-transform duration-200 ease-in-out
        fixed md:static z-40 w-64 h-full bg-gradient-to-b from-amber-100 to-rose-200 border-r border-amber-300 flex flex-col
      `}
      >
        {/* Logo */}
        <div className="p-4 text-xl font-bold border-b border-gray-200 flex items-center ">
          {sidebarOpen && "Google Photos Clone"}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden ml-auto p-1 hover:bg-gray-100 rounded bg-gradient-to-b from-amber-100 to-rose-200"
          >
            <FiX />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveView("images")}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeView === "images"
                    ? "bg-amber-100 text-amber-800"
                    : "hover:bg-amber-50/50"
                }`}
              >
                <FiImage className={sidebarOpen ? "mr-3" : "mx-auto"} />
                {sidebarOpen && "Images"}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("albums")}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeView === "albums"
                    ? "bg-amber-100 text-amber-800"
                    : "hover:bg-amber-50/50"
                }`}
              >
                <FiFolder className={sidebarOpen ? "mr-3" : "mx-auto"} />
                {sidebarOpen && "Albums"}
              </button>
            </li>
          </ul>
        </nav>

        {/* User Profile with Sign Out */}
        <div className="p-4 border-t border-gray-200">
          <div
            className="flex items-center cursor-pointer group"
            onClick={handleSignOut}
          >
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full mr-2"
            />
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium group-hover:text-blue-500">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 group-hover:text-blue-400">
                  Sign out
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-amber-50/80 border-b border-amber-200 backdrop-blur-sm p-4 flex items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search your photos"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="ml-4 p-2 bg-gray-300 text-white rounded-full hover:bg-pink-400 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
          </button>

          {/* User Profile with Sign Out */}

          <div
            className="flex items-center cursor-pointer group"
            onClick={handleSignOut}
          >
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full mr-2"
            />
            <div>
              <p className="text-sm font-medium group-hover:text-blue-500">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-gray-500 group-hover:text-blue-400">
                Sign out
              </p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main
          className={`flex-1 overflow-y-auto p-6 ${
            sidebarOpen ? "bg-amber-50/20" : "bg-white"
          } transition-colors`}
        >
          {activeView === "images" ? <ImageGrid /> : <AlbumGrid />}
        </main>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Upload Images</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <ImageUpload onComplete={() => setShowUploadModal(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
