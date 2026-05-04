"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AuthGuard from "../components/AuthGuard";
import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setTheme] = useState<'dark' | 'light' | null>(null);
  const pathname = usePathname();

  const isSpecialPage = pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname.startsWith('/call');

  // ✅ THEME LOGIC — time + user's saved location
  useEffect(() => {
    const applyRegionalTheme = async () => {
      try {
        const now = new Date();
        // Correct IST hour using Intl API
        const istHour = parseInt(
          new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            hour12: false
          }).format(now)
        );
        const isMorningSlot = istHour >= 10 && istHour < 12;

        // IP geolocation first (actual access location per requirement)
        // Fall back to saved profile location if IP API fails
        let region = '';
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 3000);
          const r = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
          clearTimeout(t);
          const d = await r.json();
          region = d.region || d.region_name || '';
        } catch {
          // IP API failed — use saved profile location as fallback
          region = localStorage.getItem('userLocation') || '';
        }

        const southIndiaStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
        
        // Check state field first (most reliable — set during signup)
        const savedState = localStorage.getItem('userState') || '';
        let isSouthIndia = false;
        
        if (savedState && savedState !== 'Unknown') {
          // Use explicit state from profile
          isSouthIndia = southIndiaStates.includes(savedState);
        } else {
          // Fallback to IP geolocation region
          const regionLower = region.toLowerCase();
          isSouthIndia = southIndiaStates.some(s => regionLower.includes(s.toLowerCase()))
            || regionLower.includes('hyderabad')
            || regionLower.includes('secunderabad')
            || regionLower.includes('chennai')
            || regionLower.includes('bangalore')
            || regionLower.includes('bengaluru')
            || regionLower.includes('kochi')
            || regionLower.includes('vizag')
            || regionLower.includes('visakhapatnam');
        }

        const shouldBeLight = isMorningSlot && isSouthIndia;
        const selectedTheme = shouldBeLight ? 'light' : 'dark';

        setTheme(selectedTheme);
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(selectedTheme);
        root.style.colorScheme = selectedTheme;

        // Force background directly so it works regardless of Tailwind version
        if (selectedTheme === 'light') {
          document.body.style.backgroundColor = '#ffffff';
          document.body.style.color = '#0f0f0f';
        } else {
          document.body.style.backgroundColor = '#050505';
          document.body.style.color = '#ffffff';
        }

        console.log(`🎨 Theme: ${selectedTheme} | Location: "${region}" | IST: ${istHour}:xx | SouthIndia: ${isSouthIndia} | Morning: ${isMorningSlot}`);

      } catch (error) {
        console.warn('Theme detection failed, defaulting to dark');
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }
    };
    applyRegionalTheme();
  }, []);


  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <title>YouClone | Secunderabad Node</title>
      </head>
      {/* 🚀 Ensure the body also transitions smoothly between white and #050505 */}
      <body className="bg-white dark:bg-[#050505] text-black dark:text-white transition-colors duration-700 ease-in-out selection:bg-red-500/30">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        
        {theme && (
          <AuthGuard>
            <div className="flex flex-col min-h-screen">
              {!isSpecialPage && <Navbar />}
              
              <div className="flex flex-1 overflow-hidden">
                {!isSpecialPage && <Sidebar />}
                
                {/* 🚀 Main area dynamically shifts based on theme */}
                <main className="flex-1 w-full bg-gray-50 dark:bg-[#050505] transition-colors duration-700 overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
          </AuthGuard>
        )}

        {!theme && (
           <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
           </div>
        )}
      </body>
    </html>
  );
}