"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize states with local storage values if they exist to prevent empty UI
  const [userPlan, setUserPlan] = useState('Free');
  const [userName, setUserName] = useState('U');

  useEffect(() => {
    const syncUserProfile = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        if (!email) return;

        // Immediately set UI from local cache while we wait for fresh data
        const cachedPlan = localStorage.getItem("userPlan");
        const cachedName = localStorage.getItem("userName");
        if (cachedPlan) setUserPlan(cachedPlan);
        if (cachedName) setUserName(cachedName);

        const res = await fetch(`http://localhost:5000/api/auth/profile?email=${email}`);
        
        if (res.ok) {
          const data = await res.json();
          // 🔥 Sync Storage + State with fresh DB data
          localStorage.setItem("userPlan", data.plan);
          localStorage.setItem("userName", data.name);
          localStorage.setItem("userLocation", data.location);
          
          setUserPlan(data.plan);
          setUserName(data.name);
        } else {
          console.warn("Node Sync: Backend unreachable, using cached data.");
        }
      } catch (err) {
        console.error("Navbar Sync Error:", err);
      }
    };

    syncUserProfile();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${searchQuery}`);
  };

  // Helper to get the first letter for the Avatar
  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="flex justify-between items-center px-4 h-14 sticky top-0 z-50 transition-all duration-500
                        bg-white dark:bg-[#0f0f0f] text-[#0f0f0f] dark:text-white border-b border-transparent dark:border-white/10 shadow-sm">
      
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-black/5 dark:hover:bg-[#272727] rounded-full transition-colors hidden sm:block">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <Link href="/home" className="flex items-center gap-1 group">
          <div className="bg-red-600 rounded-lg w-7 h-5 flex items-center justify-center group-hover:bg-red-500 transition-colors">
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
          </div>
          <span className="text-xl font-bold tracking-tighter">YouClone</span>
        </Link>
      </div>

      <div className="hidden sm:flex items-center flex-1 max-w-[720px] ml-10">
        <form onSubmit={handleSearch} className="flex flex-1 items-center">
          <div className="flex flex-1 items-center bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#303030] rounded-l-full px-4 py-0.5 focus-within:border-blue-500 ml-8 shadow-inner">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search " 
              className="w-full bg-transparent px-2 py-1.5 focus:outline-none placeholder-gray-400 text-inherit"
            />
          </div>
          <button type="submit" className="bg-gray-100 dark:bg-[#222222] border border-l-0 border-gray-300 dark:border-[#303030] px-5 py-2 rounded-r-full hover:bg-gray-200 dark:hover:bg-[#303030] transition-colors">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 pr-2">
        {/* Tier Badge: Task 2/3 Visibility */}
        <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border
                        ${userPlan !== 'Free' 
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-600 dark:text-yellow-500' 
                          : 'bg-black/5 dark:bg-[#272727] border-gray-300 dark:border-[#3f3f3f]'}`}>
          <span className="text-[10px] uppercase font-black opacity-60">TIRE:</span>
          <span className="text-[11px] font-black uppercase tracking-tight">{userPlan}</span>
        </div>
        
        {/* VoIP Navigation: Task 6 */}
        <button onClick={() => router.push('/call')} className="p-2 hover:bg-black/5 dark:hover:bg-[#272727] rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
        
        {/* Profile Avatar: Task 4 */}
        <div 
          onClick={() => router.push('/profile')}
          className="w-9 h-9 bg-gradient-to-br from-red-600 to-purple-600 rounded-xl flex items-center justify-center font-black text-white text-sm ml-2 cursor-pointer shadow-lg hover:scale-110 transition-transform"
        >
          {getInitial(userName)}
        </div>
      </div>
    </header>
  );      
}