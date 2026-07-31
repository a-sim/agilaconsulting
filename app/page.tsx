import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "./components/contact-form";
import { MobileMenu } from "./components/mobile-menu";
import {
  capabilities,
  experience,
  method,
  navigation,
  site,
} from "./content";

const contactHref = "#contact";

const organisationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Agila",
  legalName: "Agila Consulting S.à r.l.",
  alternateName: "Agila Consulting",
  url: site.canonicalUrl,
  email: site.email,
  founder: {
    "@type": "Person",
    name: "Alejandro Simó",
    jobTitle: "Founder & Principal Architect",
    sameAs: [site.linkedin],
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "8, rue de Charlemagne",
    postalCode: "L-1328",
    addressLocality: "Luxembourg",
    addressCountry: "LU",
  },
  areaServed: ["Luxembourg", "Europe", "International"],
  slogan: "AI-central, architecture-led transformation",
};

function Wordmark({ reversed = false }: { reversed?: boolean }) {
  return (
    <Image
      className="wordmark"
      src={reversed ? "/agila-wordmark-white.svg" : "/agila-wordmark-black.svg"}
      alt="AGILA"
      width={613}
      height={260}
      priority={!reversed}
    />
  );
}

function ArrowLink({
  href,
  children,
  className = "",
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const props = external ? { target: "_blank", rel: "noreferrer" } : {};
  return (
    <a className={`arrow-link ${className}`} href={href} {...props}>
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <a className="brand-link" href="#top" aria-label="Agila home">
          <Wordmark />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="header-contact" href={contactHref}>
          Discuss a challenge
          <span aria-hidden="true">↓</span>
        </a>
        <MobileMenu items={navigation} />
      </header>

      <main id="main-content">
        <section className="hero section-shell" id="top">
          <div className="hero-heading">
            <h1>From AI ambition to working systems.</h1>
          </div>
          <div className="hero-support">
            <p className="hero-intro">
              Agila is an independent transformation practice helping
              organisations connect business needs, data, technology and
              operations so that AI and digital change can be implemented with
              control.
            </p>
            <div className="hero-actions">
              <a
                className="button button-dark"
                href={contactHref}
              >
                Discuss a challenge
                <span aria-hidden="true">↓</span>
              </a>
              <a className="text-link" href="#capabilities">
                Explore capabilities
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="hero-principle">
            <span>Agila principle</span>
            <p>
              Architecture makes AI executable. AI expands what architecture
              can deliver.
            </p>
          </div>
        </section>

        <section className="thesis section-shell section-rule">
          <div className="section-index">01 / Perspective</div>
          <div className="thesis-copy">
            <h2>AI value depends on the system around it.</h2>
            <p>
              Most organisations do not lack AI ideas. They lack the connected
              operating foundations needed to act on them. Agila brings
              business priorities, processes, data, systems, governance and
              specialist capacity together so leaders can choose the right use
              cases, make better decisions and move with control.
            </p>
          </div>
        </section>

        <section
          className="capabilities section-shell section-rule"
          id="capabilities"
        >
          <div className="section-heading section-heading-compact">
            <div className="section-index">02 / Capabilities</div>
            <h2>Capabilities</h2>
          </div>
          <div className="capability-grid">
            {capabilities.map((capability, index) => (
              <article
                className={`capability-card ${index === 0 ? "capability-primary" : ""}`}
                key={capability.number}
              >
                <div className="card-number">{capability.number}</div>
                <h3>{capability.title}</h3>
                <p>{capability.text}</p>
                <ul>
                  {capability.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="approach section-shell section-rule" id="approach">
          <div className="section-heading">
            <div className="section-index">03 / Approach</div>
            <div>
              <h2>A practical path from assessment to implementation.</h2>
              <p className="section-note">
                The emphasis and sequence adapt to the service and the maturity
                of each engagement.
              </p>
            </div>
          </div>
          <ol className="method-list">
            {method.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="experience section-shell section-rule"
          id="experience"
        >
          <div className="section-heading section-heading-compact">
            <div className="section-index">04 / Experience</div>
            <h2>Selected experience</h2>
          </div>
          <div className="case-grid">
            {experience.map((item, index) => (
              <article className="case-card" key={item.context}>
                <div className="case-topline">
                  <span>0{index + 1}</span>
                  <span>{item.context}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <p className="confidentiality-note">
            Client identities and confidential details are not published.
          </p>
        </section>

        <section className="fit4ai section-shell section-rule">
          <div className="section-heading section-heading-compact">
            <div className="section-index">05 / Fit 4 AI</div>
            <h2>Fit 4 AI</h2>
          </div>
          <div className="fit4ai-panel">
            <p>
              Agila is pre-accredited by Luxinnovation for the Fit 4 AI
              programme, which helps eligible organisations assess AI
              opportunities and define an implementation roadmap.
            </p>
            <ArrowLink href={site.fit4AiUrl} external>
              View the official Fit 4 AI programme
            </ArrowLink>
          </div>
        </section>

        <section className="about section-shell section-rule" id="about">
          <div className="section-heading section-heading-compact">
            <div className="section-index">06 / About Agila</div>
            <h2>About Agila</h2>
          </div>
          <div className="about-content">
            <div className="founder-copy">
              <p className="founder-role">Founder &amp; Principal Architect</p>
              <h3>Alejandro Simó</h3>
              <p>
                Alejandro is a solution and enterprise architect with
                experience across manufacturing, industrial IT/OT, digital
                manufacturing, aviation, utilities, applied research, data and
                governed AI systems. He works with specialised businesses,
                SMEs and large organisations from Luxembourg.
              </p>
              <ArrowLink href={site.linkedin} external>
                View Alejandro&apos;s LinkedIn profile
              </ArrowLink>
            </div>
          </div>
        </section>

        <section
          className="contact-section"
          id="contact"
          aria-labelledby="contact-heading"
        >
          <div className="section-shell contact-inner">
            <div className="contact-main">
              <p className="section-index">07 / Contact</p>
              <h2 id="contact-heading" tabIndex={-1}>
                Bring the challenge into focus.
              </h2>
              <p>
                Tell Agila what you are trying to change and where progress is
                getting stuck. Alejandro will review your enquiry and respond
                directly.
              </p>
            </div>
            <ContactForm email={site.email} />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-shell footer-inner">
          <a className="footer-brand" href="#top" aria-label="Agila home">
            <Wordmark reversed />
          </a>
          <div className="footer-contact">
            <span>Contact</span>
            <span>{site.email}</span>
          </div>
          <div className="footer-legal">
            <p>© {new Date().getFullYear()} Agila. All rights reserved.</p>
            <Link href="/legal">Legal notice &amp; privacy</Link>
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }}
      />
    </>
  );
}
