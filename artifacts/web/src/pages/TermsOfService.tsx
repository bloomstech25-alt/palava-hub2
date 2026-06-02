import { LegalLayout, H2, P, UL, LI } from "./LegalLayout";

export default function TermsOfService() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="Read the terms and conditions for using Palava Hub, the social network for Liberian students."
    >
      <P>
        By creating an account or using Palava Hub, you agree to these Terms of Service. Please read
        them carefully.
      </P>

      <H2>1. Who Can Use Palava Hub</H2>
      <UL>
        <LI>You must be at least 13 years old to use Palava Hub.</LI>
        <LI>You must provide accurate information when creating your account.</LI>
        <LI>You are responsible for maintaining the security of your account credentials.</LI>
        <LI>One person may not maintain more than one active account.</LI>
      </UL>

      <H2>2. Your Content</H2>
      <P>
        You retain ownership of content you post on Palava Hub. By posting, you grant Palava Hub a
        non-exclusive, royalty-free, worldwide licence to store, display, and distribute your content
        within the platform in order to operate the service. We do not sell your content to third
        parties.
      </P>
      <P>
        You are solely responsible for what you post. Content that violates our{" "}
        <a href="/community-guidelines" className="text-palava-red hover:underline">
          Community Guidelines
        </a>{" "}
        may be removed without notice.
      </P>

      <H2>3. Prohibited Conduct</H2>
      <UL>
        <LI>Impersonating another person or entity</LI>
        <LI>Posting illegal, harmful, or abusive content</LI>
        <LI>Using the platform to harass, threaten, or bully other users</LI>
        <LI>Attempting to access accounts or data that do not belong to you</LI>
        <LI>Using automated bots or scrapers on the platform</LI>
        <LI>Circumventing or attempting to circumvent security measures</LI>
      </UL>

      <H2>4. Ads &amp; Promotions</H2>
      <P>
        Palava Hub offers a free ad-posting feature for students and organisations. Ads are subject
        to admin review before publication. We reserve the right to reject any ad that violates our
        guidelines or is otherwise inappropriate.
      </P>

      <H2>5. Termination</H2>
      <P>
        We may suspend or permanently ban accounts that violate these Terms or our Community
        Guidelines. You may delete your account at any time from Settings. Upon deletion all your
        data is removed as described in our{" "}
        <a href="/privacy-policy" className="text-palava-red hover:underline">Privacy Policy</a>.
      </P>

      <H2>6. Disclaimer of Warranties</H2>
      <P>
        Palava Hub is provided "as is" without warranties of any kind. We do not guarantee that the
        service will be uninterrupted, error-free, or free from viruses or other harmful components.
      </P>

      <H2>7. Limitation of Liability</H2>
      <P>
        To the fullest extent permitted by applicable law, Palava Hub and its operators shall not be
        liable for any indirect, incidental, special, consequential, or punitive damages arising from
        your use of the platform.
      </P>

      <H2>8. Changes to These Terms</H2>
      <P>
        We may update these Terms from time to time. Material changes will be communicated in-app.
        Continued use of Palava Hub after changes constitutes acceptance of the updated Terms.
      </P>

      <H2>9. Contact</H2>
      <P>
        Questions about these Terms? Email us at{" "}
        <a href="mailto:support@palavahub.com" className="text-palava-red hover:underline">
          support@palavahub.com
        </a>
        .
      </P>
    </LegalLayout>
  );
}
