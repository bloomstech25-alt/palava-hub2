export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#BF0A30] flex items-center justify-center text-white font-bold">
            P
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Palava Hub</h1>
            <p className="text-xs text-slate-500">Privacy Policy</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          Palava Hub Privacy Policy
        </h2>
        <p className="text-sm text-slate-500 mb-8">Effective Date: May 4, 2026</p>

        <p className="text-[15px] leading-7 mb-6">
          Palava Hub ("we", "our", "us") respects your privacy. This policy
          explains how we collect, use, and protect your information when you
          use our mobile and web services.
        </p>

        <Section title="1. Information We Collect">
          <ul className="list-disc pl-6 space-y-1.5 text-[15px] leading-7">
            <li>Email address (for account creation)</li>
            <li>Phone number (when you choose phone sign-up)</li>
            <li>School selection (to connect users with their campus community)</li>
            <li>
              User-generated content (posts, comments, Palava posts, photos,
              videos, audio)
            </li>
            <li>Device and usage data (device type, OS, crash logs, in-app actions)</li>
          </ul>
        </Section>

        <Section title="2. How We Use Information">
          <ul className="list-disc pl-6 space-y-1.5 text-[15px] leading-7">
            <li>To create and manage your account</li>
            <li>To connect you with your school community</li>
            <li>To deliver, personalize, and improve the user experience</li>
            <li>
              To ensure safety, prevent abuse, and enforce our Community
              Guidelines
            </li>
          </ul>
        </Section>

        <Section title="3. Anonymous Posting (Palava Room)">
          <p className="text-[15px] leading-7">
            Posts made in the "Palava Room" section are anonymous to other
            users. We may internally link activity to accounts to enforce safety
            and prevent misuse, but this internal linkage is never exposed to
            other users.
          </p>
        </Section>

        <Section title="4. Content Moderation">
          <p className="text-[15px] leading-7">
            We monitor and review content to prevent abuse, harassment, and
            harmful or illegal activity. Users can report content directly from
            the app, and our moderation team reviews every report.
          </p>
        </Section>

        <Section title="5. Data Sharing">
          <p className="text-[15px] leading-7 mb-2">
            We do not sell your data. We may share data only:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-[15px] leading-7">
            <li>To comply with legal obligations</li>
            <li>To protect user safety</li>
            <li>
              With service providers (Firebase, hosting) who help us operate the
              app
            </li>
          </ul>
        </Section>

        <Section title="6. Account Deletion">
          <p className="text-[15px] leading-7">
            Users can permanently delete their account at any time from
            Settings → Account → Delete my account. Deletion removes your
            profile, posts, and Firestore data. Some anonymized logs may be
            retained for fraud and abuse prevention as required by law.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p className="text-[15px] leading-7">
            Palava Hub is not directed at children under 13. If we learn we have
            collected data from a child under 13 without parental consent, we
            will delete it.
          </p>
        </Section>

        <Section title="8. Security">
          <p className="text-[15px] leading-7">
            We use reasonable measures including Firebase Authentication,
            encrypted data at rest, and HTTPS in transit to protect your data.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p className="text-[15px] leading-7">
            We may update this policy from time to time. Material changes will
            be communicated through the app. Continued use after changes means
            you accept the updated policy.
          </p>
        </Section>

        <Section title="10. Contact">
          <p className="text-[15px] leading-7">
            For questions about this policy, contact us at:{" "}
            <a
              href="mailto:support@palavahub.com"
              className="text-[#BF0A30] underline font-medium"
            >
              support@palavahub.com
            </a>
          </p>
        </Section>

        <footer className="mt-16 pt-6 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Palava Hub</span>
          <span>Powered by Blooms Technologies</span>
        </footer>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      {children}
    </section>
  );
}
