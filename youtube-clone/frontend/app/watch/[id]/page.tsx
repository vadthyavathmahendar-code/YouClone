"use client";
import { API_URL } from '../../config';  
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ThumbsUp, ThumbsDown, Download, Play, Maximize, Languages, MapPin, Loader2 } from 'lucide-react';
const PLAN_LIMITS: Record<string, number> = { 'Free': 300, 'Bronze': 420, 'Silver': 600, 'Gold': Infinity };
export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapXRef = useRef(0);
  
  const [video, setVideo] = useState<any>(null);
  const [user, setUser] = useState<any>(null); 
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [watchTime, setWatchTime] = useState(0);
  const [gesturePulse, setGesturePulse] = useState<string | null>(null);
  const isLimitReached = watchTime >= PLAN_LIMITS[user?.plan || 'Free'];

  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<any[]>([]);// 1. Initial Data Fetch: Load saved watchTime from DB
useEffect(() => {
  const fetchData = async () => {
    const email = localStorage.getItem('userEmail');
    try {
      const vRes = await fetch(`${API_URL}/api/videos/${id}`);
      const videoData = await vRes.json();
      setVideo(videoData);
      
      if (email) {
        // Fetch Profile - Includes totalWatchTime from DB
        const uRes = await fetch(`${API_URL}/api/auth/profile?email=${email}`);
        const userData = await uRes.json();
        setUser(userData);
        localStorage.setItem('userPlan', userData.plan); 

        // 🔥 CRITICAL: Set the local watchTime state to what's saved in the DB
        if (userData.totalWatchTime) {
          setWatchTime(userData.totalWatchTime);
        }

        // Log to Watch History
        await fetch(`${API_URL}/api/history`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, videoId: id })
        });
      }

      const cRes = await fetch(`${API_URL}/api/comments/video/${id}`);
      setComments(await cRes.json());
    } catch (err) { console.error("Node Sync failed", err); }
  };
  if (id) fetchData();
}, [id]);

// 2. Persistent Timer: Increments time and syncs to DB every 10 seconds
useEffect(() => {
  if (!isPlaying || isLimitReached || !user?.email) return;
  const limit = PLAN_LIMITS[user?.plan || 'Free'];
  
  const interval = setInterval(() => {
    setWatchTime(prev => {
      const newTime = prev + 1;

      // 🔥 HEARTBEAT SYNC: Save to database every 10 seconds
      if (newTime % 10 === 0) {
        fetch(`${API_URL}/api/users/sync-watchtime`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, watchTime: newTime })
        }).catch(err => console.error("Heartbeat failed", err));
      }

      // Check if limit is hit
      if (newTime >= limit) {
        videoRef.current?.pause();
        setIsPlaying(false);
        return newTime;
      }
      
      return newTime;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [isPlaying, user?.email, isLimitReached]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
      setCurrentTime(formatTime(current));
      if (!isNaN(total)) setDuration(formatTime(total));
    }
  };

  // Gesture handler using tap count tracking (reliable cross-browser)
  const handleGestures = (e: React.MouseEvent) => {
    const videoElement = videoRef.current;
    if (!videoElement || isLimitReached) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    tapCountRef.current += 1;
    lastTapXRef.current = x;

    // Clear any pending timer
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    tapTimerRef.current = setTimeout(() => {
      const taps = tapCountRef.current;
      const tapX = lastTapXRef.current;
      tapCountRef.current = 0;

      const isLeft   = tapX < width * 0.33;
      const isRight  = tapX > width * 0.66;

      if (taps === 1) {
        // Single tap anywhere — pause/resume
        if (videoElement.paused) {
          videoElement.play().then(() => setIsPlaying(true)).catch(() => {});
          setGesturePulse("▶");
        } else {
          videoElement.pause();
          setIsPlaying(false);
          setGesturePulse("⏸");
        }
      } else if (taps === 2) {
        // Double tap — seek ±10s based on side
        if (isRight) {
          videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
          setGesturePulse("⏩ +10s");
        } else if (isLeft) {
          videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
          setGesturePulse("⏪ -10s");
        } else {
          // Double tap center — pause/resume
          if (videoElement.paused) {
            videoElement.play().then(() => setIsPlaying(true)).catch(() => {});
            setGesturePulse("▶");
          } else {
            videoElement.pause();
            setIsPlaying(false);
            setGesturePulse("⏸");
          }
        }
      } else if (taps >= 3) {
        // Triple tap
        if (isRight) {
          setGesturePulse("✕ Closing...");
          setTimeout(() => window.close(), 600);
        } else if (isLeft) {
          setGesturePulse("💬 Comments");
          document.getElementById('comment-box')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          // Center — skip to next video
          setGesturePulse("⏭ Next Video");
          setTimeout(() => router.push('/home'), 500);
        }
      }

      setTimeout(() => setGesturePulse(null), 700);
    }, 280); // 280ms window to collect taps
  };
const handleDownload = async () => {
  // 1. Plan-based limit check
  const planLimits: Record<string, number> = { Free: 1, Bronze: 1, Silver: 5, Gold: Infinity };
  const limit = planLimits[user?.plan || 'Free'];

  if ((user?.dailyDownloadCount || 0) >= limit) {
    alert(`🔒 Daily download limit reached for ${user?.plan || 'Free'} plan. Upgrade for more downloads!`);
    router.push('/upgrade');
    return;
  }

  try {
    const response = await fetch(video.videoUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.title.replace(/\s+/g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // Sync to backend with video info for Downloads section
    if (user?.email) {
      await fetch(`${API_URL}/api/auth/increment-download`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: user.email,
          videoId: video._id,
          title: video.title,
          thumbnail: video.thumbnailUrl || video.thumbnail || ''
        })
      });

      setUser((prev: any) => ({
        ...prev,
        dailyDownloadCount: (prev?.dailyDownloadCount || 0) + 1
      }));
    }

    alert(`✅ Download started!`);
  } catch (err) {
    console.error("Download Error:", err);
    alert("Download failed. This may be due to CORS settings on the video source.");
  }
};

const handlePostComment = async () => {
  if (!commentInput.trim()) return;

  // 🛡️ Guard Clause: Prevent "Anonymous" posts by ensuring user data exists
  if (!user || !user.name) {
    alert("User profile not synced. Please wait a moment or log in again.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/comments`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: id,
        text: commentInput,
        user: user.name,      // 🚀 Forces the real name
        city: user.location,  // 🚀 Forces the real location
        likes: 0,
        dislikes: 0
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`🚫 ${data.message}`); 
      return;
    }

    setComments([data, ...comments]);
    setCommentInput("");
  } catch (err) { 
    console.error("Comment Post Error:", err);
    alert("Failed to post comment."); 
  }
};
  const handleVote = async (commentId: string, action: 'like' | 'dislike') => {
    try {
      const res = await fetch(`${API_URL}/api/comments/${commentId}/vote`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();

      if (data.deleted) {
        alert("🚫 Comment removed by community moderation.");
        setComments(comments.filter(c => c._id !== commentId));
      } else {
        setComments(comments.map(c => c._id === commentId ? data.updatedComment : c));
      }
    } catch (err) {}
  };

  const LANGUAGES: Record<string, string> = {
    en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil",
    kn: "Kannada", ml: "Malayalam", fr: "French", es: "Spanish",
    de: "German", zh: "Chinese", ar: "Arabic", ja: "Japanese"
  };

  const handleTranslate = async (commentId: string, targetLang?: string) => {
    try {
      const existing = comments.find(c => c._id === commentId);

      // Toggle back to original
      if (existing?.isTranslated && !targetLang) {
        setComments(comments.map(c => c._id === commentId ? { ...c, isTranslated: false } : c));
        return;
      }

      const lang = targetLang || 'en';

      const res = await fetch(`${API_URL}/api/comments/${commentId}/translate`, { 
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLang: lang })
      });
      const data = await res.json();
      
      setComments(comments.map(c => c._id === commentId ? { 
        ...c, 
        isTranslated: true, 
        translatedText: data.translatedText,
        translatedTo: LANGUAGES[lang] || lang
      } : c));
    } catch (err) {
      console.error("Translation Error:", err);
    }
  };


  if (!video) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-red-600"/></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:px-20 bg-white dark:bg-[#0f0f0f] min-h-screen text-black dark:text-white transition-colors duration-300">
      <div className="flex-[2.5]">
        
        <div ref={containerRef} className="relative aspect-video bg-black rounded-3xl overflow-hidden group shadow-2xl">
          <video 
            ref={videoRef} 
            key={video?._id}
            src={video.videoUrl} 
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate} 
            autoPlay 
            playsInline
            muted
            crossOrigin="anonymous"
            preload="metadata"
          />

          {gesturePulse && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40
                            bg-black/70 backdrop-blur-sm px-8 py-4 rounded-2xl 
                            text-white font-black text-2xl pointer-events-none
                            animate-bounce">
              {gesturePulse}
            </div>
          )}

          {/* Gesture hint zones — visible on hover */}
          <div className="absolute inset-0 z-10 flex pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex-1 flex items-center justify-center text-white/20 text-xs font-black uppercase tracking-widest">⏪ Double tap</div>
            <div className="flex-1 flex items-center justify-center text-white/20 text-xs font-black uppercase tracking-widest">Tap</div>
            <div className="flex-1 flex items-center justify-center text-white/20 text-xs font-black uppercase tracking-widest">Double tap ⏩</div>
          </div>

          <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer" onClick={handleGestures}>
            {!isPlaying && !isLimitReached && <div className="bg-black/50 p-6 rounded-full"><Play size={48} fill="white" /></div>}
            
            {isLimitReached && (
              <div className="absolute inset-0 bg-black/95 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter text-white">Limit Reached</h2>
                <p className="text-white/60 mb-6 max-w-xs uppercase text-[10px] tracking-[0.2em]">Upgrade your {user?.plan} plan for unlimited viewing.</p>
                <button onClick={() => router.push('/upgrade')} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform">Upgrade Now</button>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 w-full z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="flex items-center justify-between mb-3 text-white font-black text-[10px] uppercase tracking-widest">
              <span>{currentTime} / {duration}</span>
              <button onClick={(e) => { e.stopPropagation(); if(!document.fullscreenElement) containerRef.current?.requestFullscreen(); else document.exitFullscreen(); }}><Maximize size={18} /></button>
            </div>
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h1 className="text-2xl font-black tracking-tight">{video.title}</h1>
          <div className="flex flex-wrap items-center justify-between mt-4 border-b border-gray-100 dark:border-white/5 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-xl">{video.channelName?.[0]}</div>
              <div>
                <p className="font-black text-lg leading-none tracking-tighter">{video.channelName}</p>
                <p className="text-[10px] uppercase font-black opacity-30 mt-1 flex items-center gap-1"><MapPin size={10}/> {user?.location || "Secunderabad Node"}</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-100 dark:bg-[#272727] rounded-full px-2 py-1">
               <button onClick={handleDownload} className="flex items-center gap-2 ml-2 px-5 py-2 bg-red-600 text-white rounded-full font-black text-xs uppercase tracking-widest transition-transform active:scale-95">
                 <Download size={18} /> Download
               </button>
            </div>
          </div>
        </div>

        <div id="comment-box" className="mt-10 p-8 bg-gray-50 dark:bg-[#181818] rounded-[2.5rem]">
           <div className="flex gap-4 mb-10 border-b border-gray-300 dark:border-white/5 pb-4">
              <input 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                placeholder="Post a safe comment..." 
                className="flex-1 bg-transparent outline-none text-sm font-medium"
              />
              <button onClick={handlePostComment} className="bg-blue-600 text-white px-8 py-2 rounded-2xl font-black uppercase text-[10px] tracking-widest">Post</button>
           </div>
           <style jsx global>{`
  @keyframes gesture-pop {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
  }
  .animate-gesture {
    animation: gesture-pop 0.6s ease-out forwards;
  }
`}</style>
<div className="space-y-8">
  {comments.map((c) => (
    <div key={c._id || Math.random()} className="flex gap-5 group animate-fadeIn">
      {/* Dynamic Avatar */}
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-purple-600 flex-shrink-0 flex items-center justify-center font-black text-white shadow-lg">
        {c.user ? c.user[0].toUpperCase() : 'U'}
      </div>

      <div className="flex-1">
        {/* TASK 1: Regional Context (City) */}
        <p className="text-[11px] font-black opacity-30 uppercase tracking-widest flex items-center gap-1">
          {c.user || "Anonymous Node"} • 
          <span className="text-red-600 dark:text-red-400">{c.city || "Secunderabad Node"}</span>
        </p>

        {/* TASK 1: Translation Rendering */}
        <p className="text-sm mt-1 font-medium leading-relaxed text-black dark:text-white/90">
          {c.isTranslated ? (
            <span className="border-l-2 border-blue-500 pl-3 italic opacity-80">
              {c.translatedText}
            </span>
          ) : (
            c.text
          )}
        </p>

        <div className="flex items-center gap-6 mt-3">
          {/* Like/Dislike with Task 1 Threshold Logic */}
          <button 
            onClick={() => handleVote(c._id, 'like')} 
            className="opacity-40 hover:opacity-100 hover:text-blue-500 transition-all flex items-center gap-1 active:scale-90"
          >
            <ThumbsUp size={14}/> {c.likes || 0}
          </button>

          <button 
            onClick={() => handleVote(c._id, 'dislike')} 
            className="opacity-40 hover:opacity-100 hover:text-red-500 transition-all flex items-center gap-1 active:scale-90"
          >
            <ThumbsDown size={14}/> {c.dislikes || 0}
          </button>

          {/* TASK 1: Translate Toggle */}
          <div className="relative group/lang">
            <button 
              onClick={() => c.isTranslated ? handleTranslate(c._id) : handleTranslate(c._id, 'en')} 
              className={`transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter
                ${c.isTranslated ? 'text-blue-500 opacity-100' : 'opacity-20 hover:opacity-100'}`}
            >
              <Languages size={14}/> {c.isTranslated ? `${c.translatedTo || 'EN'} ✓` : "Translate"}
            </button>
            {/* Language picker dropdown */}
            {!c.isTranslated && (
              <div className="absolute bottom-6 left-0 hidden group-hover/lang:flex flex-wrap gap-1 bg-white dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-2xl p-2 shadow-xl z-50 w-52">
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={(e) => { e.stopPropagation(); handleTranslate(c._id, code); }}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
        </div>
      </div>
    </div>
  );
}
