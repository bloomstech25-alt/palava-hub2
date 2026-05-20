import {
  Users,
  MessageCircle,
  Bookmark,
  Flag,
  GraduationCap,
  Flame,
  Bell,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./Avatar";

const items = [
  { icon: Users, label: "Friends", color: "#0866FF" },
  { icon: MessageCircle, label: "Messages", color: "#1B998B" },
  { icon: Bell, label: "Notifications", color: "#E84393" },
  { icon: GraduationCap, label: "My School", color: "#BF0A30" },
  { icon: Flame, label: "Palava Room", color: "#F39C12" },
  { icon: Bookmark, label: "Saved", color: "#7B61FF" },
  { icon: Flag, label: "Report a Problem", color: "#65676B" },
];

export function LeftSidebar() {
  const { profile } = useAuth();
  return (
    <aside className="hidden lg:block w-[320px] shrink-0 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pl-2 pr-4 space-y-1">
      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-fb-hover">
        <Avatar name={profile?.name ?? "?"} src={profile?.avatar} size={36} />
        <span className="font-semibold text-sm truncate">{profile?.name}</span>
      </button>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <button
            key={it.label}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-fb-hover text-left"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${it.color}1A`, color: it.color }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{it.label}</span>
          </button>
        );
      })}
      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-fb-hover text-left">
        <div className="w-9 h-9 rounded-full bg-fb-bg flex items-center justify-center shrink-0">
          <ChevronDown className="w-5 h-5 text-fb-text" />
        </div>
        <span className="text-sm font-medium">See more</span>
      </button>
      <div className="pt-4 px-3 text-[11px] text-fb-text-secondary leading-relaxed">
        Privacy · Terms · Cookies · Community Guidelines
        <div className="mt-2 font-semibold">
          Palava Hub © 2026
        </div>
        <div className="mt-1">Made with pride in Liberia 🇱🇷</div>
      </div>
    </aside>
  );
}
