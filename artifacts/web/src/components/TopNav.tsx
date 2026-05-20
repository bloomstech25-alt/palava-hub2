import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Search, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./Avatar";

export function TopNav() {
  const { profile, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
  ];

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

        <div className="flex-1 max-w-[240px] hidden sm:flex items-center gap-2 bg-fb-bg rounded-full px-3 py-2">
          <Search className="w-4 h-4 text-fb-text-secondary shrink-0" />
          <input
            type="text"
            placeholder="Search Palava Hub"
            className="bg-transparent outline-none text-sm flex-1 min-w-0"
          />
        </div>

        <nav className="flex-1 flex justify-center gap-1 md:gap-2">
          {tabs.map((t) => {
            const active = location === t.href;
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-4 md:px-10 py-2 rounded-lg flex items-center justify-center transition-colors ${
                  active
                    ? "text-fb-blue"
                    : "text-fb-text-secondary hover:bg-fb-hover"
                }`}
                title={t.label}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                <span
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] bg-fb-blue rounded-t-full transition-all ${
                    active ? "w-full" : "w-0"
                  }`}
                />
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
                <div className="p-3 border-b border-fb-border flex items-center gap-3">
                  <Avatar name={profile?.name ?? "?"} src={profile?.avatar} size={44} />
                  <div className="min-w-0">
                    <div className="font-bold truncate">{profile?.name}</div>
                    <div className="text-xs text-fb-text-secondary truncate">
                      @{profile?.username}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-fb-hover flex items-center gap-3 text-fb-text"
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
