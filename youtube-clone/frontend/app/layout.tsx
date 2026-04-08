"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AuthGuard from "../components/AuthGuard"; // Your new Forcefield
import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize as null to prevent "Hydration Mismatch"
  const [theme, setTheme] = useState<'dark' | 'light' | null>(null);
  const pathname = usePathname();

  // Check if we are on a public auth page to hide the Navbar/Sidebar
  const isSpecialPage = pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname.startsWith('/call');
// ✅ SAFE THEME LOGIC
useEffect(() => {
  const applyRegionalTheme = async () => {
    try {
      const now = new Date();
      const hours = now.getHours();
      // Requirement: 10:00 AM to 12:00 PM
      const isMorningSlot = hours >= 10 && hours < 12;

      const response = await fetch('http://ip-api.com/json/');
      const data = await response.json();
      const southIndiaStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
      
      const isSouthIndia = southIndiaStates.includes(data.regionName);
      const shouldBeLight = isMorningSlot && isSouthIndia;
      const selectedTheme = shouldBeLight ? 'light' : 'dark';

      setTheme(selectedTheme);
      
      // Update the DOM
      document.documentElement.className = selectedTheme;
      document.documentElement.style.colorScheme = selectedTheme;
    } catch (error) {
      setTheme('dark'); // Default to Dark on error
    }
  };
  applyRegionalTheme();
}, []);

  return (
    <html lang="en" className={theme || 'dark'} style={{ colorScheme: theme || 'dark' }}>
      <head>
        <title>YouClone | Secunderabad Node</title>
      </head>
      <body className="bg-white dark:bg-[#0f0f0f] text-black dark:text-white transition-colors duration-700 ease-in-out">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        
        {/* If theme is loaded, wrap everything in the AuthGuard Forcefield */}
        {theme && (
          <AuthGuard>
            <div className="flex flex-col min-h-screen">
              
              {/* Only show Navbar if logged in and NOT on an Auth Page */}
              {!isSpecialPage && <Navbar />}
              
              <div className="flex flex-1">
                
                {/* Only show Sidebar if logged in and NOT on an Auth Page */}
                {!isSpecialPage && <Sidebar />}
                
                <main className="flex-1 w-full bg-white dark:bg-[#0f0f0f] transition-all">
                  {children}
                </main>
              </div>
            </div>
          </AuthGuard>
        )}

        {/* Loading State while determining Regional Theme */}
        {!theme && (
           <div className="h-screen w-screen bg-[#0f0f0f] flex items-center justify-center">
             <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
           </div>
        )}
      </body>
    </html>
  );
}