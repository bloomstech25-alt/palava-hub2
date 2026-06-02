import { Link } from "wouter";
import {
  MessageCircle,
  Bookmark,
  GraduationCap,
  Flame,
  Bell,
  User as UserIcon,
  Music2,
  Search as SearchIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./Avatar";

export function LeftSidebar() {
  const { profile } = useAuth();
  const items = [
    {
      href: `/profile/${profile?.id ?? ""}`,
      icon: UserIcon,
      label: "My profile",
      color: "#BF0A30",
    },
    { href: "/messages", icon: MessageCircle, label: "Messages", color: "#1B998B" },
    { href: "/notifications", icon: Bell, label: "Notifications", color: "#E84393" },
    { href: "/palava-room", icon: Flame, label: "Palava Room", color: "#F39C12" },
    { href: "/campus-jams", icon: Music2, label: "Campus Jams", color: "#7B61FF" },
    { href: "/search", icon: SearchIcon, label: "Search", color: "#D4A12A" },
    { href: "/settings", icon: SettingsIcon, label: "Settings", color: "#65676B" },
  ];

  return (
    <aside className="hidden lg:block w-[300px] shrink-0 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pl-2 pr-4 space-y-1">
      <Link
        href={`/profile/${profile?.id ?? ""}`}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-fb-hover"
      >
        <Avatar name={profile?.name ?? "?"} src={profile?.avatar} size={36} />
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{profile?.name}</div>
          {profile?.school?.name ? (
            <div className="text-xs text-fb-text-secondary truncate">
              {profile.school.name}
            </div>
          ) : null}
        </div>
      </Link>

      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Link
            key={it.label}
            href={it.href}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-fb-hover text-left"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${it.color}1A`, color: it.color }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{it.label}</span>
          </Link>
        );
      })}

      <Link
        href="/"
        className="mt-4 mx-3 p-3 rounded-xl bg-palava-cream border border-fb-border flex items-start gap-2"
      >
        <GraduationCap className="w-5 h-5 text-palava-red shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <div className="font-semibold mb-0.5">Mobile app</div>
          <span className="text-fb-text-secondary">
            Go Live, voice posts, push notifications & more in the Palava Hub
            mobile app.
          </span>
        </div>
      </Link>

      <div className="pt-4 px-3 text-[11px] text-fb-text-secondary leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
          <span>·</span>
          <Link href="/terms-of-service" className="hover:underline">Terms</Link>
          <span>·</span>
          <Link href="/community-guidelines" className="hover:underline">Guidelines</Link>
          <span>·</span>
          <Link href="/support" className="hover:underline">Support</Link>
          <span>·</span>
          <Link href="/account-deletion" className="hover:underline">Delete Account</Link>
        </div>
        <div className="mt-2 font-semibold">Palava Hub © 2026</div>
        <div className="mt-1">Made with pride in Liberia 🇱🇷</div>
      </div>

      {/* Keep Bookmark import "used" if Saved is later added */}
      <span className="hidden">
        <Bookmark className="w-0 h-0" />
      </span>
    </aside>
  );
}
