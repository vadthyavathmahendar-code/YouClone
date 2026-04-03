"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Zap, Video } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If they already have a token, bypass the landing page and go straight to Home
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/home");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) return <div className="h-screen bg-[#050505]" />;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 selection:bg-red-600">
      <div className="max-w-3xl text-center space-y-8">
        <div className="w-24 h-24 bg-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-600/20">
          <Video size={48} fill="white" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
          Welcome to <span className="text-red-600">YouClone</span>
        </h1>
        
        <p className="text-lg md:text-xl opacity-60 font-medium max-w-xl mx-auto leading-relaxed">
          The creator 's node , Experience a new era of content sharing.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link href="/login" className="w-full sm:w-auto px-12 py-4 bg-red-600 text-white rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-red-600/20">
             Login
          </Link>
          <Link href="/signup" className="w-full sm:w-auto px-12 py-4 bg-white/5 text-white rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/10">
            Create Account
          </Link>
        </div>

        <div className="flex justify-center gap-12 pt-16 opacity-40">
          <div className="flex flex-col items-center gap-2"><Shield size={24}/> <span className="text-[10px] font-black uppercase tracking-widest">Secure</span></div>
          <div className="flex flex-col items-center gap-2"><Zap size={24}/> <span className="text-[10px] font-black uppercase tracking-widest">Tiered</span></div>
        </div>
      </div>
    </div>
  );
}