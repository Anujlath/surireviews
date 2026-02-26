export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective Date: 02/25/2026</p>
      <p className="text-sm text-muted-foreground">Last Updated: 02/25/2026</p>
      <p className="mt-4 text-muted-foreground">
        Welcome to SuriReviews (&quot;we,&quot; &quot;our,&quot; &quot;us&quot;). We respect your privacy and are committed to
        protecting your personal data in accordance with the Nigeria Data Protection Act (NDPA) 2023 and
        other applicable laws.
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p className="font-medium">A. Information You Provide</p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number (optional)</li>
          <li>Business details (for business accounts)</li>
          <li>Reviews, ratings, and comments</li>
          <li>Profile photo</li>
        </ul>
        <p className="font-medium">B. Automatically Collected Information</p>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Cookies and usage data</li>
          <li>Location data (if enabled)</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Create and manage accounts</li>
          <li>Publish and display reviews</li>
          <li>Improve platform performance</li>
          <li>Prevent fraud and fake reviews</li>
          <li>Communicate updates</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">3. Legal Basis for Processing</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>User consent</li>
          <li>Contractual necessity</li>
          <li>Legal compliance</li>
          <li>Legitimate business interest</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">4. Data Sharing</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Service providers (hosting, analytics, email systems)</li>
          <li>Law enforcement (if legally required)</li>
          <li>Business owners when responding to reviews</li>
        </ul>
        <p className="text-muted-foreground">We do not sell personal data.</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">5. Data Retention</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>As long as your account is active</li>
          <li>As required by Nigerian law</li>
          <li>For dispute resolution or fraud prevention</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">6. Your Rights (Under NDPA 2023)</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Access your data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion</li>
          <li>Withdraw consent</li>
          <li>Object to processing</li>
          <li>File a complaint with Nigeria Data Protection Commission (NDPC)</li>
        </ul>
        <p className="text-muted-foreground">To exercise your rights, contact: support@SuriReviews.com</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">7. Data Security</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>SSL encryption</li>
          <li>Secure hosting</li>
          <li>Access controls</li>
          <li>Periodic security reviews</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">8. Children&apos;s Privacy</h2>
        <p className="text-muted-foreground">SuriReviews is not intended for users under 18.</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
        <p className="text-muted-foreground">
          We may update this policy from time to time. Any changes will be posted with revised dates.
        </p>
      </section>

      <section className="mt-8 space-y-1">
        <h2 className="text-xl font-semibold">10. Contact</h2>
        <p className="text-muted-foreground">SuriReviews</p>
        <p className="text-muted-foreground">Email: support@SuriReviews.com</p>
        <p className="text-muted-foreground">Address: Nigeria</p>
      </section>
    </div>
  );
}
