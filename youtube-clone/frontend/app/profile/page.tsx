"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Save, MapPin, Zap, LogOut, ShieldCheck, Mail, History, Download, PlayCircle, Settings, Camera } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const email = localStorage.getItem('userEmail');
      const token = localStorage.getItem('token');

      if (!token || !email) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/auth/profile?email=${email}`);
        const userData = await res.json();
        
        setUser(userData);
        setFormData({ 
          name: userData.name || 'User Node', 
          location: userData.location || 'Secunderabad' 
        });

        localStorage.setItem('userPlan', userData.plan);
      } catch (err) {
        console.error("Profile Load Error:", err);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchProfile();
  }, [router]);
const handleSave = async () => {
  try {
    const res = await fetch(`http://localhost:5000/api/auth/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, ...formData })
    });

    if (res.ok) {
      const updatedUser = await res.json(); // Backend returns the new user object
      setUser(updatedUser); 
      setIsEditing(false);
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userLocation', formData.location);
      alert("✅ Node Configuration Published!");
      setActiveTab('home'); // Switch back to home to see changes
    }
  } catch (err) { alert("❌ Sync Error"); }
};

  const handleLogout = () => {
    localStorage.clear(); 
    router.push('/');
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-56px)] bg-[#0f0f0f] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0f0f0f] text-white selection:bg-red-600 pb-20">
      
      {/* 1. CHANNEL BANNER */}
      <div className="w-full h-48 md:h-64 lg:h-80 relative bg-gray-900 overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
          alt="Channel Banner" 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
        
        {/* Banner Edit Overlay */}
        <div className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={20} className="text-white" />
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 2. CHANNEL INFO HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mt-[-40px] md:mt-6 relative z-10">
          
          {/* Avatar */}
          <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-red-600 to-purple-800 flex items-center justify-center text-4xl md:text-7xl font-bold text-white shadow-2xl border-4 border-[#0f0f0f] flex-shrink-0">
  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
</div>

          {/* Details */}
          <div className="flex-1 pt-2 md:pt-0">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-1">{user?.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#aaaaaa] mb-3">
              <span>@{user?.email ? user.email.split('@')[0] : 'loading...'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-red-500 font-medium"><MapPin size={14}/> {user?.location} Node</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium bg-white/10 px-2 py-0.5 rounded-md"><Zap size={12} className="text-yellow-500"/> {user?.plan} Tier</span>
            </div>
            <p className="text-sm text-[#aaaaaa] max-w-2xl line-clamp-2">
              Welcome to the official YouClone channel for {user?.name}. This node is configured for high-speed streaming, offline caching, and encrypted VoIP communication.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={() => setActiveTab('settings')}
              className="flex-1 md:flex-none bg-[#272727] hover:bg-[#3f3f3f] text-white px-4 py-2.5 rounded-full font-medium text-sm transition-colors"
            >
              Customize Node
            </button>
            <Link 
              href="/upgrade"
              className="flex-1 md:flex-none bg-white hover:bg-gray-200 text-black px-4 py-2.5 rounded-full font-medium text-sm transition-colors text-center"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>

        {/* 3. YOUTUBE STYLE NAVIGATION TABS */}
        <div className="flex gap-8 mt-8 border-b border-white/10 text-sm font-medium overflow-x-auto hide-scrollbar">
          {['home', 'offline', 'history', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 uppercase tracking-wider relative whitespace-nowrap transition-colors ${activeTab === tab ? 'text-white' : 'text-[#aaaaaa] hover:text-white'}`}
            >
              {tab === 'home' ? 'Home' : tab === 'offline' ? 'Downloads' : tab === 'history' ? 'Watch History' : 'Settings'}
              {activeTab === tab && (
                <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[3px] bg-white rounded-t-full" />
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
                
                {/* Featured Area */}
                <div className="flex flex-col md:flex-row gap-6 border-b border-white/10 pb-8">
                  <div className="w-full md:w-[420px] aspect-video bg-[#272727] rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
                     <ShieldCheck size={48} className="text-[#aaaaaa] mb-2" />
                     <p className="text-sm text-[#aaaaaa] font-medium">Node Diagnostics</p>
                     <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-xs">Secure Connection</div>
                  </div>
                  <div className="flex flex-col justify-center max-w-xl">
                    <h3 className="text-xl font-bold mb-2">YouClone System Status: Optimal</h3>
                    <p className="text-sm text-[#aaaaaa] mb-4 leading-relaxed">
  Your current plan is <span className="text-white font-bold">{user?.plan}</span>. 
  You have used <span className="text-red-500 font-bold">{user?.dailyDownloadCount || 0}</span> daily downloads. 
  {user?.plan === 'Free' ? "Upgrade to Gold for unlimited access." : "Enjoy your premium access!"}
</p>
                    <div className="flex gap-3">
                      <Link href="/home" className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                        <PlayCircle size={18} /> Start Streaming
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Simulated Horizontal Scroll Row */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Recent Offline Caches <Download size={18} className="text-[#aaaaaa]" /></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Placeholder Video Card */}
                    <div className="flex flex-col gap-2 group cursor-pointer">
                      <div className="relative aspect-video bg-[#272727] rounded-xl overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                          <PlayCircle size={32} />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/80 text-xs px-1.5 py-0.5 rounded font-medium">Local</div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm line-clamp-2">Sample Output Buffer</h4>
                        <p className="text-xs text-[#aaaaaa] mt-1">Ready for playback</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SETTINGS TAB (Editing) */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl">
                <div className="bg-[#181818] border border-white/10 rounded-2xl p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings size={20} /> Channel Configuration</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs text-[#aaaaaa] uppercase tracking-wider font-bold mb-2 block">Channel Name</label>
                      <input 
                        className="w-full bg-transparent border border-[#3f3f3f] rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                      <p className="text-xs text-[#aaaaaa] mt-2">Changes to your name will be reflected across YouClone nodes.</p>
                    </div>

                    <div>
                      <label className="text-xs text-[#aaaaaa] uppercase tracking-wider font-bold mb-2 block">Node Region </label>
                      <input 
                        className="w-full bg-transparent border border-[#3f3f3f] rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-white/10">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium text-sm transition-colors"
                      >
                        <LogOut size={16} /> Logout
                      </button>

                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-colors"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* REDIRECT TABS */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
                <History size={48} className="text-[#aaaaaa] mb-4" />
                <h3 className="text-xl font-bold mb-2">Watch History is tracked separately</h3>
                <Link href="/history" className="text-blue-500 hover:text-blue-400 font-medium">Go to History Page →</Link>
              </motion.div>
            )}

            {activeTab === 'offline' && (
              <motion.div key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
                <Download size={48} className="text-[#aaaaaa] mb-4" />
                <h3 className="text-xl font-bold mb-2">Your Offline Library</h3>
                <p className="text-sm text-[#aaaaaa]">Videos downloaded will appear in your system's native downloads folder.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}