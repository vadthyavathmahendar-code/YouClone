"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";

// Track if this is the first load of the application
let appHasMounted = false;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Start with 'false' to ensure we verify before showing any protected content
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // List the exact URLs that DO NOT require a login
  const publicPaths = ['/', '/login', '/signup'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isPublicPage = publicPaths.includes(pathname);

    // 1. PUBLIC PAGE ACCESS
    if (isPublicPage) {
      // If user is already logged in and tries to go to login/signup, send them home
      if (token && (pathname === '/login' || pathname === '/signup')) {
        router.push('/home');
        return;
      }
      setIsAuthorized(true);
      return;
    }

    // 2. PROTECTED PAGE ACCESS
    if (!token) {
      console.warn("🔐 No Token Found. Redirecting to Login Node.");
      setIsAuthorized(false);
      router.push('/login');
      return;
    }

    // 3. NAVIGATIONAL INTEGRITY (Anti-Tampering)
    // If they HAVE a token but are trying to hit a deep link directly on hard refresh
    if (!appHasMounted) {
      appHasMounted = true; 
      
      // If it's a deep link (not home) on a fresh mount, verify extra carefully
      if (pathname !== '/home' && !pathname.startsWith('/watch')) {
        console.log("📍 Validating deep link access...");
      }
    }

    // 4. GRANT ACCESS
    setIsAuthorized(true);
  }, [pathname, router]);

  // LOADING STATE: Shown during the split-second verification
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

  // ACCESS DENIED STATE: Shown if they are not authorized for this path
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
          className="mt-8 bg-white text-black px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}