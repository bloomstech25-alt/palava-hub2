import { useEffect, useState } from "react";
import { Link } from "wouter";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar } from "./Avatar";
import { TrendingUp } from "lucide-react";

type ContactUser = {
  id: string;
  name: string;
  avatar?: string;
  school?: { name?: string };
};

export function RightSidebar() {
  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [trending, setTrending] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qq = query(collection(db, "users"), limit(15));
        const snap = await getDocs(qq);
        if (cancelled) return;
        setContacts(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ContactUser, "id">),
          })),
        );
      } catch {
        /* ignore */
      }
      try {
        const qq2 = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          limit(50),
        );
        const snap2 = await getDocs(qq2);
        if (cancelled) return;
        const counts = new Map<string, number>();
        snap2.forEach((d) => {
          const data = d.data() as { tags?: string[]; content?: string };
          const fromTags = Array.isArray(data.tags) ? data.tags : [];
          const fromContent = (data.content ?? "").match(/#\w+/g) ?? [];
          const all = new Set(
            [...fromTags, ...fromContent]
              .map((t) => t.toLowerCase().replace(/^#/, ""))
              .filter(Boolean),
          );
          all.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
        });
        const sorted = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([tag, count]) => ({ tag, count }));
        setTrending(sorted);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="hidden xl:block w-[320px] shrink-0 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pr-2 pl-4 space-y-6">
      <section>
        <div className="flex items-center gap-2 mb-2 px-2">
          <TrendingUp className="w-4 h-4 text-fb-text-secondary" />
          <h2 className="font-bold text-fb-text-secondary text-sm">
            Trending in Liberia
          </h2>
        </div>
        {trending.length === 0 ? (
          <div className="px-2 text-xs text-fb-text-secondary">
            No trends yet
          </div>
        ) : (
          <ul className="space-y-1">
            {trending.map((t, i) => (
              <li key={t.tag}>
                <Link
                  href={`/topic/${t.tag}`}
                  className="block px-3 py-2 rounded-xl hover:bg-fb-hover"
                >
                  <div className="text-xs text-fb-text-secondary">
                    Trending · #{i + 1}
                  </div>
                  <div className="font-semibold">#{t.tag}</div>
                  <div className="text-xs text-fb-text-secondary">
                    {t.count} posts
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-bold text-fb-text-secondary text-sm mb-2 px-2">
          Contacts
        </h2>
        <ul className="space-y-1">
          {contacts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/profile/${c.id}`}
                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-fb-hover"
              >
                <div className="relative">
                  <Avatar name={c.name ?? "?"} src={c.avatar} size={36} />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  {c.school?.name && (
                    <div className="text-[11px] text-fb-text-secondary truncate">
                      {c.school.name}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
          {contacts.length === 0 && (
            <li className="px-2 text-xs text-fb-text-secondary">
              No users yet. Be the first!
            </li>
          )}
        </ul>
      </section>
    </aside>
  );
}
