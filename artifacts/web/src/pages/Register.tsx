import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";

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
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[450px]">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-fb-blue flex items-center justify-center text-white font-black text-xl">
            P
          </div>
          <h1 className="text-3xl font-black text-fb-blue">Palava Hub</h1>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-xl shadow-xl p-6 space-y-3"
        >
          <h2 className="text-2xl font-bold text-center">Create a new account</h2>
          <p className="text-center text-sm text-fb-text-secondary border-b border-fb-border pb-3">
            It's quick and easy.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            className="w-full px-4 py-3 border border-fb-border rounded-md text-[15px] bg-fb-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/40"
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
            className="w-full px-4 py-3 border border-fb-border rounded-md text-[15px] bg-fb-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/40"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3 border border-fb-border rounded-md text-[15px] bg-fb-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/40"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            required
            minLength={6}
            className="w-full px-4 py-3 border border-fb-border rounded-md text-[15px] bg-fb-bg focus:bg-white focus:outline-none focus:ring-2 focus:ring-fb-blue/40"
          />
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}
          <p className="text-[11px] text-fb-text-secondary leading-relaxed">
            By clicking Sign Up, you agree to our Terms and Community Guidelines.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-md text-[17px] disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Sign Up"}
          </button>
          <div className="text-center pt-2">
            <Link href="/login" className="text-fb-blue text-sm hover:underline">
              Already have an account?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
