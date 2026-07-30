import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found section-shell">
      <p className="eyebrow">404 / Page not found</p>
      <h1>This route does not lead anywhere yet.</h1>
      <p>
        Return to Agila&apos;s main site to explore the practice, capabilities and
        approach.
      </p>
      <Link className="button button-dark" href="/">
        Return to Agila <span aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}
