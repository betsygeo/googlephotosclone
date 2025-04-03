import { FiSearch, FiImage } from "react-icons/fi";

interface Image {
  id: string;
  url: string;
  storage_path: string;
  uploaded_at: string;
  faces: string[];
  named_faces: string[];
}

export function SearchGrid({
  images,
  searchName,
}: {
  images: Image[];
  searchName: string;
}) {
  if (!images || images.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Search results for "{searchName}"
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FiImage className="text-gray-400 text-4xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No photos found</h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">
        Search results for "{searchName}"
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-2">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square group">
            <a href={img.url} target="_blank" rel="noopener noreferrer">
              <img
                src={img.url}
                className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
              />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchGrid;
