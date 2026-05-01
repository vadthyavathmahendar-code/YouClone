"use client";
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Zap, PlaySquare, UserCircle, History, Music2, Film, Gamepad2, ListVideo, TrendingUp, LogOut } from 'lucide-react';
import { Suspense } from 'react';

const sections = [
  {
    items: [
      { icon: Home,       label: "Home",          href: "/home" },
      { icon: Zap,        label: "Shorts",        href: "/shorts" },
      { icon: PlaySquare, label: "Subscriptions", href: "/subscriptions" },
      { icon: TrendingUp, label: "Trending",      href: "/home?cat=trending" },
    ]
  },
  {
    label: "You",
    items: [
      { icon: UserCircle, label: "Your Channel", href: "/profile" },
      { icon: History,    label: "History",      href: "/history" },
      { icon: ListVideo,  label: "Playlists",    href: "/playlists" },
    ]
  },
  {
    label: "Explore",
    items: [
      { icon: Music2,   label: "Music",  href: "#" },
      { icon: Film,     label: "Films",  href: "#" },
      { icon: Gamepad2, label: "Gaming", href: "#" },
    ]
  }
];

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Exact match: /home only highlights Home, /home?cat=trending only highlights Trending
  const isActive = (href: string) => {
    const [hPath, hQuery] = href.split('?');
    if (hQuery) {
      // Has query — must match both path and query param
      const key = hQuery.split('=')[0];
      const val = hQuery.split('=')[1];
      return pathname === hPath && searchParams.get(key) === val;
    }
    // No query — path must match AND no cat param present
    return pathname === hPath && !searchParams.get('cat');
  };

  return (
    <aside className="w-[220px] hidden lg:flex flex-col h-[calc(100vh-56px)] sticky top-14 overflow-y-auto no-scrollbar
                      bg-white dark:bg-[#050505] border-r border-gray-100 dark:border-white/5">
      <nav className="p-2 flex-1">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx !== 0 ? "mt-2 pt-2 border-t border-gray-100 dark:border-white/5" : ""}>
            {section.label && (
              <p className="px-3 pt-2 pb-1 text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch={false}
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-xl mb-0.5 group
                    transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                    ${active ? 'bg-red-50 dark:bg-white/10' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                >
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-colors duration-200
                      ${active
                        ? 'text-red-600 dark:text-red-500'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}
                  />
                  <span className={`text-[13px] tracking-tight transition-colors duration-200
                    ${active
                      ? 'text-gray-900 dark:text-white font-bold'
                      : 'font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                    {item.label}
                  </span>
                  {active && <span className="ml-auto w-1 h-4 bg-red-600 rounded-full" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-white/5">
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group font-semibold text-[13px]"
        >
          <LogOut size={20} className="flex-shrink-0" />
          Sign out
        </button>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest leading-relaxed mt-2 px-3">
          © 2026 YouClone<br />Secunderabad Node
        </p>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarInner />
    </Suspense>
  );
}
