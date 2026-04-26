"use client";
import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Save, MapPin, Zap, LogOut, ShieldCheck, Mail, History, Download, PlayCircle, Settings, Camera } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    handle: '',
    description: '',
    location: '',
    email: ''
  });
  
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

useEffect(() => {
  const fetchProfile = async () => {
    const email = localStorage.getItem('userEmail');
    const token = localStorage.getItem('token');

    // 🛑 GUARD: Redirect if no session exists
    if (!token || !email || email === "null") {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/profile?email=${email}`);
      if (!res.ok) throw new Error("Profile node unreachable");

      const userData = await res.json();
      setUser(userData);
      
      // Task 4: Sync local storage with fresh DB data
      localStorage.setItem('userPlan', userData.plan);
      localStorage.setItem('userLocation', userData.location);

      setFormData({ 
        name: userData.name || 'User Node', 
        handle: userData.handle || userData.email.split('@')[0],
        description: userData.description || '',
        location: userData.location || 'Secunderabad',
        email: userData.email
      });
    } catch (err) {
      console.error("Profile Load Error:", err);
      // Fallback: If DB is down, use whatever is in localStorage
      setUser({ name: localStorage.getItem('userName'), plan: localStorage.getItem('userPlan') });
    } finally {
      // 🚀 CRITICAL: Ensure loading is set to false immediately
      setLoading(false);
    }
  };

  fetchProfile();
}, [router]);

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // @ts-ignore
body: JSON.stringify({ email: user.email, ...formData })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser); 
        localStorage.setItem('userName', formData.name);
        localStorage.setItem('userLocation', formData.location);
        alert("✅ Successfully updated!");
        setActiveTab('home'); 
      }
    } catch (err) { alert("❌ Sync Error"); }
  };

  const handleLogout = () => {
    localStorage.clear(); 
    router.push('/');
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] bg-white dark:bg-[#050505] flex flex-col items-center justify-center transition-colors duration-700">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-[#050505] text-black dark:text-white selection:bg-red-500/30 pb-20 transition-colors duration-700">
      
      {/* 1. MAIN CHANNEL BANNER */}
      <div className="w-full h-48 md:h-64 lg:h-80 relative bg-gray-200 dark:bg-gray-900 overflow-hidden group transition-colors duration-700">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
          alt="Channel Banner" 
          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#050505] via-transparent to-transparent transition-colors duration-700" />
        
        {/* Banner Edit Overlay */}
        <div className="absolute top-4 right-4 bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black/80 backdrop-blur-md p-2.5 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-all shadow-lg border border-gray-200 dark:border-white/10">
          <Camera size={20} className="text-black dark:text-white" />
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 2. CHANNEL INFO HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mt-[-40px] md:mt-6 relative z-10">
          
          {/* Avatar */}
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-red-600 to-purple-800 flex items-center justify-center text-4xl md:text-6xl font-bold text-white shadow-2xl border-4 border-gray-50 dark:border-[#050505] flex-shrink-0 transition-colors duration-700 overflow-hidden">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={28} className="text-white" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 pt-2 md:pt-0">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1">{user?.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-[#aaaaaa] mb-3 transition-colors duration-700">
              <span className="font-bold">@{formData.handle || user?.email?.split('@')[0] || 'loading...'}</span>
              <span className="opacity-50">•</span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-500 font-bold"><MapPin size={14}/> {user?.location} Node</span>
              <span className="opacity-50">•</span>
              <span className="flex items-center gap-1 font-bold bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md border border-gray-200 dark:border-transparent"><Zap size={12} className="text-yellow-600 dark:text-yellow-500"/> {user?.plan} Tier</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-[#aaaaaa] max-w-2xl line-clamp-2 transition-colors duration-700">
              {formData.description || `Welcome to the official YouClone channel for ${user?.name}. This node is configured for high-speed streaming, offline caching, and encrypted VoIP communication.`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={() => setActiveTab('settings')}
              className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-black dark:text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm"
            >
              Customize Channel
            </button>
            <Link 
              href="/upgrade"
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all text-center shadow-lg shadow-blue-600/20"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>

        {/* 3. YOUTUBE STYLE NAVIGATION TABS */}
        <div className="flex gap-8 mt-10 border-b border-gray-200 dark:border-white/10 text-sm font-bold overflow-x-auto hide-scrollbar transition-colors duration-700">
          {['home', 'offline', 'history', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 uppercase tracking-wider relative whitespace-nowrap transition-colors duration-300 ${activeTab === tab ? 'text-black dark:text-white' : 'text-gray-500 hover:text-black dark:text-[#aaaaaa] dark:hover:text-white'}`}
            >
              {tab === 'home' ? 'Home' : tab === 'offline' ? 'Downloads' : tab === 'history' ? 'Watch History' : tab === 'settings' ? 'Customization' : ''}
              {activeTab === tab && (
                <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[3px] bg-black dark:bg-white rounded-t-full transition-colors duration-700" />
              )}
            </button>
          ))}
        </div>

        {/* 4. TAB CONTENT AREA */}
        <div className="py-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                <div className="flex flex-col md:flex-row gap-6 border-b border-gray-200 dark:border-white/10 pb-10 transition-colors duration-700">
                  <div className="w-full md:w-[420px] aspect-video bg-white dark:bg-[#111] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group border border-gray-200 dark:border-white/5 shadow-xl dark:shadow-none transition-colors duration-700">
                     <ShieldCheck size={48} className="text-gray-400 dark:text-[#aaaaaa] mb-3 group-hover:scale-110 transition-transform duration-500" />
                     <p className="text-sm text-gray-500 dark:text-[#aaaaaa] font-bold tracking-widest uppercase">Node Diagnostics</p>
                     <div className="absolute bottom-3 left-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase backdrop-blur-md">Secure Connection</div>
                  </div>
                  <div className="flex flex-col justify-center max-w-xl">
                    <h3 className="text-2xl font-black mb-3">YouClone System Status: Optimal</h3>
                    <p className="text-sm text-gray-600 dark:text-[#aaaaaa] mb-6 leading-relaxed transition-colors duration-700">
                      Your current plan is <span className="text-black dark:text-white font-bold">{user?.plan}</span>. 
                      You have used <span className="text-red-600 font-bold">{user?.dailyDownloadCount || 0}</span> daily downloads. 
                      {user?.plan === 'Free' ? " Upgrade to Gold for unlimited premium access." : " Enjoy your premium access!"}
                    </p>
                    <div className="flex gap-3">
                      <Link href="/home" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-sm font-bold transition-colors shadow-lg shadow-red-600/20">
                        <PlayCircle size={18} /> Start Streaming
                      </Link>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2">Recent Offline Downloads <Download size={20} className="text-gray-400 dark:text-[#aaaaaa]" /></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    <div className="flex flex-col gap-3 group cursor-pointer">
                      <div className="relative aspect-video bg-gray-200 dark:bg-[#111] rounded-2xl overflow-hidden border border-transparent dark:border-white/5 transition-colors duration-700">
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-all duration-300">
                          <PlayCircle size={40} className="text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-bold tracking-widest uppercase">Local</div>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Sample Output Buffer</h4>
                        <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mt-1 transition-colors duration-700">Ready for playback • 142 MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 🚀 THE FIXED SETTINGS TAB (YouTube Studio Style) */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl">
                
                <div className="mb-8">
                  <h3 className="text-2xl font-black mb-2 text-black dark:text-white transition-colors duration-700">Basic info</h3>
                  <p className="text-sm text-gray-500 dark:text-[#aaaaaa] transition-colors duration-700">Choose your channel name, handle, and tell viewers about your content.</p>
                </div>

                <div className="space-y-8 max-w-2xl">
                  {/* Name Input */}
                  <div>
                    <label className="text-sm font-bold mb-2 block text-black dark:text-white">Name</label>
                    <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mb-3">Choose a channel name that represents you and your content. Changes made here will be reflected across YouClone.</p>
                    <input 
                      className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-[#3f3f3f] text-black dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                      value={formData.name || ''} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>

                  {/* Handle Input */}
                  <div>
                    <label className="text-sm font-bold mb-2 block text-black dark:text-white">Handle</label>
                    <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mb-3">Choose your unique handle by adding letters and numbers. You can change your handle back within 14 days.</p>
                    <div className="flex">
                      <span className="bg-gray-100 dark:bg-[#111] border border-r-0 border-gray-300 dark:border-[#3f3f3f] text-gray-500 rounded-l-lg px-4 py-3 flex items-center transition-colors">@</span>
                      <input 
                        className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-[#3f3f3f] text-black dark:text-white rounded-r-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                        value={formData.handle || ''} 
                        onChange={(e) => setFormData({...formData, handle: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Description Input */}
                  <div>
                    <label className="text-sm font-bold mb-2 block text-black dark:text-white">Description</label>
                    <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mb-3">Tell viewers about your channel. Your description will show up in the About section of your channel and search results.</p>
                    <textarea 
                      rows={5} 
                      className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-[#3f3f3f] text-black dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      value={formData.description || ''} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>

                  {/* Node Region Input */}
                  <div>
                    <label className="text-sm font-bold mb-2 block text-black dark:text-white">Transmission Region</label>
                    <input 
                      className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-[#3f3f3f] text-black dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                      value={formData.location || ''} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})} 
                    />
                  </div>

                  {/* Contact Info (Read Only) */}
                  <div>
                    <label className="text-sm font-bold mb-2 block text-black dark:text-white">Contact info</label>
                    <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mb-3">Let people know how to contact you with business inquiries.</p>
                    <input 
                      disabled 
                      className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-gray-500 dark:text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed transition-colors"
                      value={formData.email || 'user@youclone.node'} 
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button onClick={handleLogout} className="text-red-600 hover:text-red-500 font-bold text-sm transition-colors flex items-center gap-2">
                      <LogOut size={16} /> Logout
                    </button>
                    <div className="flex gap-4 w-full sm:w-auto">
                      <button onClick={() => setActiveTab('home')} className="font-bold text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors px-4 py-2">
                        Cancel
                      </button>
                      <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors shadow-lg">
                        save changes
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* REDIRECT TABS */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 transition-colors duration-700">
                <History size={48} className="text-gray-400 dark:text-[#aaaaaa] mb-4" />
                <h3 className="text-xl font-black mb-2 text-black dark:text-white">Watch History is tracked separately</h3>
                <Link href="/history" className="text-blue-600 dark:text-blue-500 hover:underline font-bold tracking-wide">Go to History Page →</Link>
              </motion.div>
            )}

            {activeTab === 'offline' && (
              <motion.div key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 transition-colors duration-700">
                <Download size={48} className="text-gray-400 dark:text-[#aaaaaa] mb-4" />
                <h3 className="text-xl font-black mb-2 text-black dark:text-white">Your Offline Library</h3>
                <p className="text-sm text-gray-500 dark:text-[#aaaaaa] font-medium">Videos downloaded will appear in your system's native downloads folder.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
