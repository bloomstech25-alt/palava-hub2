import { LegalLayout, H2, P, UL, LI } from "./LegalLayout";

export default function CommunityGuidelines() {
  return (
    <LegalLayout
      title="Community Guidelines"
      description="Palava Hub community rules — how to keep our space safe, respectful, and welcoming for all Liberian students."
    >
      <P>
        Palava Hub is built for Liberian students. To keep our community safe and welcoming, every
        member must follow these guidelines. Violations may result in content removal, account
        suspension, or a permanent ban.
      </P>

      <H2>1. Respectful Behaviour</H2>
      <P>Treat every person on Palava Hub the way you would want to be treated.</P>
      <UL>
        <LI>No bullying, personal attacks, or public shaming</LI>
        <LI>No harassment — repeated unwanted contact or messages</LI>
        <LI>Disagree respectfully; debate ideas, not people</LI>
        <LI>Be mindful of cultural differences and sensitivities</LI>
      </UL>

      <H2>2. No Hate Speech</H2>
      <P>
        Content that dehumanises people based on protected characteristics is not allowed. This
        includes:
      </P>
      <UL>
        <LI>Ethnic, tribal, or racial slurs or stereotypes</LI>
        <LI>Hate speech targeting religion, gender, sexual orientation, or disability</LI>
        <LI>Symbols or imagery associated with hate groups</LI>
        <LI>Calls for discrimination against any group</LI>
      </UL>

      <H2>3. No Harassment</H2>
      <UL>
        <LI>Do not target individuals with repeated unwanted messages or mentions</LI>
        <LI>Do not share someone's personal information without their consent (doxxing)</LI>
        <LI>Do not coordinate pile-ons or mass-reporting campaigns</LI>
        <LI>Do not threaten or intimidate other users</LI>
      </UL>

      <H2>4. No Illegal Content</H2>
      <UL>
        <LI>No child sexual abuse material (CSAM) — zero tolerance; immediately reported to authorities</LI>
        <LI>No content promoting or facilitating illegal activity</LI>
        <LI>No drug sales, weapons sales, or other illicit commerce</LI>
        <LI>No copyright-infringing material posted without permission</LI>
      </UL>

      <H2>5. No Spam</H2>
      <UL>
        <LI>No repetitive or unsolicited promotional messages</LI>
        <LI>No fake accounts or coordinated inauthentic behaviour</LI>
        <LI>No bots, scrapers, or automation that disrupts the platform</LI>
        <LI>No misleading links or phishing attempts</LI>
        <LI>Use the official Promote/Ads feature for commercial content</LI>
      </UL>

      <H2>6. Content Moderation Policy</H2>
      <P>
        Our admin team reviews reported content and takes one or more of the following actions:
      </P>
      <UL>
        <LI><strong>Warning</strong> — first-time minor violations</LI>
        <LI><strong>Content removal</strong> — posts or comments that break these guidelines</LI>
        <LI><strong>Temporary suspension</strong> — repeated or serious violations</LI>
        <LI><strong>Permanent ban</strong> — severe violations (CSAM, threats of violence, etc.)</LI>
      </UL>
      <P>
        You can appeal a moderation decision by emailing{" "}
        <a href="mailto:support@palavahub.com" className="text-palava-red hover:underline">
          support@palavahub.com
        </a>{" "}
        within 30 days. We will review and respond within 5 business days.
      </P>

      <H2>7. Reporting Violations</H2>
      <P>
        Use the <strong>Report</strong> button on any post, comment, or profile to flag content. You
        can also submit a detailed report via our{" "}
        <a href="/support" className="text-palava-red hover:underline">Support page</a>. False or
        abusive reporting is itself a violation.
      </P>

      <H2>8. Palava Room (Anonymous Posts)</H2>
      <P>
        Anonymity is a privilege. Posts in the Palava Room are anonymous to other users but
        internally linked to your account for safety. Abuse of anonymity — including harassment,
        spreading false information, or bullying — will result in account suspension.
      </P>

      <H2>9. Keep It Liberian</H2>
      <P>
        Palava Hub is for Liberian students. Engage with your school community, lift others up, and
        help make this a platform we can all be proud of.
      </P>
    </LegalLayout>
  );
}
