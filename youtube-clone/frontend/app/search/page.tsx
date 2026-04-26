"use client";
import { API_URL } from '../config';
import { useEffect, useState, Suspense } from "react";  
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search as SearchIcon, Play, Loader2 } from "lucide-react";

// We wrap the main logic in a component to use useSearchParams safely
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/search/v?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchResults();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Scanning Node Database...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3">
        <SearchIcon className="text-red-600" size={32} /> Search Results
      </h1>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-10 border-b border-gray-200 dark:border-white/5 pb-4">
        Query: <span className="text-red-500">"{query}"</span> • Found {results.length} matches
      </p>

      {results.length === 0 ? (
        <div className="text-center opacity-40 mt-20">
          <SearchIcon size={48} className="mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold">No results found</h2>
          <p className="text-[10px] font-black uppercase tracking-widest mt-2">Try adjusting your search parameters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((video) => (
            <Link href={`/watch/${video._id}`} key={video._id} className="group flex flex-col gap-3">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/5">
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={32} fill="white" className="text-white drop-shadow-lg" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded-md text-[10px] font-black text-white uppercase tracking-wider">
                  Node Stream
                </div>
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight group-hover:text-red-500 transition-colors line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-xs font-bold opacity-60 mt-1">{video.channelName}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-1">
                  {video.views?.toLocaleString()} views
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-[#050505] text-black dark:text-white p-6 md:p-12 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Suspense is required by Next.js when using useSearchParams */}
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-600"/></div>}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}