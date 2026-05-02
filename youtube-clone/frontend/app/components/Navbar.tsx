"use client";
import { API_URL } from '../config';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, Video, Bell, Upload } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [userPlan, setUserPlan] = useState('Free');
  const [userName, setUserName] = useState('U');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const syncUserProfile = async () => {
      const email = localStorage.getItem("userEmail");
      if (!email || email === "null" || email === "undefined") return;
      try {
        const cachedPlan = localStorage.getItem("userPlan");
        const cachedName = localStorage.getItem("userName");
        if (cachedPlan) setUserPlan(cachedPlan);
        if (cachedName) setUserName(cachedName);
        const res = await fetch(`${API_URL}/api/auth/profile?email=${email}`);
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("userPlan", data.plan);
          localStorage.setItem("userName", data.name);
          setUserPlan(data.plan);
          setUserName(data.name);
        }
      } catch (err) { console.warn("Navbar: backend unreachable, using cached profile"); }
    };
    syncUserProfile();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const planColors: Record<string, string> = {
    Gold:   'bg-yellow-400/20 border-yellow-400 text-yellow-500',
    Silver: 'bg-slate-400/20 border-slate-400 text-slate-400',
    Bronze: 'bg-orange-400/20 border-orange-400 text-orange-400',
    Free:   'bg-white/5 border-white/10 text-gray-400 dark:text-gray-500',
  };

  return (
    <header className={`flex justify-between items-center px-4 md:px-6 h-14 sticky top-0 z-50
      bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl
      border-b border-gray-200/80 dark:border-white/5
      transition-all duration-300
      ${scrolled ? 'shadow-md dark:shadow-black/40' : 'shadow-none'}`}>

      {/* LEFT — Logo */}
      <div className="flex items-center gap-3 min-w-[160px]">
        <Link href="/home" className="flex items-center gap-2 group select-none">
          <div className="bg-red-600 group-hover:bg-red-500 rounded-lg w-7 h-5 flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-sm shadow-red-600/30">
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
          </div>
          <span className="text-[18px] font-black tracking-tighter text-gray-900 dark:text-white">YouClone</span>
        </Link>
      </div>

      {/* CENTER — Search */}
      <div className="hidden sm:flex items-center flex-1 max-w-[600px] mx-6">
        <form onSubmit={handleSearch} className="flex w-full items-center">
          <div className="flex flex-1 items-center bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-[#303030] rounded-l-full px-4 py-0 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all duration-200">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white"
            />
          </div>
          <button type="submit"
            className="bg-gray-100 dark:bg-[#222] border border-l-0 border-gray-200 dark:border-[#303030] px-5 py-2 rounded-r-full hover:bg-gray-200 dark:hover:bg-[#333] transition-colors duration-200 group">
            <Search size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white transition-colors" />
          </button>
        </form>
      </div>

      {/* RIGHT — Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Plan badge */}
        <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${planColors[userPlan] || planColors.Free}`}>
          {userPlan !== 'Free' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
          {userPlan}
        </div>

        {/* Video call */}
        <button onClick={() => router.push('/call')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 group">
          <Video size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
        </button>

        {/* Upload */}
        <button onClick={() => router.push('/upload')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 group">
          <Upload size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
        </button>

        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 group relative">
          <Bell size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white dark:border-[#0f0f0f]" />
        </button>

        {/* Avatar */}
        <button onClick={() => router.push('/profile')}
          className="w-9 h-9 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center font-black text-white text-sm ml-1 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/20">
          {userName ? userName.charAt(0).toUpperCase() : 'U'}
        </button>
      </div>
    </header>
  );
}
