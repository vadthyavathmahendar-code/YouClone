"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Zap, 
  PlaySquare, 
  UserCircle, 
  History, 
  ShoppingBag, 
  Music2, 
  Film, 
  Gamepad2,
  ListVideo
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const sections = [
    {
      items: [
        { icon: <Home size={22} />, label: "Home", href: "/home" },
        { icon: <Zap size={22} />, label: "Shorts", href: "/shorts" },
        { icon: <PlaySquare size={22} />, label: "Subscriptions", href: "/subscriptions" },
      ]
    },
    {
      label: "You",
      items: [
        { icon: <UserCircle size={22} />, label: "Your channel", href: "/profile" }, // Point to Profile
        { icon: <History size={22} />, label: "History", href: "/history" },       // Point to History
        { icon: <ListVideo size={22} />, label: "Playlists", href: "/library" },
      ]
    },
    {
      label: "Explore",
      items: [
        { icon: <ShoppingBag size={22} />, label: "Shopping", href: "#" },
        { icon: <Music2 size={22} />, label: "Music", href: "#" },
        { icon: <Film size={22} />, label: "Films", href: "#" },
        { icon: <Gamepad2 size={22} />, label: "Gaming", href: "#" },
      ]
    }
  ];

return (
  <aside className="w-[240px] hidden lg:flex flex-col h-[calc(100vh-56px)] sticky top-14 overflow-y-auto no-scrollbar 
                    bg-white dark:bg-[#0f0f0f] border-r border-gray-100 dark:border-white/5 transition-colors duration-500">
    <div className="p-3">
      {sections.map((section, sIdx) => (
        <div key={sIdx} className={sIdx !== 0 ? "mt-4 pt-4 border-t border-gray-100 dark:border-white/5" : ""}>
          {section.label && (
            <h3 className="px-3 py-2 text-[12px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest opacity-60">
              {section.label}
            </h3>
          )}
          {section.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.label} 
                href={item.href} 
                className={`flex items-center px-4 py-3 rounded-xl mb-1 transition-all group
                  ${isActive 
                    ? 'bg-gray-100 dark:bg-[#272727] font-bold' 
                    : 'hover:bg-gray-50 dark:hover:bg-[#272727]'}`}
              >
                <span className={`mr-5 flex items-center justify-center transition-colors
                  ${isActive ? 'text-red-600' : 'text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white'}`}>
                  {item.icon}
                </span>
                
                <span className={`text-[14px] font-medium tracking-tight
                  ${isActive ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
    
    <div className="p-6 mt-auto">
      <p className="text-[10px] opacity-40 dark:opacity-20 font-black uppercase leading-tight text-gray-600 dark:text-white">
        © 2026 YouClone<br/>Secunderabad Node
      </p>
    </div>
  </aside>
);
}