// first dynamic routing file
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface PageProps {
  params: { albumId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return {
    title: `Album ${params.albumId}`,
  };
}

export default async function SharedAlbumPage({ params }: PageProps) {
  try {
    // Access params directly - no need to await
    const { albumId } = params;

    //get the album data
    const albumRef = doc(db, "publicAlbums", albumId);
    const albumSnap = await getDoc(albumRef);

    if (!albumSnap.exists()) {
      return notFound();
    }

    const album = albumSnap.data();

    //display images - have to get from the storage for each image cool
    const images = await Promise.all(
      album.imageIds.map(async (imageId: string) => {
        const imageRef = doc(db, `users/${album.ownerId}/images`, imageId);
        const imageSnap = await getDoc(imageRef);
        return imageSnap.exists() ? { id: imageId, ...imageSnap.data() } : null;
      })
    ).then((results) => results.filter(Boolean));

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">{album.name}</h1>
        <p className="text-gray-600 mb-4">
          Shared album with {images.length} photos
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt={img.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading album:", error);
    return notFound();
  }
}
