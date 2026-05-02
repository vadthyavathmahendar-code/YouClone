"use client";
import { API_URL } from '../config';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, CheckCircle, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', thumbnailUrl: '', channelName: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.videoUrl.trim()) return alert('Title and Video URL are required');
    setLoading(true);
    try {
      const email = localStorage.getItem('userEmail') || '';
      const userName = localStorage.getItem('userName') || 'User';
      const res = await fetch(`${API_URL}/api/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, uploadedBy: email, channelName: form.channelName || userName })
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push('/home'), 1500);
      } else {
        const d = await res.json();
        alert(d.message || 'Upload failed');
      }
    } catch (err) { alert('Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-[#050505] text-gray-900 dark:text-white flex items-start justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Upload size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Upload Video</h1>
            <p className="text-sm text-gray-500 dark:text-gray-500">Share your video with the world</p>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle size={56} className="text-green-500 mb-4" />
            <p className="text-xl font-black text-gray-900 dark:text-white">Video uploaded!</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Redirecting to home...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Title *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Enter video title"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                Video URL * <span className="text-xs font-normal text-gray-400">(direct .mp4 link)</span>
              </label>
              <div className="relative">
                <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  value={form.videoUrl}
                  onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                Thumbnail URL <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.thumbnailUrl}
                  onChange={e => setForm({ ...form, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                Channel Name <span className="text-xs font-normal text-gray-400">(defaults to your name)</span>
              </label>
              <input
                value={form.channelName}
                onChange={e => setForm({ ...form, channelName: e.target.value })}
                placeholder="Your channel name"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Tell viewers about your video..."
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {loading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
