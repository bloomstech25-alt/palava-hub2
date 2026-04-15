import { useLocation, Link } from "wouter";
import { removeToken } from "@/lib/auth";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/schools",
    label: "Schools",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/users",
    label: "Users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    href: "/posts",
    label: "Content",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: "/ads",
    label: "Ads Manager",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    href: "/verifications",
    label: "Verifications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
        <path d="M12 2L4 5.5V12c0 4.8 3.5 9.1 8 10.5C16.5 21.1 20 16.8 20 12V5.5L12 2z" fill="#BF0A30"/>
        <polygon points="12,7 13.1,10.3 16.5,10.3 13.9,12.3 14.9,15.5 12,13.5 9.1,15.5 10.1,12.3 7.5,10.3 10.9,10.3" fill="#D4A855"/>
      </svg>
    ),
  },
];

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();

  function handleLogout() {
    removeToken();
    setLocation("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col shrink-0 bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
              <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
                <circle cx="16" cy="16" r="14" fill="#BF0A30"/>
                <polygon points="16,6 17.2,10.5 22,10.5 18.2,13.2 19.4,17.8 16,15 12.6,17.8 13.8,13.2 10,10.5 14.8,10.5" fill="#D4A855"/>
                <circle cx="8" cy="20" r="2" fill="#D4A855"/>
                <circle cx="24" cy="20" r="2" fill="#D4A855"/>
                <circle cx="16" cy="25" r="2" fill="#D4A855"/>
                <line x1="8" y1="20" x2="16" y2="25" stroke="#D4A855" strokeWidth="1"/>
                <line x1="24" y1="20" x2="16" y2="25" stroke="#D4A855" strokeWidth="1"/>
                <line x1="8" y1="20" x2="16" y2="16" stroke="#D4A855" strokeWidth="1"/>
                <line x1="24" y1="20" x2="16" y2="16" stroke="#D4A855" strokeWidth="1"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Palava Hub</p>
              <p className="text-xs text-sidebar-foreground mt-0.5">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar-primary text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            data-testid="button-logout"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-all duration-150"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
