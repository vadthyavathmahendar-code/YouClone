"use client";
import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = ["All","Music","Gaming","Movies","News","Sports","Technology","Comedy","Education","Science"];

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-video rounded-2xl skeleton" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full skeleton flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-3.5 rounded-full skeleton w-full" />
          <div className="h-3 rounded-full skeleton w-2/3" />
          <div className="h-3 rounded-full skeleton w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function HomeDashboard() {
  const [videos, setVideos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      if (!token) { router.push('/login'); return; }
      try {
        const [uRes, vRes] = await Promise.all([
          fetch(`${API_URL}/api/auth/profile?email=${email}`),
          fetch(`${API_URL}/api/videos`)
        ]);
        const [userData, vData] = await Promise.all([uRes.json(), vRes.json()]);
        setUser(userData);
        setVideos(vData);
      } catch (err) {
        console.error("Home fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetch();
  }, [router]);

  const planBadge: Record<string, string> = {
    Gold:   'bg-yellow-400 text-black shadow-yellow-400/40',
    Silver: 'bg-slate-300 text-black shadow-slate-300/30',
    Bronze: 'bg-orange-400 text-black shadow-orange-400/30',
    Free:   'bg-red-600 text-white shadow-red-600/30',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white">

      {/* Category chips */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-xl
                      border-b border-gray-100 dark:border-white/5 px-4 py-2.5
                      flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ animationDelay: `${i * 30}ms` }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap
              transition-all duration-200 hover:scale-105 active:scale-95 animate-fadeInUp
              ${activeCategory === cat
                ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-8">
        {/* Header */}
        <header className="mb-8 flex justify-between items-center animate-fadeInUp">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
              {activeCategory === "All" ? "For You" : activeCategory}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
              {loading ? "Loading..." : `${videos.length} videos`}
            </p>
          </div>
          <Link href="/profile"
            className="flex items-center gap-2.5 group">
            <div className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-md transition-all duration-200 group-hover:scale-105 ${planBadge[user?.plan || 'Free'] || planBadge.Free}`}>
              {user?.plan || 'Free'}
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md group-hover:scale-110 transition-transform duration-200 border-2 border-white/20">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </Link>
        </header>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl animate-fadeInUp">
            <p className="text-gray-400 dark:text-gray-600 font-bold tracking-widest uppercase text-xs">No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8 stagger">
            {videos.map((v: any, i: number) => (
              <Link
                key={v._id}
                href={`/watch/${v._id}`}
                className="video-card group cursor-pointer animate-fadeInUp"
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 shadow-sm group-hover:shadow-xl dark:group-hover:shadow-black/50 transition-shadow duration-300">
                  <img
                    src={v.thumbnailUrl || `${API_URL}/uploads/thumb_${v._id}.jpg`}
                    alt={v.title}
                    className="thumb-img w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-gray-900 border-b-[8px] border-b-transparent ml-1" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    10:24
                  </span>
                </div>

                {/* Info */}
                <div className="flex gap-3 mt-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                    {v.channelName?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
                      {v.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">{v.channelName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                      {Math.floor(Math.random() * 900 + 100)}K views · {v.createdAt ? 'Recently' : '2 days ago'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
