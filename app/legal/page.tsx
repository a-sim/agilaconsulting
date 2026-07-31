import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { mailtoHref, site } from "../content";

const emailHref = mailtoHref();

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
          <p>Last updated: 31 July 2026</p>
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
                    <a href={emailHref}>{site.email}</a>
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
                you submit through the contact form or send directly by email.
                The form collects your name, email address and message, and your
                organisation if you choose to provide it. It also processes the
                submission time and limited technical or security data, such as
                a pseudonymous derivative of an IP address or, when that is not
                available from the hosting platform, the submitted email
                address, to operate and protect the form. Name, email address
                and message are required to submit an online enquiry;
                organisation is optional.
              </p>
              <p>
                Agila uses this information to respond to your enquiry,
                understand the services requested, manage a prospective or
                existing professional relationship, maintain appropriate
                business records and protect the website from misuse. Processing
                is based on steps requested before entering into or performing a
                contract where applicable, and otherwise on Agila&apos;s legitimate
                interests in professional correspondence, business
                administration and service security. Legal obligations may
                apply to particular records. Form submissions are not used for
                marketing merely because you contacted Agila, and no solely
                automated decision-making or profiling is performed.
              </p>
              <p>
                Microsoft Azure hosts the website and API, Azure Communication
                Services transmits the form content as email, and Microsoft 365
                receives and stores the resulting correspondence. These
                services act as technical service providers to Agila. Agila
                configures an EU data location where available. If personal data
                is transferred outside the European Economic Area, the transfer
                is protected by an applicable adequacy decision or contractual
                safeguards; information about those safeguards is available on
                request.
              </p>
              <p>
                This website does not use advertising trackers, analytics
                cookies or account registration. Form contents are processed to
                transmit the enquiry and are not written to a website contact
                database. Pseudonymous abuse-prevention data expires within 24
                hours and diagnostic logs are retained for up to 30 days.
                Correspondence that does not lead to an ongoing relationship is
                ordinarily retained for up to 24 months after the last meaningful
                contact, unless a shorter or longer period is required for the
                relationship, legal obligations or legal claims. Agila does not
                sell personal data.
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
                Send privacy requests to{" "}
                <a href={emailHref}>{site.email}</a>
                .
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
