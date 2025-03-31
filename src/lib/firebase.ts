//Update on this
// Looking good -- made changes so far
// Handles storage, database and auth backend

import { storage, db,auth,provider } from "./firebaseConfig";  
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp, getDoc, collection, query, documentId, where, getDocs, deleteDoc } from "firebase/firestore";
import {v4 as uuidv4} from "uuid"; // npm install uuid - done
import { signInWithPopup, signOut } from "firebase/auth";

// let us call the detectlabels api

//DO WE NEED THIS?

// async function detectlabels(imagepath:string) {
//   const apiurl = '/api/detectlabels';

//   try{
//     const response = await fetch(apiurl,{method: 'POST',headers:{'Content-Type': 'application/json'},body:JSON.stringify({imagepath})})
//     if(!response.ok){
//       throw new Error(`API called and resulted in ${response.status}`);
//     }
//     return await response.json();
//   }catch(error){
//     throw new Error(`Error runnung API`)
//   }
// }
  


// unique key bruh for storage and database - done
export async function uploadImage(image: File) {
  if (!image) throw new Error("No image file provided"); // Upload is greyed out if no image in CSS
  const user = auth.currentUser;
  if(!user) throw new Error("User not authenticated"); // probably never has this issue since Auth is the first page but just keep it for now
  const unique_id = uuidv4();
 
  const storage_ref = ref(storage, `users/${user.uid}images/${unique_id}`);  

 
  const snapshot = await uploadBytes(storage_ref, image);
  const downloadURL = await getDownloadURL(snapshot.ref);

  //get labels for the data 
  //meant to take in a path
  // const labels = await detectlabels(downloadURL)

  //vectorise the labelsor upsert into database
  // const vectors = ;

  // Two Options
  //- Sort by labels
  // Sort by Vector similarity - involves some cosine and sin 

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

  await setDoc(doc(db, `users/${user.uid}/images`, unique_id), metadata);

  console.log("Image metadata stored in Firestore:", user.uid, metadata); // check it works

  return { id: unique_id, url: downloadURL };
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


  