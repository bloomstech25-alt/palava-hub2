import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";

const LOGO = `${import.meta.env.BASE_URL}palava-lockup.png`;

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
      if (code === "auth/user-disabled")
        setError(
          "Your account has been suspended. If you believe this is a mistake, please contact support at support@palavahub.com.",
        );
      else if (code.includes("invalid") || code.includes("wrong-password") || code.includes("user-not-found"))
        setError("Invalid email or password.");
      else if (code.includes("too-many"))
        setError("Too many attempts. Try again later.");
      else setError("Sign in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top left, #2a1408 0%, #0d0a08 55%, #000 100%)",
      }}
    >
      {/* Liberian flag accent stripes */}
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-palava-red" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-palava-red" />
        <div className="flex-1 bg-palava-gold" />
      </div>
      {/* Glow accents */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-palava-red/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-palava-gold/10 blur-3xl" />

      <div className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 py-12 gap-10 lg:gap-20 max-w-[1200px] mx-auto">
        {/* Hero / brand */}
        <section className="flex-1 text-center lg:text-left text-white">
          <img
            src={LOGO}
            alt="Palava Hub"
            className="h-20 sm:h-24 mx-auto lg:mx-0 mb-6 select-none"
            draggable={false}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
            The home of Liberian
            <br />
            <span className="text-palava-gold">student life.</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-white/80 max-w-md mx-auto lg:mx-0 leading-snug">
            Connect with friends, classmates and your school community across
            Liberia — chat, share, and keep up with campus jams.
          </p>
          <div className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-sm text-white/60">
            <span className="inline-block w-2 h-2 rounded-full bg-palava-gold" />
            Proudly Liberian · Made for students
          </div>
        </section>

        {/* Auth card */}
        <section className="w-full max-w-[420px]">
          <form
            onSubmit={submit}
            className="bg-white rounded-2xl shadow-2xl p-6 space-y-3 border border-white/10"
          >
            <h2 className="text-lg font-bold text-palava-dark-2 mb-1">
              Welcome back
            </h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-fb-border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-palava-red/30 focus:border-palava-red"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-fb-border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-palava-red/30 focus:border-palava-red"
            />
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-palava-red hover:bg-palava-red-dark text-white font-bold py-3 rounded-lg text-[17px] disabled:opacity-60 shadow-md shadow-palava-red/20 transition-colors"
            >
              {busy ? "Signing in…" : "Log In"}
            </button>
            <div className="text-center">
              <button
                type="button"
                className="text-palava-red text-sm font-medium hover:underline"
              >
                Forgotten password?
              </button>
            </div>
            <div className="border-t border-fb-border pt-4 text-center">
              <Link
                href="/register"
                className="inline-block bg-palava-gold hover:bg-palava-gold-light text-palava-dark-2 font-bold px-6 py-3 rounded-lg text-[16px] shadow-md shadow-palava-gold/30 transition-colors"
              >
                Create new account
              </Link>
            </div>
          </form>
          <p className="text-center text-xs text-white/60 mt-5">
            Made with pride in Liberia 🇱🇷
          </p>
        </section>
      </div>
    </div>
  );
}
