import { LegalLayout, H2, P, UL, LI } from "./LegalLayout";

export default function AccountDeletion() {
  return (
    <LegalLayout
      title="Account Deletion"
      description="How to permanently delete your Palava Hub account and what data is removed."
    >
      <P>
        You have the right to delete your Palava Hub account at any time. Deletion is permanent and
        cannot be undone.
      </P>

      <H2>How to Delete Your Account</H2>
      <P>Account deletion is done directly inside the mobile app:</P>
      <UL>
        <LI>Open the <strong>Palava Hub</strong> mobile app</LI>
        <LI>Tap <strong>Settings</strong> (bottom navigation or profile menu)</LI>
        <LI>Scroll to the <strong>Account</strong> section</LI>
        <LI>Tap <strong>Delete my account</strong></LI>
        <LI>Confirm by tapping <strong>Delete</strong> in the confirmation dialog</LI>
      </UL>
      <P>
        The deletion process begins immediately after you confirm. There is no waiting period.
      </P>

      <H2>What Gets Removed</H2>
      <P>
        When you delete your account, the following data is permanently and irreversibly removed:
      </P>
      <UL>
        <LI>Your Firebase Authentication account and login credentials</LI>
        <LI>Your public profile (name, username, bio, avatar, school)</LI>
        <LI>All posts, comments, and likes you created</LI>
        <LI>All direct messages you sent or received</LI>
        <LI>Any ads or Pages you created</LI>
        <LI>Support requests submitted under your account</LI>
        <LI>Verification requests</LI>
        <LI>Your push notification token</LI>
        <LI>Profile photos and media stored in Firebase Storage</LI>
      </UL>

      <H2>What May Be Retained</H2>
      <P>
        A small amount of anonymised data may be retained for up to 90 days for fraud prevention
        and legal compliance, as required by applicable law. This data cannot be linked back to your
        identity.
      </P>
      <P>
        Anonymous posts you created in the <strong>Palava Room</strong> are stored without any
        author identifier and therefore cannot be attributed to or deleted by individual accounts.
      </P>

      <H2>Can't Access Your Account?</H2>
      <P>
        If you cannot log in to delete your account yourself, contact us at{" "}
        <a href="mailto:support@palavahub.com" className="text-palava-red hover:underline">
          support@palavahub.com
        </a>{" "}
        with your registered email address and we will manually delete your account within 5
        business days.
      </P>

      <H2>Contact</H2>
      <P>
        For any questions about the deletion process, email{" "}
        <a href="mailto:support@palavahub.com" className="text-palava-red hover:underline">
          support@palavahub.com
        </a>{" "}
        or use our{" "}
        <a href="/support" className="text-palava-red hover:underline">
          Support page
        </a>
        .
      </P>
    </LegalLayout>
  );
}
