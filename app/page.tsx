import Image from "next/image";
import Link from "next/link";
import {
  deliveryLayers,
  engagementSignals,
  experience,
  method,
  navigation,
  pillars,
  site,
} from "./content";

const contactHref = `mailto:${site.email}?subject=${encodeURIComponent(
  "Transformation challenge for Agila",
)}`;

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

function ArchitectureMap() {
  return (
    <figure
      className="architecture-map"
      aria-label="Agila connects AI, architecture and operating reality through accountable governance."
    >
      <div className="map-meta">
        <span>Transformation architecture</span>
        <span>System 01</span>
      </div>
      <div className="map-canvas" aria-hidden="true">
        <div className="map-node map-node-ai">
          <span>Primary value focus</span>
          <strong>AI + agentic systems</strong>
        </div>
        <div className="map-node map-node-architecture">
          <span>Professional spine</span>
          <strong>Architecture</strong>
        </div>
        <div className="map-node map-node-operations">
          <span>Field authority</span>
          <strong>Industrial operations</strong>
        </div>
        <div className="map-node map-node-data">
          <span>Foundation</span>
          <strong>Data + integration</strong>
        </div>
        <div className="map-node map-node-governance">
          <span>Control layer</span>
          <strong>Human governance</strong>
        </div>
        <span className="map-line line-one" />
        <span className="map-line line-two" />
        <span className="map-line line-three" />
        <span className="map-line line-four" />
        <span className="map-pulse pulse-one" />
        <span className="map-pulse pulse-two" />
      </div>
      <figcaption>
        Business priorities, processes, data, systems and controls designed as
        one executable change system.
      </figcaption>
    </figure>
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
          <span aria-hidden="true">↗</span>
        </a>
        <details className="mobile-menu">
          <summary aria-label="Open navigation">
            <span />
            <span />
          </summary>
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href={contactHref}>Discuss a challenge</a>
          </nav>
        </details>
      </header>

      <main id="main-content">
        <section className="hero section-shell" id="top">
          <div className="hero-copy">
            <p className="eyebrow">AI-central, architecture-led transformation</p>
            <h1>
              From AI ambition to governed systems and executable change.
            </h1>
            <p className="hero-intro">
              Agila is an independent architecture and transformation practice
              helping organisations turn complex operations, fragmented data
              and AI ambition into governed systems and executable change.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href={contactHref}>
                Discuss a transformation challenge
                <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="#capabilities">
                Explore capabilities
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <ArchitectureMap />
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
            <p className="eyebrow">The operating challenge</p>
            <h2>AI value depends on the system around it.</h2>
            <p>
              Most organisations do not lack AI ideas. They lack the connected
              operating foundations needed to act on them. Agila brings
              business priorities, processes, data, systems, governance and
              specialist capacity into one accountable transformation
              architecture, so leaders can choose the right use cases, make
              better decisions and move with control.
            </p>
          </div>
        </section>

        <section
          className="capabilities section-shell section-rule"
          id="capabilities"
        >
          <div className="section-heading">
            <div className="section-index">02 / Capabilities</div>
            <div>
              <p className="eyebrow">The integrated capability system</p>
              <h2>One architecture across AI, enterprise systems and operations.</h2>
            </div>
          </div>
          <div className="pillar-grid">
            {pillars.map((pillar, index) => (
              <article
                className={`pillar-card ${index === 0 ? "pillar-primary" : ""}`}
                key={pillar.number}
              >
                <div className="card-number">{pillar.number}</div>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
                <ul>
                  {pillar.capabilities.map((capability) => (
                    <li key={capability}>{capability}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="capability-support">
            <p>Supporting disciplines</p>
            <div>
              <span>Transformation design</span>
              <span>Governance and assurance</span>
              <span>Digital products and analytics</span>
              <span>Training and adoption</span>
            </div>
          </div>
        </section>

        <section className="approach section-shell section-rule" id="approach">
          <div className="section-heading">
            <div className="section-index">03 / Approach</div>
            <div>
              <p className="eyebrow">From decision to adoption</p>
              <h2>Start with the operating decision, not the technology.</h2>
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

        <section className="delivery-section">
          <div className="section-shell delivery-inner">
            <div className="section-heading section-heading-light">
              <div className="section-index">04 / Delivery system</div>
              <div>
                <p className="eyebrow">Accountability that scales</p>
                <h2>Principal-led. Partner-enabled. Agent-augmented.</h2>
              </div>
            </div>
            <div className="delivery-grid">
              {deliveryLayers.map((layer, index) => (
                <article key={layer.title}>
                  <span>0{index + 1}</span>
                  <h3>{layer.title}</h3>
                  <p>{layer.text}</p>
                </article>
              ))}
            </div>
            <p className="authority-note">
              Client judgment, material commitments and consequential external
              actions remain human-controlled.
            </p>
          </div>
        </section>

        <section
          className="experience section-shell section-rule"
          id="experience"
        >
          <div className="section-heading">
            <div className="section-index">05 / Experience</div>
            <div>
              <p className="eyebrow">Selected, evidence-safe work</p>
              <h2>Experience where systems meet operating reality.</h2>
            </div>
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
            Client identities, detailed architectures and outcome metrics are
            withheld unless publication rights have been recorded.
          </p>
        </section>

        <section className="fit4ai section-shell section-rule">
          <div className="fit4ai-label">
            <p className="eyebrow">Luxembourg ecosystem</p>
            <span>Fit 4 AI</span>
          </div>
          <div className="fit4ai-copy">
            <h2>A structured route from AI opportunity to roadmap.</h2>
            <p>
              Agila, through Agila Consulting S.à r.l., is pre-accredited by
              Luxinnovation for the Fit 4 AI programme. Full accreditation
              follows the first successful assignment and review. The programme
              is one structured route for eligible organisations to assess AI
              and data opportunities, risks, costs and foundations and define a
              detailed implementation roadmap.
            </p>
            <ArrowLink href={site.fit4AiUrl} external>
              View the official Fit 4 AI programme
            </ArrowLink>
          </div>
        </section>

        <section className="about section-shell section-rule" id="about">
          <div className="about-intro">
            <div className="section-index">06 / About Agila</div>
            <p className="about-statement">
              Architecture leadership,
              <br /> close to the decision.
            </p>
          </div>
          <div className="about-content">
            <div className="founder-mark" aria-label="More than eight years of architecture experience">
              8+
            </div>
            <div className="founder-copy">
              <p className="eyebrow">Alejandro Simó / Founder & Principal Architect</p>
              <h2>One accountable lead across the full transformation context.</h2>
              <p>
                Agila is led by Alejandro Simó, a solution and enterprise
                architect with more than eight years of experience across
                manufacturing and enterprise transformation. His work spans
                industrial IT/OT, digital manufacturing, aviation, utilities,
                applied research, data architecture and governed AI systems.
                Based in Luxembourg, he works with specialised businesses, SMEs
                and large organisations internationally.
              </p>
              <ArrowLink href={site.linkedin} external>
                View Alejandro&apos;s LinkedIn profile
              </ArrowLink>
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="section-shell contact-inner">
            <div className="contact-main">
              <p className="eyebrow">Start with the decision</p>
              <h2>Bring the difficult challenge into focus.</h2>
              <p>
                If AI ambition, fragmented data or complex systems are blocking
                a material transformation, start with the decision that must be
                made. Agila will help frame the operating reality, architecture
                choices and responsible next step.
              </p>
              <a className="button button-light" href={contactHref}>
                Contact Alejandro
                <span aria-hidden="true">↗</span>
              </a>
            </div>
            <aside className="contact-fit" aria-label="Good engagement signals">
              <span>A useful starting point</span>
              <ul>
                {engagementSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-shell footer-inner">
          <a className="footer-brand" href="#top" aria-label="Agila home">
            <Wordmark reversed />
          </a>
          <div className="footer-contact">
            <span>Luxembourg / International</span>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
          <div className="footer-legal">
            <p>Agila is the public brand of Agila Consulting S.à r.l.</p>
            <p>© {new Date().getFullYear()} Agila. All rights reserved.</p>
            <Link href="/legal">Legal notice & privacy</Link>
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
