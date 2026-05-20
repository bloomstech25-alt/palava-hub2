import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code.includes("invalid") || code.includes("wrong-password") || code.includes("user-not-found"))
        setError("Invalid email or password.");
      else if (code.includes("too-many"))
        setError("Too many attempts. Try again later.");
      else setError("Sign in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 py-10 gap-12 lg:gap-24 max-w-[1100px] mx-auto">
      <section className="flex-1 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-fb-blue flex items-center justify-center text-white font-black text-3xl shadow-lg">
            P
          </div>
          <h1 className="text-5xl font-black text-fb-blue tracking-tight">
            Palava Hub
          </h1>
        </div>
        <p className="text-xl lg:text-2xl text-fb-text leading-snug max-w-md mx-auto lg:mx-0">
          Connect with friends, classmates and your school community across Liberia.
        </p>
      </section>

      <section className="w-full max-w-[400px]">
        <form
          onSubmit={submit}
          className="bg-white rounded-xl shadow-xl p-5 space-y-3"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            autoComplete="email"
            className="w-full px-4 py-3 border border-fb-border rounded-md text-[17px] focus:outline-none focus:ring-2 focus:ring-fb-blue/40 focus:border-fb-blue"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 border border-fb-border rounded-md text-[17px] focus:outline-none focus:ring-2 focus:ring-fb-blue/40 focus:border-fb-blue"
          />
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-fb-blue hover:bg-fb-blue-hover text-white font-bold py-3 rounded-md text-[20px] disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Log In"}
          </button>
          <div className="text-center text-fb-blue text-sm hover:underline cursor-pointer">
            Forgotten password?
          </div>
          <div className="border-t border-fb-border pt-4 text-center">
            <Link
              href="/register"
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-md text-[17px]"
            >
              Create new account
            </Link>
          </div>
        </form>
        <p className="text-center text-xs text-fb-text-secondary mt-4">
          Made with pride in Liberia 🇱🇷
        </p>
      </section>
    </div>
  );
}
