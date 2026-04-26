"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // State to track if the current session is authorized
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // URLs that are accessible without a full JWT session token
  const publicPaths = ['/', '/login', '/signup', '/verify-otp'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isPublicPage = publicPaths.includes(pathname);

    // 1. PUBLIC PATH LOGIC
    if (isPublicPage) {
      // If user is already logged in (has token), don't let them go back to login/signup/verify
      if (token && (pathname === '/login' || pathname === '/signup' || pathname === '/verify-otp')) {
        router.push('/home');
        return;
      }
      setIsAuthorized(true);
      return;
    }

    // 2. PROTECTED PATH LOGIC
    if (!token) {
      console.warn("🔐 Access Denied: No Token Found. Redirecting to Login Node.");
      setIsAuthorized(false);
      router.push('/login');
      return;
    }

    // 3. AUTHORIZATION GRANTED
    // If we reach here, the user has a token and is accessing a protected route
    setIsAuthorized(true);
  }, [pathname, router]);

  // STAGE 1: INITIAL LOADING (Prevents "flicker" while checking localStorage)
  if (isAuthorized === null) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 className="text-red-600 mb-4 animate-spin" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
          Securing Secunderabad Node...
        </p>
      </div>
    );
  }

  // STAGE 2: ACCESS DENIED UI
  // Only show this if the authorization check failed and they are on a protected route
  if (isAuthorized === false && !publicPaths.includes(pathname)) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white p-6 text-center">
        <ShieldAlert className="text-red-600 mb-6 animate-pulse" size={48} />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Access Denied</h2>
        <p className="text-xs font-bold opacity-50 max-w-xs uppercase leading-relaxed">
          Authorization Token Missing. Please authenticate via the Login Node to proceed.
        </p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-8 bg-white text-black px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // STAGE 3: RENDER PROTECTED CONTENT
  return <>{children}</>;
}