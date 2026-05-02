"use client";
import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, PlayCircle, Loader2 } from 'lucide-react';

export default function SubscriptionsPage() {
  const [channels, setChannels] = useState<string[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetch_ = async () => {
      const email = localStorage.getItem('userEmail');
      if (!email) { router.push('/login'); return; }
      try {
        const res = await fetch(`${API_URL}/api/videos/subscriptions/${email}`);
        if (res.ok) {
          const data = await res.json();
          setChannels(data.channels || []);
          setVideos(data.videos || []);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [router]);

  if (loading) return (
    <div className="h-[calc(100vh-56px)] bg-white dark:bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-red-600" />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-[#050505] text-gray-900 dark:text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
          <Bell size={24} className="text-red-600" /> Subscriptions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
          {channels.length === 0 ? 'You haven\'t subscribed to any channels yet.' : `${channels.length} channel${channels.length > 1 ? 's' : ''}`}
        </p>

        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl text-center">
            <Bell size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
            <p className="font-semibold text-gray-400 dark:text-gray-600 mb-2">No subscriptions yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mb-6">Subscribe to channels from the video player</p>
            <Link href="/home" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors">
              Browse Videos
            </Link>
          </div>
        ) : (
          <>
            {/* Channel pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {channels.map(ch => (
                <div key={ch} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-sm font-semibold">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">
                    {ch[0]?.toUpperCase()}
                  </div>
                  {ch}
                </div>
              ))}
            </div>

            {/* Latest videos */}
            <h2 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Latest from your subscriptions</h2>
            {videos.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-600">No videos from subscribed channels yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {videos.map((v: any) => (
                  <Link key={v._id} href={`/watch/${v._id}`} className="group">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 mb-2">
                      {v.thumbnailUrl
                        ? <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><PlayCircle size={28} className="text-gray-400" /></div>
                      }
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <PlayCircle size={36} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{v.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{v.channelName}</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
