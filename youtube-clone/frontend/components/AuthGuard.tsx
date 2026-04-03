"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";

// 🔥 GLOBAL VARIABLE (Lives outside React lifecycle)
// It resets to 'false' ONLY when the user hard-refreshes or types a URL manually.
let appHasMounted = false;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // List the exact URLs that DO NOT require a login
  const publicPaths = ['/', '/login', '/signup'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isPublicPage = publicPaths.includes(pathname);

    // 1. THE STANDARD FORCEFIELD (No Token = Kick to Login)
    if (!token && !isPublicPage) {
      setIsAuthorized(false);
      router.push('/login');
      return;
    }

    // 2. 🔥 STRICT URL ANTI-TAMPERING ENGINE 🔥
    // If the app hasn't mounted yet, it means this is a HARD LOAD (Typed URL or Refresh)
    if (!appHasMounted) {
      appHasMounted = true; // Mark it as mounted for all future clicks

      // If they typed a protected URL directly (and it isn't the Home feed), intercept it!
      if (!isPublicPage && pathname !== '/home') {
        console.warn("Manual URL tampering detected. Rerouting to secure entry point.");
        setIsAuthorized(false);
        router.push('/home'); // Kick them back to the safe zone
        return;
      }
    }

    // 3. GRANT ACCESS (Token exists AND they navigated legally)
    setIsAuthorized(true);
  }, [pathname, router]);

  // Loading State
  if (!isAuthorized && !publicPaths.includes(pathname)) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white">
        <ShieldAlert className="text-red-600 mb-4 animate-pulse" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
          Verifying Navigational Integrity...
        </p>
      </div>
    );
  }

  // If authorized, render the actual page
  return <>{children}</>;
}