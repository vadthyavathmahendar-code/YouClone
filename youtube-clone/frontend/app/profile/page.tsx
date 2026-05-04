"use client";
import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Zap, LogOut, History, Download,
  PlayCircle, Camera, Check, X, Crown, Edit2
} from 'lucide-react';

const PLAN_COLORS: Record<string, string> = {
  Gold:   'bg-yellow-400 text-black',
  Silver: 'bg-slate-300 text-black',
  Bronze: 'bg-orange-400 text-black',
  Free:   'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300',
};

export default function ProfilePage() {
  const [user, setUser]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '', handle: '', description: '', location: '', email: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const email = localStorage.getItem('userEmail');
      const token = localStorage.getItem('token');
      if (!token || !email || email === 'null' || email === 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        router.push('/login');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/profile?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          if (res.status === 404) { localStorage.clear(); router.push('/signup'); return; }
          throw new Error('Profile fetch failed');
        }
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('userPlan', userData.plan);
        localStorage.setItem('userLocation', userData.location);
        if (userData.state) localStorage.setItem('userState', userData.state);
        setFormData({
          name:        userData.name        || '',
          handle:      userData.handle      || userData.email?.split('@')[0] || '',
          description: userData.description || '',
          location:    userData.location    || '',
          email:       userData.email       || '',
        });
      } catch (err) {
        setUser({ name: localStorage.getItem('userName'), plan: localStorage.getItem('userPlan') });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, email: user.email })
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        localStorage.setItem('userName', formData.name);
        localStorage.setItem('userLocation', formData.location);
        setSaved(true);
        setEditMode(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleLogout = () => { localStorage.clear(); router.push('/'); };

  if (loading) return (
    <div className="h-[calc(100vh-56px)] bg-white dark:bg-[#050505] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tabs = [
    { id: 'home',     label: 'Home' },
    { id: 'downloads', label: 'Downloads' },
    { id: 'history',  label: 'History' },
    { id: 'about',    label: 'About' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">

      {/* ── BANNER ── */}
      <div className="relative w-full h-32 sm:h-44 md:h-56 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-[#1a1a1a] dark:to-[#2a2a2a] overflow-hidden group">
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
          alt="Banner"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0f0f0f] via-transparent to-transparent" />
      </div>

      {/* ── CHANNEL HEADER ── */}
      <div className="max-w-[1096px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 sm:-mt-14 relative z-10 pb-4 border-b border-gray-200 dark:border-white/10">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-red-500 to-purple-700 flex items-center justify-center text-3xl sm:text-5xl font-black text-white border-4 border-white dark:border-[#0f0f0f] shadow-xl">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <button className="absolute bottom-1 right-1 w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Camera size={14} className="text-white dark:text-gray-900" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight truncate">{user?.name}</h1>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${PLAN_COLORS[user?.plan || 'Free']}`}>
                {user?.plan === 'Gold' && <Crown size={10} className="inline mr-1" />}
                {user?.plan || 'Free'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">@{formData.handle || user?.email?.split('@')[0]}</span>
              {user?.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {user.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Zap size={12} className="text-yellow-500" />
                {user?.dailyDownloadCount || 0} downloads today
              </span>
            </div>
            {formData.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 max-w-2xl">{formData.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 pb-1">
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-full text-sm font-semibold transition-all"
            >
              <Edit2 size={15} /> Customize
            </button>
            <Link
              href="/upgrade"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
            >
              Upgrade
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-600/10 text-red-500 rounded-full transition-all text-sm font-semibold border border-red-200 dark:border-red-500/20"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 mt-1 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setEditMode(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#212121] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit channel</h2>
                <button onClick={() => setEditMode(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

                {/* Name */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Name</label>
                  <input
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                {/* Handle */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Handle</label>
                  <div className="flex">
                    <span className="bg-gray-100 dark:bg-[#333] border border-r-0 border-gray-200 dark:border-white/10 text-gray-500 rounded-l-xl px-3 py-2.5 text-sm flex items-center">@</span>
                    <input
                      className="flex-1 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-r-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={formData.handle}
                      onChange={e => setFormData({ ...formData, handle: e.target.value })}
                      placeholder="yourhandle"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Description</label>
                  <textarea
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell viewers about your channel..."
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Location</label>
                  <input
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Email</label>
                  <input
                    disabled
                    className="w-full bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-white/5 text-gray-400 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed"
                    value={formData.email}
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/10">
                <button onClick={handleLogout} className="text-red-500 hover:text-red-600 text-sm font-semibold flex items-center gap-1.5 transition-colors">
                  <LogOut size={15} /> Sign out
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-full text-sm font-semibold transition-all"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : saved ? (
                      <><Check size={15} /> Saved!</>
                    ) : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TAB CONTENT ── */}
      <div className="max-w-[1096px] mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">

          {/* HOME */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Plan',       value: user?.plan || 'Free' },
                  { label: 'Downloads',  value: user?.downloads?.length || 0 },
                  { label: 'Today',      value: `${user?.dailyDownloadCount || 0} dl` },
                  { label: 'Member since', value: user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-medium uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent downloads */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Downloads</h2>
                  {(user?.downloads?.length || 0) > 4 && (
                    <button onClick={() => setActiveTab('downloads')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      View all →
                    </button>
                  )}
                </div>
                {!user?.downloads?.length ? (
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl text-center">
                    <Download size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-sm font-semibold text-gray-400 dark:text-gray-600">No downloads yet</p>
                    <Link href="/home" className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">Browse videos</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {user.downloads.slice(0, 4).map((dl: any, i: number) => (
                      <Link href={`/watch/${dl.videoId}`} key={i} className="group">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 mb-2">
                          {dl.thumbnail
                            ? <img src={dl.thumbnail} alt={dl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <div className="w-full h-full flex items-center justify-center"><PlayCircle size={28} className="text-gray-400" /></div>
                          }
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <PlayCircle size={36} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-sm font-semibold line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{dl.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{new Date(dl.downloadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* DOWNLOADS */}
          {activeTab === 'downloads' && (
            <motion.div key="downloads" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold">Downloads <span className="text-gray-400 dark:text-gray-500 font-normal text-sm ml-1">({user?.downloads?.length || 0})</span></h2>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {user?.plan === 'Free' ? '1/day limit' : user?.plan === 'Silver' ? '5/day limit' : 'Unlimited'}
                  {' · '}
                  <Link href="/upgrade" className="text-blue-600 dark:text-blue-400 hover:underline">{user?.plan === 'Gold' ? 'Gold ✓' : 'Upgrade'}</Link>
                </span>
              </div>
              {!user?.downloads?.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Download size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
                  <p className="font-semibold text-gray-400 dark:text-gray-600 mb-1">No downloads yet</p>
                  <Link href="/home" className="mt-3 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors">Browse Videos</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {user.downloads.map((dl: any, i: number) => (
                    <Link href={`/watch/${dl.videoId}`} key={i} className="group">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 mb-2">
                        {dl.thumbnail
                          ? <img src={dl.thumbnail} alt={dl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center"><PlayCircle size={28} className="text-gray-400" /></div>
                        }
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <PlayCircle size={36} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="text-sm font-semibold line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{dl.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{new Date(dl.downloadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* HISTORY */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
              <History size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
              <p className="font-semibold text-gray-500 dark:text-gray-500 mb-3">Watch history is on a separate page</p>
              <Link href="/history" className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-all">
                Go to History →
              </Link>
            </motion.div>
          )}

          {/* ABOUT */}
          {activeTab === 'about' && (
            <motion.div key="about" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-6">
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl divide-y divide-gray-200 dark:divide-white/5">
                {[
                  { label: 'Name',        value: user?.name },
                  { label: 'Handle',      value: `@${formData.handle || user?.email?.split('@')[0]}` },
                  { label: 'Email',       value: user?.email },
                  { label: 'Location',    value: user?.location || '—' },
                  { label: 'Plan',        value: user?.plan || 'Free' },
                  { label: 'Member since', value: user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                  { label: 'Description', value: formData.description || 'No description added yet.' },
                ].map(row => (
                  <div key={row.label} className="flex gap-4 px-5 py-4">
                    <span className="text-sm text-gray-500 dark:text-gray-500 w-32 flex-shrink-0 font-medium">{row.label}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{row.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-full text-sm font-semibold transition-all"
              >
                <Edit2 size={15} /> Edit channel info
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
