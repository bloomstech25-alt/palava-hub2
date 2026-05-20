import { Link } from "wouter";
import { useMessaging } from "@/context/MessagingContext";
import { Avatar } from "@/components/Avatar";
import { timeAgo } from "@/lib/utils";

export default function Messages() {
  const { conversations } = useMessaging();
  return (
    <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border overflow-hidden">
      <div className="p-4 border-b border-fb-border">
        <h1 className="text-xl font-bold">Messages</h1>
        <p className="text-xs text-fb-text-secondary mt-1">
          You can only start new chats with people who follow you back. Existing
          conversations are always available.
        </p>
      </div>
      {conversations.length === 0 ? (
        <div className="p-10 text-center text-sm text-fb-text-secondary">
          No conversations yet. Tap a profile and start a chat.
        </div>
      ) : (
        <ul>
          {conversations.map((c) => {
            const ms = new Date(c.lastAt).getTime();
            return (
              <li key={c.userId}>
                <Link
                  href={`/messages/${c.userId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-fb-hover"
                >
                  <Avatar name={c.name || "?"} src={c.avatar} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold truncate">
                        {c.name || c.username}
                      </div>
                      <div className="text-[11px] text-fb-text-secondary shrink-0">
                        {ms ? timeAgo(ms) : ""}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`text-sm truncate ${
                          c.unread > 0
                            ? "text-fb-text font-semibold"
                            : "text-fb-text-secondary"
                        }`}
                      >
                        {c.lastMessage || "Start chatting…"}
                      </div>
                      {c.unread > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-palava-red text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
