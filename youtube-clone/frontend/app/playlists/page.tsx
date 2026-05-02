"use client";
import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ListVideo, Plus, Trash2, PlayCircle, Loader2 } from 'lucide-react';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const router = useRouter();

  const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : '';

  useEffect(() => {
    const fetchPlaylists = async () => {
      const em = localStorage.getItem('userEmail');
      if (!em) { router.push('/login'); return; }
      try {
        const res = await fetch(`${API_URL}/api/videos/playlists/${em}`);
        if (res.ok) setPlaylists(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchPlaylists();
  }, [router]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/videos/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), owner: email })
      });
      if (res.ok) {
        const pl = await res.json();
        setPlaylists(prev => [pl, ...prev]);
        setNewName('');
        setCreating(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this playlist?')) return;
    try {
      await fetch(`${API_URL}/api/videos/playlists/${id}`, { method: 'DELETE' });
      setPlaylists(prev => prev.filter(p => p._id !== id));
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="h-[calc(100vh-56px)] bg-white dark:bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-red-600" />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-[#050505] text-gray-900 dark:text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ListVideo size={24} className="text-red-600" /> Playlists
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus size={16} /> New Playlist
          </button>
        </div>

        {/* Create form */}
        {creating && (
          <div className="mb-6 flex gap-3 items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="Playlist name..."
              className="flex-1 bg-transparent outline-none text-sm font-medium placeholder-gray-400"
            />
            <button onClick={handleCreate} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors">Create</button>
            <button onClick={() => setCreating(false)} className="px-4 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
          </div>
        )}

        {playlists.length === 0 && !creating ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl text-center">
            <ListVideo size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
            <p className="font-semibold text-gray-400 dark:text-gray-600 mb-2">No playlists yet</p>
            <button onClick={() => setCreating(true)} className="mt-3 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors">
              Create your first playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {playlists.map((pl: any) => (
              <div key={pl._id} className="group bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden hover:border-red-500/30 transition-all">
                {/* Thumbnail stack */}
                <div className="relative aspect-video bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                  {pl.videos?.[0]?.thumbnailUrl ? (
                    <img src={pl.videos[0].thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <PlayCircle size={36} className="text-gray-400 dark:text-gray-600" />
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {pl.videos?.length || 0} videos
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{pl.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      {new Date(pl.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(pl._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
