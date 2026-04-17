"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Trash2, Play, History as HistoryIcon, Loader2 } from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const email = localStorage.getItem("userEmail");
      if (!email) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/history/${email}`);
        if (res.ok) {
          setHistory(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  const handleClearHistory = async () => {
    const email = localStorage.getItem("userEmail");
    if (!confirm("Are you sure you want to clear your entire watch history?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/history/${email}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
        alert("🗑️ Node history cleared.");
      }
    } catch (err) {
      alert("Failed to clear history.");
    }
  };

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-red-600"/></div>;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-[#050505] text-black dark:text-white p-6 md:p-12 transition-colors">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12">
        
        {/* LEFT: History Feed */}
        <div className="flex-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
            <HistoryIcon className="text-red-600" size={32} /> Watch History
          </h1>

          {history.length === 0 ? (
            <div className="text-center opacity-40 mt-20">
              <Clock size={48} className="mx-auto mb-4" />
              <h2 className="text-xl font-bold">No recent activity</h2>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2">Your Node logs are empty</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((item) => (
                <Link href={`/watch/${item.videoId._id}`} key={item._id} className="group flex gap-6 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/5 p-4 rounded-[2rem] hover:border-red-500/50 transition-all">
                  
                  <div className="relative w-48 aspect-video bg-black rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={item.videoId.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={24} fill="white" className="text-white" />
                    </div>
                  </div>

                  <div className="flex flex-col justify-center">
                    <h3 className="text-lg font-black leading-tight group-hover:text-red-500 transition-colors mb-2">
                      {item.videoId.title}
                    </h3>
                    <p className="text-xs font-bold opacity-60">{item.videoId.channelName}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-3">
                      Viewed: {new Date(item.watchedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Controls Menu */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/5 p-6 rounded-[2rem] sticky top-24">
            <h3 className="font-black uppercase tracking-tighter mb-6 pb-4 border-b border-gray-200 dark:border-white/5">History Controls</h3>
            
            <button 
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="w-full flex items-center gap-3 p-4 rounded-xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
            >
              <Trash2 size={16} /> Clear History
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}