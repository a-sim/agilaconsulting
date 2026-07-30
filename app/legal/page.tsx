import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "../content";

export const metadata: Metadata = {
  title: "Legal notice and privacy",
  description:
    "Legal information and privacy notice for Agila Consulting S.à r.l.",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <>
      <a className="skip-link" href="#legal-content">
        Skip to main content
      </a>
      <header className="legal-header">
        <Link href="/" aria-label="Back to Agila home">
          <Image
            className="wordmark"
            src="/agila-wordmark-black.svg"
            alt="AGILA"
            width={613}
            height={260}
            priority
          />
        </Link>
        <Link className="text-link" href="/">
          Back to Agila <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <main className="legal-page section-shell" id="legal-content">
        <div className="legal-title">
          <p className="eyebrow">Company information</p>
          <h1>Legal notice & privacy.</h1>
          <p>Last updated: 30 July 2026</p>
        </div>

        <div className="legal-grid">
          <aside>
            <nav aria-label="Legal page sections">
              <a href="#publisher">Publisher</a>
              <a href="#content">Website content</a>
              <a href="#privacy">Privacy</a>
              <a href="#rights">Your rights</a>
              <a href="#external-links">External links</a>
            </nav>
          </aside>
          <article className="legal-copy">
            <section id="publisher">
              <p className="legal-section-number">01</p>
              <h2>Publisher and legal identification</h2>
              <p>
                This website is published by Agila Consulting S.à r.l., a
                Luxembourg private limited liability company operating as
                Agila.
              </p>
              <dl>
                <div>
                  <dt>Registered office</dt>
                  <dd>8, rue de Charlemagne, L-1328 Luxembourg</dd>
                </div>
                <div>
                  <dt>RCS Luxembourg</dt>
                  <dd>B295954</dd>
                </div>
                <div>
                  <dt>VAT number</dt>
                  <dd>LU36614487</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>
                    <a href={`mailto:${site.email}`}>{site.email}</a>
                  </dd>
                </div>
              </dl>
            </section>

            <section id="content">
              <p className="legal-section-number">02</p>
              <h2>Website content and intellectual property</h2>
              <p>
                The content of this website is provided for general information
                about Agila&apos;s work. It does not constitute legal, financial,
                tax or other regulated professional advice, and it does not
                create a client relationship or a binding offer.
              </p>
              <p>
                Unless stated otherwise, the website, its text, visual identity
                and original materials are owned by Agila Consulting S.à r.l.
                They may not be reproduced or used commercially without prior
                written permission.
              </p>
            </section>

            <section id="privacy">
              <p className="legal-section-number">03</p>
              <h2>Privacy and technical data</h2>
              <p>
                Agila Consulting S.à r.l. is the controller for personal data
                you choose to send directly by email. We use that information
                to respond to your enquiry, manage a potential or existing
                professional relationship and meet applicable legal obligations.
                The relevant legal basis will normally be steps requested before
                a contract, performance of a contract, a legal obligation or
                Agila&apos;s legitimate interest in professional correspondence.
              </p>
              <p>
                This website does not use advertising trackers, analytics
                cookies, account registration or a contact form. The hosting and
                security infrastructure may process limited technical request
                data, such as IP address, time, requested resource and browser
                information, to deliver and protect the website. Microsoft Azure
                acts as a technical service provider for website hosting and
                security delivery. Email is processed through Microsoft 365.
              </p>
              <p>
                Correspondence is retained only for as long as reasonably
                required for the enquiry, relationship, evidence or legal
                obligation concerned. We do not sell personal data.
              </p>
            </section>

            <section id="rights">
              <p className="legal-section-number">04</p>
              <h2>Your data protection rights</h2>
              <p>
                Subject to applicable law, you may request access, correction,
                deletion, restriction, portability or objection in relation to
                your personal data. You may also withdraw consent where consent
                is the legal basis.
              </p>
              <p>
                Send privacy requests to <a href={`mailto:${site.email}`}>{site.email}</a>.
                You also have the right to lodge a complaint with Luxembourg&apos;s
                data protection authority, the Commission nationale pour la
                protection des données (CNPD).
              </p>
              <a
                className="arrow-link"
                href="https://cnpd.public.lu/"
                target="_blank"
                rel="noreferrer"
              >
                <span>Visit the CNPD website</span>
                <span aria-hidden="true">↗</span>
              </a>
            </section>

            <section id="external-links">
              <p className="legal-section-number">05</p>
              <h2>External links and updates</h2>
              <p>
                External websites are governed by their own terms and privacy
                practices. Agila may update this notice when the website,
                providers or applicable requirements change. The date above
                identifies the current version.
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
