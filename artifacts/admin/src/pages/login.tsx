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

  // If already signed in as admin, jump to dashboard.
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
      // Force-refresh the token so we read the most recent custom claims.
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(24, 24%, 5%)" }}>
      <div className="w-full max-w-md px-8 py-10 bg-card border border-card-border rounded-2xl shadow-2xl">
        <div className="mb-8 text-center">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Palava Hub" className="w-14 h-14 rounded-2xl mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Palava Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Super Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-login">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              data-testid="input-email"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              data-testid="input-password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm transition-all"
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg" data-testid="text-error">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            data-testid="button-login"
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all duration-150"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
