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

  // ✅ THEME LOGIC — IP-based location + time check
  useEffect(() => {
    const applyRegionalTheme = async () => {
      try {
        const now = new Date();
        // Convert to IST (UTC+5:30)
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset - (now.getTimezoneOffset() * 60 * 1000));
        const hours = istTime.getHours();
        const isMorningSlot = hours >= 10 && hours < 12;

        // Try multiple IP geolocation APIs for reliability
        let region = '';
        try {
          const r1 = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
          const d1 = await r1.json();
          region = d1.region || d1.region_name || '';
        } catch {
          try {
            const r2 = await fetch('https://ip-api.com/json/?fields=regionName', { signal: AbortSignal.timeout(3000) });
            const d2 = await r2.json();
            region = d2.regionName || '';
          } catch {
            // Use saved location from localStorage as last fallback
            region = localStorage.getItem('userLocation') || '';
          }
        }

        const southIndiaStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
        const regionLower = region.toLowerCase();
        const isSouthIndia = southIndiaStates.some(s => regionLower.includes(s.toLowerCase()))
          || regionLower.includes('hyderabad')
          || regionLower.includes('secunderabad');

        const shouldBeLight = isMorningSlot && isSouthIndia;
        const selectedTheme = shouldBeLight ? 'light' : 'dark';

        setTheme(selectedTheme);
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(selectedTheme);
        root.style.colorScheme = selectedTheme;

        // Store for debugging
        console.log(`🎨 Theme: ${selectedTheme} | Region: ${region} | IST Hour: ${hours} | South India: ${isSouthIndia} | Morning: ${isMorningSlot}`);

      } catch (error) {
        console.warn('Theme detection failed, defaulting to dark');
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }
    };
    applyRegionalTheme();
  }, []);


  return (
    <html lang="en">
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