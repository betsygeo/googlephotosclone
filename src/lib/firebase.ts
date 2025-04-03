//Update on this
// Looking good -- made changes so far
// Handles storage, database and auth backend

import { storage, db,auth,provider } from "./firebaseConfig";  
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp, getDoc, collection, query, documentId, where, getDocs, deleteDoc, orderBy, startAfter, limit, DocumentSnapshot } from "firebase/firestore";
import {v4 as uuidv4} from "uuid"; // npm install uuid - done
import { signInWithPopup, signOut } from "firebase/auth";

interface Image {
  id: string;
  url: string;
  name: string;
  uploadedAt: { seconds: number };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined in environment variables');
}

export const api = {
  uploadImageFace: (userId:string) => `${API_URL}/upload-image/${userId}`,
  nameFace: (userId: string, faceId: string) => `${API_URL}/name-face/${userId}/${faceId}`,
  getFaceImages: (userId: string, name: string) => 
    `${API_URL}/person-images/${userId}/${encodeURIComponent(name)}`,
  getFaceCrop: (userId: string, faceId: string) =>
    `${API_URL}/face-crop/${userId}/${faceId}`,
  getFaces: (userId:string) =>`${API_URL}/user-faces/${userId}`
};

// unique key bruh for storage and database - done
export async function uploadImage(image: File) {

  //authenticate image
  if (!image) throw new Error("No image file provided"); // Upload is greyed out if no image in CSS
  
  //authenticate user
  const user = auth.currentUser;
  if(!user) throw new Error("User not authenticated"); // probably never has this issue since Auth is the first page but just keep it for now
  const unique_id = uuidv4(); //random_id
  
  //into storage
  const storage_ref = ref(storage, `users/${user.uid}images/${unique_id}`);  
  const snapshot = await uploadBytes(storage_ref, image);
  const downloadURL = await getDownloadURL(snapshot.ref);

  const formData = new FormData();
  console.log("Uploading image:", image.type, image.size);
  formData.append('file', image, image.name);

  

  const metadata = {
    id: unique_id, // uid for image
    userId:user.uid, // id for user - every user has their unique one
    name: image.name,
    // labels:labels,
    url: downloadURL, // Not sure where this will come in handy yet but keep it - maybe for displaying images
    size: image.size,
    type: image.type,
    uploadedAt: serverTimestamp(),  

  };
  //into docs
  await setDoc(doc(db, `users/${user.uid}/images`, unique_id), metadata);

  console.log("Image metadata stored in Firestore:", user.uid, metadata); // check it works

  try {
    const response = await fetch(api.uploadImageFace(user.uid), {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    return {
      ...result,
      firebaseUrl: downloadURL,
      firebaseId: unique_id
   }
  } catch (error) {
     console.error('No Face Detected:', error);
     return {firebaseUrl: downloadURL,
      firebaseId: unique_id,
      error: 'Face processing failed'}
  }

  
}

export const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("User signed in:", result.user); // check if it works
      return result.user;
    } catch (error) {
      console.error("Error Signing in with Google:", error); // no test for error taken yet
      throw error;
    }
  };
  
  export const signOutUser = async () => {
    await signOut(auth);
    console.log("User signed out"); // check if signed out
  };


  export async function createAlbum(userId: string, albumName: string, imageIds: string[], isPublic: boolean = false) {
    const albumId = uuidv4();
    
    // Create private album
    await setDoc(doc(db, `users/${userId}/albums`, albumId), {
      name: albumName,
      imageIds,
     
      createdAt: serverTimestamp()
    });
  
    // Create public version if needed
    if (isPublic) {
      await setDoc(doc(db, `publicAlbums`, albumId), {
        name: albumName,
        imageIds,
        ownerId: userId,
        
        createdAt: serverTimestamp(),
        
        shareableLink: `/share/${albumId}`
      });
    }
  
    return albumId;
  }

  export async function getAlbumImages(userId: string, albumId: string) {
    const albumRef = doc(db, `users/${userId}/albums`, albumId);
    const albumSnap = await getDoc(albumRef);
    
    if (!albumSnap.exists()) {
      throw new Error("Album not found");
    }
  
    const albumData = albumSnap.data();
    const imagesQuery = query(
      collection(db, `users/${userId}/images`),
      where(documentId(), 'in', albumData.imageIds)
    );
  
    const querySnapshot = await getDocs(imagesQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  export async function deleteAlbum(userId: string, albumId: string, isPublic: boolean) {
    // Delete private album
    await deleteDoc(doc(db, `users/${userId}/albums`, albumId));
    
    
    if (isPublic) {
      await deleteDoc(doc(db, 'publicAlbums', albumId));
    }
  }


export const groupByMonth = (images: Image[]) => {
  return images.reduce((groups, image) => {
    const date = new Date(image.uploadedAt?.seconds * 1000);
    const monthYear = date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(image);
    return groups;
  }, {} as Record<string, Image[]>);
};



// should i lowkey be defining this here? -- might edit later on
//STUFF TO NOTE ON FOR THIS FUNCTION
// binary blob - collection of binary data stored as a single entity
export const downloadImage = async (url: string, name: string) => {
  try {
    // 1) fetch the image file based on the downloadurl
    const response = await fetch(url);
    //conver to a blob - basically binary shit
    const blob = await response.blob();
    //create a url for this blob
    const blobUrl = window.URL.createObjectURL(blob);
    //create an a tag(invisible link)
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name || `image-${Date.now()}.jpg`; // forces to actually download instead of navigate
    document.body.appendChild(a);
    a.click(); //triggers the download
    //clear
    window.URL.revokeObjectURL(blobUrl);
    a.remove();
  } catch (error) {
    console.error("Download failed:", error);
    alert("Failed to download image");
  }
};



