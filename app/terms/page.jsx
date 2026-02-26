export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective Date: 02/25/2026</p>
      <p className="mt-4 text-muted-foreground">
        These terms apply to platform users, especially businesses claiming profiles or purchasing services
        on SuriReviews.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">1. Business Account Responsibilities</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Business information must be accurate and up to date</li>
          <li>You may not post fake reviews</li>
          <li>You may not manipulate ratings</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">2. Paid Services (If Applicable)</h2>
        <p className="text-muted-foreground">
          Paid features may include sponsored listings, featured placement, or advertising.
        </p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Fees are non-refundable unless explicitly stated otherwise</li>
          <li>Payment is due before activation</li>
          <li>Subscriptions may renew automatically where applicable</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">3. Prohibited Conduct</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Offering incentives for reviews</li>
          <li>Posting reviews about competitors to influence ratings</li>
          <li>Threatening users over negative reviews</li>
          <li>Coordinating mass rating campaigns</li>
          <li>Using agencies or bots to manipulate ratings</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">4. Review Removal Policy</h2>
        <p className="text-muted-foreground">We remove reviews only when they violate policy or law, including:</p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Violations of content guidelines</li>
          <li>Hate speech</li>
          <li>Fraudulent content</li>
          <li>A valid court order</li>
        </ul>
        <p className="text-muted-foreground">
          We do not remove reviews simply because they are negative or unfavorable.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>User opinions posted in reviews</li>
          <li>Business losses resulting from reviews</li>
          <li>Indirect, incidental, or consequential damages</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">6. Termination</h2>
        <p className="text-muted-foreground">
          We may suspend or terminate accounts that violate these terms, our policies, or applicable laws.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Community Guidelines</h2>
        <p className="text-muted-foreground">To maintain trust, all users must follow these rules.</p>
        <p className="font-medium">Allowed</p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Honest experiences</li>
          <li>Factual descriptions</li>
          <li>Respectful criticism</li>
        </ul>
        <p className="font-medium">Not Allowed</p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Hate speech</li>
          <li>Defamation</li>
          <li>False accusations</li>
          <li>Spam</li>
          <li>Fake reviews</li>
          <li>Personal attacks</li>
          <li>Publishing private information (doxxing)</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Anti-Fake Review Policy</h2>
        <p className="text-muted-foreground">
          SuriReviews maintains a zero-tolerance policy for fake, manipulated, or misleading reviews.
        </p>
        <p className="font-medium">A fake review includes:</p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Reviews without genuine experience</li>
          <li>Undisclosed paid or incentivized reviews</li>
          <li>Employee or competitor manipulation</li>
          <li>Review swapping and bot-generated reviews</li>
          <li>Multiple reviews intended to manipulate ratings</li>
        </ul>
        <p className="font-medium">Enforcement may include:</p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Immediate content removal</li>
          <li>Account suspension or permanent ban</li>
          <li>Warning notices and other platform enforcement actions</li>
          <li>Legal action where necessary</li>
        </ul>
        <p className="text-muted-foreground">
          We may use automated fraud detection, IP/device checks, behavioral analysis, manual moderation,
          and community reporting to detect abuse.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Trademark &amp; Intellectual Property</h2>
        <p className="text-muted-foreground">
          &quot;SuriReviews&quot; is a registered trademark (or pending registration). Logos, branding, designs,
          platform layout, and software are protected under applicable intellectual property laws.
          Unauthorized use, copying, or imitation is prohibited.
        </p>
        <p className="text-muted-foreground">Trademark inquiries: support@SuriReviews.com</p>
      </section>
    </div>
  );
}
