import { useEffect, useState } from "react";
import { auth } from "../lib/firebaseConfig";
import { api } from "@/lib/firebase";

type FaceData = {
  face_id: string;
  name?: string;
  image_ref: string;
};

type FaceCrop = {
  face_id: string;
  image_url: string;
  name?: string;
  image_ref: string;
};

export function PeopleGrid() {
  const [faceCrops, setFaceCrops] = useState<FaceCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const fetchFaceCrops = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const FaceResponse = await fetch(api.getFaces(user.uid));
        const facesData = await FaceResponse.json();
        const crops = await Promise.all(
          facesData?.faces?.map(async (face: FaceData) => {
            const cropResponse = await fetch(
              api.getFaceCrop(user.uid, face.face_id)
            );
            return {
              face_id: face.face_id,
              image_url: URL.createObjectURL(await cropResponse.blob()),
              name: face.name,
              image_ref: face.image_ref,
            };
          })
        );

        setFaceCrops(crops);
      } catch (error) {
        console.error("Error fetching face crops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaceCrops();
  }, []);
  const handleNaming = async (face_id: string, nameInput: string) => {
    if (!nameInput.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const response = await fetch(api.nameFace(user.uid, face_id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to name face: ${errorText}`);
      }

      setFaceCrops((prevCrops) =>
        prevCrops.map((crop) =>
          crop.face_id === face_id ? { ...crop, name: nameInput.trim() } : crop
        )
      );

      setEditingId(null);
      setNameInput("");
    } catch (error) {
      console.error("Naming error:", error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {faceCrops.map((crop) => (
        <div key={crop.face_id} className="group relative">
          {/* Container for image and name */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-square relative">
              <img
                src={crop.image_url}
                alt={`Face ${crop.face_id}`}
                className="w-full h-[250px] object-contain rounded-xl "
              />
            </div>
            {/* Display name below the image */}
            {crop.name ? (
              <div className="bg-pink-200 text-center py-1 mt-2 rounded-full text-sm w-full">
                {crop.name}
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                {editingId === crop.face_id ? (
                  <input
                    type="text"
                    placeholder="Enter name"
                    className="border rounded px-2 py-1 text-sm"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleNaming(crop.face_id, nameInput);
                        setEditingId(null);
                      }
                    }}
                  />
                ) : (
                  <div className="bg-pink-200 text-center py-1 mt-1 rounded-full text-sm w-full px-2 ">
                    <button
                      onClick={() => setEditingId(crop.face_id)}
                      className="text-black w-full cursor-pointer"
                    >
                      Set Name
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PeopleGrid;
