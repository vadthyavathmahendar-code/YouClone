import Link from 'next/link';
import { Hammer, ArrowLeft, Construction } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#050505] text-white flex flex-col items-center justify-center p-6 selection:bg-red-600">
      
      <div className="relative flex flex-col items-center text-center animate-fadeIn">
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Icon */}
        <div className="w-20 h-20 bg-[#111] border border-white/5 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl relative z-10">
          <Hammer className="text-orange-500 animate-pulse" size={40} />
        </div>

        {/* Text */}
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 relative z-10">
          Feature in <span className="text-orange-500">Progress</span>
        </h1>
        
        <p className="text-sm font-medium text-[#aaaaaa] max-w-md mb-2 relative z-10">
          The feature you are trying to access is currently under development. 
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-10 relative z-10 flex items-center justify-center gap-2">
          <Construction size={14} /> Feature Deployment Pending
        </p>

        {/* Back Button */}
        <Link 
          href="/home" 
          className="flex items-center gap-3 bg-white hover:bg-gray-200 text-black px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest transition-transform hover:scale-105 shadow-xl relative z-10"
        >
          <ArrowLeft size={16} /> Return to Feed
        </Link>
      </div>
      
    </div>
  );
}