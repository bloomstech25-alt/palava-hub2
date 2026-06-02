import { LegalLayout, H2, P, UL, LI } from "./LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="Learn how Palava Hub collects, uses, and protects your personal information."
    >
      <P>
        Palava Hub ("we", "our", "us") respects your privacy. This policy explains how we collect,
        use, and protect your information when you use our mobile and web services.
      </P>

      <H2>1. User Accounts</H2>
      <P>When you create an account, we collect:</P>
      <UL>
        <LI>Email address (required for account creation and login)</LI>
        <LI>Display name and username you choose</LI>
        <LI>School affiliation (to connect you with your campus community)</LI>
        <LI>Profile photo (optional — stored in Firebase Storage)</LI>
      </UL>
      <P>
        Your account data is stored in Firebase Authentication and Firestore under your unique user
        ID. You control your profile and can update or delete it at any time.
      </P>

      <H2>2. User Content</H2>
      <P>
        Content you post — including text posts, comments, likes, and reposts — is stored in
        Firebase Firestore. Posts are visible to other signed-in users unless you delete them.
        Deleted posts are removed from Firestore immediately.
      </P>

      <H2>3. Photos and Videos</H2>
      <P>
        Images and videos you upload are stored in Firebase Storage under your user ID
        (<code>posts/&#123;userId&#125;/</code>). We compress images before upload (max 1 600 px,
        JPEG quality 75 %) to reduce bandwidth. Media files are publicly readable once posted but
        only you can overwrite or delete your own files.
      </P>

      <H2>4. Messaging</H2>
      <P>
        Direct messages are stored in Firestore under <code>conversations/&#123;convId&#125;/messages</code>.
        Only the two participants in a conversation can read those messages — Firestore security rules
        enforce this. We do not read your private messages.
      </P>

      <H2>5. Notifications</H2>
      <P>
        If you grant notification permission, your Expo push token is stored on your Firestore
        profile. It is used only to deliver notifications (likes, comments, follows, messages) from
        other users. You can opt out of each notification type individually in Settings → Notifications,
        and we will stop sending that category. Deleting your account removes your push token.
      </P>

      <H2>6. Firebase Storage &amp; Infrastructure</H2>
      <P>
        Palava Hub runs on Google Firebase (Authentication, Firestore, Storage) and Firebase Hosting.
        Data is stored in Google Cloud data centers. Firebase's own privacy practices apply — see
        <a
          href="https://firebase.google.com/support/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-palava-red hover:underline ml-1"
        >
          firebase.google.com/support/privacy
        </a>.
      </P>

      <H2>7. Data Retention</H2>
      <P>
        We retain your data for as long as your account is active. If you delete your account, your
        profile, posts, comments, messages, and push token are permanently deleted from Firestore
        and Firebase Auth within seconds. Some anonymised crash logs and abuse-prevention records
        may be retained for up to 90 days as required by law.
      </P>

      <H2>8. Account Deletion</H2>
      <P>
        You can permanently delete your account at any time from <strong>Settings → Account → Delete
        my account</strong>. This removes your Firebase Auth account and all linked Firestore data
        (posts, ads, support requests, verification requests, profile). See our{" "}
        <a href="/account-deletion" className="text-palava-red hover:underline">Account Deletion page</a>{" "}
        for full details.
      </P>

      <H2>9. Children's Privacy</H2>
      <P>
        Palava Hub is not directed at children under 13. If we learn we have collected data from a
        child under 13 without verifiable parental consent, we will delete it promptly.
      </P>

      <H2>10. Contact</H2>
      <P>
        Questions about this policy? Email us at{" "}
        <a href="mailto:support@palavahub.com" className="text-palava-red hover:underline">
          support@palavahub.com
        </a>
        .
      </P>
    </LegalLayout>
  );
}
