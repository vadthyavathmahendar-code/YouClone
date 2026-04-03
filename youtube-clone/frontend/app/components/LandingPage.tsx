"use client";
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center animate-fadeIn">
        <div className="bg-red-600 w-16 h-10 rounded-xl flex items-center justify-center mx-auto mb-8">
           <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent"></div>
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tighter">Try searching to get started</h1>
        <p className="opacity-40 mb-10 text-lg leading-relaxed">
          Sign in to access your personalized feed, history, and premium features.
        </p>
        <button 
          onClick={() => router.push('/login')}
          className="bg-blue-600 hover:bg-blue-700 px-12 py-4 rounded-full font-black text-lg transition-all active:scale-95 shadow-xl shadow-blue-600/20"
        >
          Sign in to YouClone
        </button>
      </div>
    </div>
  );
}