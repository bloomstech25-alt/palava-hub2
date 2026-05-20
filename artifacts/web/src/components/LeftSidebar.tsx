import { Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./Avatar";

export function LeftSidebar() {
  const { profile } = useAuth();
  return (
    <aside className="hidden lg:block w-[320px] shrink-0 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pl-2 pr-4 space-y-1">
      <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl">
        <Avatar name={profile?.name ?? "?"} src={profile?.avatar} size={36} />
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{profile?.name}</div>
          {profile?.school?.name ? (
            <div className="text-xs text-fb-text-secondary truncate">
              {profile.school.name}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 px-3 py-3 rounded-xl bg-white border border-fb-border">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-4 h-4 text-fb-red" />
          <span className="text-sm font-semibold">Get the full experience</span>
        </div>
        <p className="text-xs text-fb-text-secondary leading-relaxed">
          Messages, Palava Room, Campus Jams, Live, and more are available in
          the Palava Hub mobile app.
        </p>
      </div>

      <div className="pt-4 px-3 text-[11px] text-fb-text-secondary leading-relaxed">
        Privacy · Terms · Cookies · Community Guidelines
        <div className="mt-2 font-semibold">Palava Hub © 2026</div>
        <div className="mt-1">Made with pride in Liberia 🇱🇷</div>
      </div>
    </aside>
  );
}
