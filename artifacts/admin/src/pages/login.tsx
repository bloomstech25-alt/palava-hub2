import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        if (data.success && data.token) {
          setToken(data.token);
          setLocation("/dashboard");
        } else {
          setError("Login failed. Please try again.");
        }
      },
      onError: () => {
        setError("Invalid username or password.");
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: { username, password } });
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(24, 24%, 5%)" }}>
      <div className="w-full max-w-md px-8 py-10 bg-card border border-card-border rounded-2xl shadow-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <circle cx="16" cy="16" r="14" fill="#BF0A30"/>
              <polygon points="16,6 17.2,10.5 22,10.5 18.2,13.2 19.4,17.8 16,15 12.6,17.8 13.8,13.2 10,10.5 14.8,10.5" fill="#D4A855"/>
              <circle cx="8" cy="20" r="2.5" fill="#D4A855"/>
              <circle cx="24" cy="20" r="2.5" fill="#D4A855"/>
              <circle cx="16" cy="25" r="2.5" fill="#D4A855"/>
              <line x1="8" y1="20" x2="16" y2="25" stroke="#D4A855" strokeWidth="1"/>
              <line x1="24" y1="20" x2="16" y2="25" stroke="#D4A855" strokeWidth="1"/>
              <line x1="8" y1="20" x2="16" y2="16" stroke="#D4A855" strokeWidth="1"/>
              <line x1="24" y1="20" x2="16" y2="16" stroke="#D4A855" strokeWidth="1"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Palava Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Super Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-login">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              data-testid="input-username"
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
            disabled={loginMutation.isPending}
            data-testid="button-login"
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all duration-150"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
