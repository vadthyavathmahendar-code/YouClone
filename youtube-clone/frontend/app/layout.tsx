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

  // ✅ SAFE THEME LOGIC
  useEffect(() => {
    const applyRegionalTheme = async () => {
      try {
        const now = new Date();
        const hours = now.getHours();
        // Requirement: 10:00 AM to 12:00 PM
        const isMorningSlot = hours >= 10 && hours < 12;

        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const southIndiaStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
        
        const isSouthIndia = southIndiaStates.includes(data.region);
        const shouldBeLight = isMorningSlot && isSouthIndia;
        const selectedTheme = shouldBeLight ? 'light' : 'dark';

        setTheme(selectedTheme);
        
        // 🚀 CRITICAL FIX: Cleanly swap the Tailwind classes on the HTML root
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(selectedTheme);
        root.style.colorScheme = selectedTheme;
        
      } catch (error) {
        // Default to Dark on error
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
