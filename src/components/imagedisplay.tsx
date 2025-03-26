import React, { useEffect, useState } from "react";
import { auth, db } from "../lib/firebaseConfig"; // maybe storage too bruh
import { collection, query, getDocs } from "firebase/firestore"; // will need "where" for sorting images

const UserImages = () => {
  const [images, setImages] = useState<any[]>([]);
  // need it to display the image once uplaoded
  // real time observation
  // onsnapshot?
  useEffect(() => {
    const fetchImages = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, `users/${user.uid}/images`));
      const querySnapshot = await getDocs(q);

      // we need to extract the actual image from the doc
      // idea: get the metadata that has the download url poitning to the firebase storage
      //confirm: downloadurl works
      const imageList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setImages(imageList);
    };

    fetchImages();
  }, []);

  return (
    <div>
      <h2>Images</h2>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {images.map((img) => (
          <div key={img.id} style={{ margin: "10px" }}>
            <img src={img.url} alt={img.name} style={{ width: "200px" }} />
            <p>{img.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserImages;
