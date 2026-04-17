"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = ["All", "Music", "Gaming", "Movies", "News", "Sports", "Technology", "Comedy", "Education", "Science"];

export default function HomeDashboard() {
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const uRes = await fetch(`http://localhost:5000/api/auth/profile?email=${email}`);
        const userData = await uRes.json();
        setUser(userData);

        const vRes = await fetch('http://localhost:5000/api/videos');
        const vData = await vRes.json();
        setVideos(vData);
      } catch (err) {
        console.error("Home fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetch();
  }, [router]);

  useEffect(() => {
    const location = localStorage.getItem("userLocation");
    if (location?.toLowerCase().includes("secunderabad") || location?.toLowerCase().includes("hyderabad")) {
      console.log("📍 Connected to Primary Secunderabad Node");
    }
  }, []);

  // 🚀 FIX 1: Loading screen now supports Light/Dark mode transitions
  if (loading) return (
    <div className="h-full min-h-[calc(100vh-64px)] bg-white dark:bg-[#050505] flex items-center justify-center transition-colors duration-700">
      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
    </div>
  );

  return (
    // 🚀 FIX 2: Upgraded background to #050505 to match the Studio UI
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white transition-colors duration-700">
      
      {/* 🚀 FIX 3: Category Chips Container - Glassmorphic sync */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md py-3 px-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-white/5 transition-colors duration-700">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-300 ${
              activeCategory === cat 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8">
        {/* HEADER INFO */}
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase opacity-20 italic">YouClone</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                user?.plan === 'Gold' ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 
                user?.plan === 'Silver' ? 'bg-gray-300 text-black' : 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]'
              }`}>
                {user?.plan || 'Free'} Tier
              </span>
            </div>
          </div>
          <Link href="/profile" className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg hover:scale-110 transition-transform border border-white/10">
            {user?.name?.[0] || 'U'}
          </Link>
        </header>

        {/* VIDEO GRID */}
        {videos.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-white/10 rounded-3xl transition-colors duration-700">
            <p className="opacity-40 font-bold tracking-widest uppercase text-xs">Waiting for local stream...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
            {videos.map((v: any) => (
              <Link key={v._id} href={`/watch/${v._id}`} className="group cursor-pointer">
                {/* 🚀 FIX 4: Replaced harsh #272727 gray with elegant white/5 */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5 transition-colors duration-700">
                  <img 
                    src={v.thumbnailUrl || `http://localhost:5000/uploads/thumb_${v._id}.jpg`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">10:24</span>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0 flex items-center justify-center font-bold text-xs uppercase transition-colors duration-700 text-gray-700 dark:text-gray-200">
                    {v.channelName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {v.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 transition-colors duration-700">{v.channelName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-700">45K views • {v.createdAt ? 'Just now' : '1 day ago'}</p>
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