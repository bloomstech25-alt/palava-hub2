import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

interface LegalLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, description, children }: LegalLayoutProps) {
  useEffect(() => {
    document.title = `${title} — Palava Hub`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
    return () => {
      document.title = "Palava Hub";
    };
  }, [title, description]);

  return (
    <div className="min-h-screen bg-fb-bg">
      <header className="sticky top-0 z-50 bg-white border-b border-fb-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-fb-text-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="w-px h-4 bg-fb-border mx-1" />
          <Link href="/" className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Palava Hub"
              className="w-7 h-7 rounded-lg"
            />
            <span className="font-bold text-palava-red text-sm">Palava Hub</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 pb-20">
        <h1 className="text-3xl font-black tracking-tight mb-1 text-foreground">{title}</h1>
        <p className="text-sm text-fb-text-secondary mb-8">Palava Hub · Effective June 1, 2026</p>
        <div className="prose prose-sm max-w-none space-y-0">{children}</div>
      </main>

      <footer className="border-t border-fb-border bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-xs text-fb-text-secondary space-y-2">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
            <Link href="/community-guidelines" className="hover:underline">Community Guidelines</Link>
            <Link href="/support" className="hover:underline">Support</Link>
            <Link href="/account-deletion" className="hover:underline">Account Deletion</Link>
          </div>
          <div>Palava Hub © 2026 · Made with pride in Liberia 🇱🇷</div>
        </div>
      </footer>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold mt-8 mb-3 text-foreground">{children}</h2>;
}
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-foreground mb-3">{children}</p>;
}
export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1.5 text-sm text-foreground mb-4 ml-2">{children}</ul>;
}
export function LI({ children }: { children: React.ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}
