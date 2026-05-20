import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Search as SearchIcon,
  LogOut,
  Menu,
  MessageCircle,
  Bell,
  Flame,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMessaging } from "@/context/MessagingContext";
import { Avatar } from "./Avatar";

export function TopNav() {
  const { profile, logout } = useAuth();
  const { totalUnread } = useMessaging();
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/messages", icon: MessageCircle, label: "Messages", badge: totalUnread },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/palava-room", icon: Flame, label: "Palava Room" },
  ];

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-fb-border shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center gap-2 md:gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0"
          aria-label="Palava Hub home"
        >
          <img
            src={`${import.meta.env.BASE_URL}palava-icon.png`}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="hidden lg:block font-black text-lg text-palava-red">
            Palava Hub
          </span>
        </Link>

        <form
          onSubmit={onSearchSubmit}
          className="flex-1 max-w-[240px] hidden sm:flex items-center gap-2 bg-fb-bg rounded-full px-3 py-2"
        >
          <SearchIcon className="w-4 h-4 text-fb-text-secondary shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search Palava Hub"
            className="bg-transparent outline-none text-sm flex-1 min-w-0"
          />
        </form>

        <nav className="flex-1 flex justify-center gap-1 md:gap-2">
          {tabs.map((t) => {
            const active =
              location === t.href ||
              (t.href !== "/" && location.startsWith(t.href));
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative px-3 md:px-8 py-2 rounded-lg flex items-center justify-center transition-colors ${
                  active
                    ? "text-palava-red"
                    : "text-fb-text-secondary hover:bg-fb-hover"
                }`}
                title={t.label}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                {!!t.badge && t.badge > 0 && (
                  <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-palava-red text-white text-[10px] font-bold flex items-center justify-center">
                    {t.badge > 99 ? "99+" : t.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0 relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="flex items-center gap-2 hover:bg-fb-hover rounded-full p-1 transition-colors"
          >
            <Avatar
              name={profile?.name ?? "?"}
              src={profile?.avatar}
              size={36}
            />
          </button>
          {menuOpen && (
            <>
              <button
                aria-hidden
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-30 cursor-default"
              />
              <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-fb-border z-40 overflow-hidden">
                <Link
                  href={`/profile/${profile?.id ?? ""}`}
                  onClick={() => setMenuOpen(false)}
                  className="p-3 border-b border-fb-border flex items-center gap-3 hover:bg-fb-hover"
                >
                  <Avatar name={profile?.name ?? "?"} src={profile?.avatar} size={44} />
                  <div className="min-w-0">
                    <div className="font-bold truncate">{profile?.name}</div>
                    <div className="text-xs text-fb-text-secondary truncate">
                      @{profile?.username}
                    </div>
                  </div>
                </Link>
                <Link
                  href={`/profile/${profile?.id ?? ""}`}
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-fb-hover flex items-center gap-3"
                >
                  <UserIcon className="w-4 h-4" />
                  My profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-fb-hover flex items-center gap-3"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-fb-hover flex items-center gap-3 text-fb-text border-t border-fb-border"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </>
          )}
          <button
            className="md:hidden p-2 hover:bg-fb-hover rounded-full"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
