export const dynamic = 'force-dynamic';

export default function CookiesPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Cookie Policy</h1>
      <p className="mt-4 text-muted-foreground">
        SuriReviews uses cookies to improve user experience and platform performance.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">What Are Cookies?</h2>
        <p className="text-muted-foreground">
          Cookies are small text files stored on your device by your browser.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Types of Cookies We Use</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Essential Cookies: Required for login and security</li>
          <li>Performance Cookies: Analytics and site performance</li>
          <li>Functional Cookies: Preferences and saved settings</li>
          <li>Advertising Cookies: Used for ads where applicable</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Managing Cookies</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Disable cookies via your browser settings</li>
          <li>Use our cookie preferences pop-up (when available)</li>
          <li>Opt out of analytics cookies</li>
        </ul>
        <p className="text-muted-foreground">Disabling cookies may affect site functionality.</p>
      </section>
    </div>
  );
}
