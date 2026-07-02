import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";

const LOGO = `${import.meta.env.BASE_URL}palava-lockup.png`;

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ name, username, email, password });
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code.includes("email-already-in-use"))
        setError("That email is already registered. Try logging in.");
      else if (code.includes("weak-password"))
        setError("Password must be at least 6 characters.");
      else if (code.includes("invalid-email"))
        setError("Please enter a valid email address.");
      else setError("Sign up failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(ellipse at top left, #2a1408 0%, #0d0a08 55%, #000 100%)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-palava-red" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-palava-red" />
        <div className="flex-1 bg-palava-gold" />
      </div>
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-palava-red/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-palava-gold/10 blur-3xl" />

      <div className="relative w-full max-w-[460px]">
        <img
          src={LOGO}
          alt="Palava Hub"
          className="h-24 sm:h-28 mx-auto mb-6 select-none max-w-full w-auto"
          draggable={false}
        />

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-2xl p-6 space-y-3 border border-white/10"
        >
          <h2 className="text-2xl font-bold text-center text-palava-dark-2">
            Join Palava Hub
          </h2>
          <p className="text-center text-sm text-fb-text-secondary border-b border-fb-border pb-3">
            It's quick and easy.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            className="w-full px-4 py-3 border border-fb-border rounded-lg text-[15px] bg-fb-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-palava-red/30 focus:border-palava-red"
          />
          <input
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            placeholder="Username"
            required
            minLength={3}
            className="w-full px-4 py-3 border border-fb-border rounded-lg text-[15px] bg-fb-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-palava-red/30 focus:border-palava-red"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3 border border-fb-border rounded-lg text-[15px] bg-fb-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-palava-red/30 focus:border-palava-red"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            required
            minLength={6}
            className="w-full px-4 py-3 border border-fb-border rounded-lg text-[15px] bg-fb-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-palava-red/30 focus:border-palava-red"
          />
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded">
              {error}
            </div>
          )}
          <p className="text-[11px] text-fb-text-secondary leading-relaxed">
            By clicking Sign Up, you agree to our Terms and Community Guidelines.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-palava-gold hover:bg-palava-gold-light text-palava-dark-2 font-bold py-3 rounded-lg text-[17px] disabled:opacity-60 shadow-md shadow-palava-gold/30 transition-colors"
          >
            {busy ? "Creating account…" : "Sign Up"}
          </button>
          <div className="text-center pt-2">
            <Link href="/login" className="text-palava-red text-sm font-medium hover:underline">
              Already have an account?
            </Link>
          </div>
        </form>
        <p className="text-center text-xs text-white/60 mt-5">
          Made with pride in Liberia 🇱🇷
        </p>
      </div>
    </div>
  );
}
