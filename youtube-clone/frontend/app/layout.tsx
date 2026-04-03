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
  const isAuthPage = pathname === '/' || pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    const applyRegionalTheme = async () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Requirement: 10:00 AM to 12:00 PM IST
      const isMorningSlot = hours >= 10 && hours < 12;

      try {
        const response = await fetch('http://ip-api.com/json/');
        const data = await response.json();
        const southIndiaStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
        
        // Final Decision logic (Strictly based on physical IP)
        const shouldBeLight = isMorningSlot && southIndiaStates.includes(data.regionName);
        const selectedTheme = shouldBeLight ? 'light' : 'dark';

        setTheme(selectedTheme);
        
        // Force the HTML tag to follow the decision
        if (selectedTheme === 'light') {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        }
      } catch (error) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
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
              {!isAuthPage && <Navbar />}
              
              <div className="flex flex-1">
                
                {/* Only show Sidebar if logged in and NOT on an Auth Page */}
                {!isAuthPage && <Sidebar />}
                
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