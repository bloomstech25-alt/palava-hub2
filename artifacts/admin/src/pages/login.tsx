import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAdminAuth, logoutAdmin } from "@/lib/auth";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loading, user, isAdmin } = useAdminAuth();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      setLocation("/dashboard");
    }
  }, [loading, user, isAdmin, setLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const tokenResult = await cred.user.getIdTokenResult(true);
      if (tokenResult.claims.admin !== true) {
        await logoutAdmin();
        setError("This account does not have admin access. Contact the project owner to grant the admin role.");
        setSubmitting(false);
        return;
      }
      setLocation("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again in a few minutes.");
      } else if (code === "auth/network-request-failed") {
        setError("Network error. Check your connection and try again.");
      } else {
        setError("Sign in failed. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4 py-10"
      style={{
        background:
          "linear-gradient(135deg, #0D0A08 0%, #1A0E06 35%, #0A1628 70%, #0D1B3E 100%)",
      }}
    >
      {/* Glow accents */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "-10%",
          width: 480,
          height: 480,
          background: "radial-gradient(circle, rgba(191,10,48,0.28) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-15%",
          right: "-10%",
          width: 520,
          height: 520,
          background: "radial-gradient(circle, rgba(0,40,104,0.35) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "30%",
          right: "20%",
          width: 320,
          height: 320,
          background: "radial-gradient(circle, rgba(212,168,85,0.18) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Kente-inspired strip top */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 flex"
        aria-hidden
      >
        {[
          "#BF0A30", "#D4A855", "#002868", "#D4A855", "#BF0A30",
          "#FFFFFF", "#002868", "#D4A855", "#BF0A30", "#002868",
        ].map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      {/* Kente-inspired strip bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1.5 flex"
        aria-hidden
      >
        {[
          "#002868", "#BF0A30", "#D4A855", "#FFFFFF", "#BF0A30",
          "#D4A855", "#002868", "#BF0A30", "#D4A855", "#002868",
        ].map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand lockup */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-28 h-28 rounded-3xl mb-5 relative"
            style={{
              background: "linear-gradient(135deg, #BF0A30 0%, #8B0820 100%)",
              boxShadow: "0 12px 40px rgba(191,10,48,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Palava Hub"
              className="w-20 h-20 rounded-2xl"
            />
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
              style={{
                background: "linear-gradient(135deg, #F1C232 0%, #D4A12A 100%)",
                color: "#0D0A08",
                fontWeight: 900,
                boxShadow: "0 4px 12px rgba(212,161,42,0.5)",
              }}
              aria-hidden
            >
              ★
            </span>
          </div>
          <h1
            className="text-6xl font-black tracking-tight mb-1"
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #F1C232 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Palava Hub
          </h1>
          <p className="text-sm font-semibold tracking-wide" style={{ color: "#D4A855" }}>
            Where Liberian students connect
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: "rgba(191,10,48,0.15)",
              color: "#FFB3C0",
              border: "1px solid rgba(191,10,48,0.4)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 3, background: "#BF0A30" }} />
            SUPER ADMIN
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 backdrop-blur-xl"
          style={{
            background: "rgba(13, 10, 8, 0.72)",
            border: "1px solid rgba(212,168,85,0.22)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-login">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D4A855" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@palavahub.com"
                required
                autoComplete="email"
                data-testid="input-email"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(212,168,85,0.25)",
                  color: "#FFFFFF",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#D4A855";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,168,85,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(212,168,85,0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D4A855" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                data-testid="input-password"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(212,168,85,0.25)",
                  color: "#FFFFFF",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#D4A855";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,168,85,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(212,168,85,0.25)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                data-testid="text-error"
                style={{
                  background: "rgba(191,10,48,0.12)",
                  border: "1px solid rgba(191,10,48,0.4)",
                  color: "#FFB3C0",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              data-testid="button-login"
              className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: submitting
                  ? "linear-gradient(135deg, #8B0820 0%, #6B0618 100%)"
                  : "linear-gradient(135deg, #BF0A30 0%, #8B0820 100%)",
                color: "#FFFFFF",
                boxShadow: "0 8px 24px rgba(191,10,48,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                letterSpacing: "0.1em",
              }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 flex items-center justify-center gap-2 text-[11px] font-medium"
            style={{
              borderTop: "1px solid rgba(212,168,85,0.15)",
              color: "rgba(212,168,85,0.7)",
            }}
          >
            <span>🔒</span>
            <span className="tracking-wide">Authorized personnel only</span>
          </div>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          Made with pride in Liberia 🇱🇷
        </p>
      </div>
    </div>
  );
}
