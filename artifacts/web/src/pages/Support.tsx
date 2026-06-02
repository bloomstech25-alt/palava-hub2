import { LegalLayout, H2, P, UL, LI } from "./LegalLayout";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TOPICS = [
  { key: "bug", label: "Report a bug" },
  { key: "abuse", label: "Report abuse or harassment" },
  { key: "content", label: "Report harmful content" },
  { key: "account", label: "Account issue" },
  { key: "feedback", label: "Feedback or feature request" },
  { key: "other", label: "Other / general help" },
];

function ContactForm() {
  const [topic, setTopic] = useState("bug");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10) return;
    setStatus("sending");
    try {
      await addDoc(collection(db, "supportRequests"), {
        topic,
        message: message.trim(),
        userName: name.trim() || "Anonymous",
        userEmail: email.trim() || null,
        userId: null,
        status: "open",
        source: "web",
        createdAt: serverTimestamp(),
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="text-2xl mb-2">✓</div>
        <div className="font-bold text-green-800 mb-1">Message received!</div>
        <p className="text-sm text-green-700">
          Our team will review your report and respond within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-fb-text-secondary mb-1.5 uppercase tracking-wide">
            Your name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full rounded-xl border border-fb-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-palava-red/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-fb-text-secondary mb-1.5 uppercase tracking-wide">
            Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-fb-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-palava-red/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-fb-text-secondary mb-1.5 uppercase tracking-wide">
          Topic
        </label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-xl border border-fb-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-palava-red/30"
        >
          {TOPICS.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-fb-text-secondary mb-1.5 uppercase tracking-wide">
          Describe the issue <span className="text-palava-red">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what happened. Include any relevant details…"
          rows={5}
          maxLength={1500}
          required
          className="w-full rounded-xl border border-fb-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-palava-red/30 resize-none"
        />
        <div className="text-right text-xs text-fb-text-secondary mt-1">{message.length}/1500</div>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">
          Something went wrong. Please try again or email us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending" || message.trim().length < 10}
        className="w-full rounded-xl bg-palava-red text-white font-semibold py-3 text-sm hover:bg-palava-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

export default function Support() {
  return (
    <LegalLayout
      title="Support"
      description="Get help with your Palava Hub account, report issues, or send feedback to our team."
    >
      <P>
        Need help? Our admin team is here for you. You can send us a message using the form below
        or email us directly at{" "}
        <a href="mailto:support@palavahub.com" className="text-palava-red hover:underline">
          support@palavahub.com
        </a>
        . We respond within 2 business days.
      </P>

      <H2>Common Topics</H2>
      <UL>
        <LI>
          <strong>Account access issues</strong> — forgotten password, can't log in, account suspended
        </LI>
        <LI>
          <strong>Content moderation</strong> — appealing a removed post or account suspension
        </LI>
        <LI>
          <strong>Reporting abuse</strong> — harassment, hate speech, or harmful content
        </LI>
        <LI>
          <strong>Privacy concerns</strong> — requesting data deletion or asking about data practices
        </LI>
        <LI>
          <strong>Technical bugs</strong> — app crashes, posts not loading, notification issues
        </LI>
        <LI>
          <strong>Account deletion</strong> — see our{" "}
          <a href="/account-deletion" className="text-palava-red hover:underline">Account Deletion page</a>
        </LI>
      </UL>

      <H2>Send Us a Message</H2>
      <div className="mt-4">
        <ContactForm />
      </div>
    </LegalLayout>
  );
}
