import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { site } from "../content";
import styles from "./fit4ai.module.css";

export const metadata: Metadata = {
  title: "Fit 4 AI diagnostic",
  description:
    "Explore Fit 4 AI with Agila: an independent, vendor-neutral diagnostic for testing where AI adds value and defining a prioritised, costed roadmap.",
  alternates: { canonical: "/fit4ai/" },
  openGraph: {
    title: "Is AI worth it? | Fit 4 AI with Agila",
    description:
      "Test where AI adds value before committing to technology or implementation.",
    url: "/fit4ai/",
  },
  twitter: {
    title: "Is AI worth it? | Fit 4 AI with Agila",
    description:
      "Test where AI adds value before committing to technology or implementation.",
  },
};

const startingPoints = [
  "Business challenges",
  "AI and data needs",
  "Implementation ideas",
  "Candidate use cases",
];

const evidenceDimensions = [
  "Business value",
  "Technical feasibility",
  "Data readiness",
  "Risks and governance",
  "Alternatives and dependencies",
];

const managementOutputs = [
  {
    number: "01",
    title: "A prioritised opportunity portfolio",
    text: "A structured view of the AI and data use cases worth pursuing, revisiting or stopping.",
  },
  {
    number: "02",
    title: "Evidence leaders can challenge",
    text: "Documented value logic, feasibility, assumptions, risks, constraints and alternatives.",
  },
  {
    number: "03",
    title: "A readiness view",
    text: "The operating, data, architecture and governance foundations each priority depends on.",
  },
  {
    number: "04",
    title: "A detailed, costed roadmap",
    text: "Recommended next steps, sequencing, ownership, dependencies and implementation considerations.",
  },
];

export default function Fit4AiPage() {
  return (
    <>
      <a className="skip-link" href="#fit4ai-content">
        Skip to main content
      </a>
      <SiteHeader />

      <main id="fit4ai-content">
        <section className={`${styles.hero} section-shell`}>
          <div className={styles.heroMain}>
            <p className="eyebrow">Fit 4 AI / Independent diagnostic</p>
            <h1>Is AI worth it?</h1>
            <p className={styles.heroStatement}>
              An independent, vendor-neutral diagnostic to test where AI adds
              value before committing to technology or implementation.
            </p>
            <div className={styles.heroActions}>
              <Link className="button button-dark" href="/#contact">
                Explore your AI opportunity landscape
                <span aria-hidden="true">↗</span>
              </Link>
              <a
                className="text-link"
                href={site.fit4AiOfficialUrl}
                rel="noreferrer"
                target="_blank"
              >
                Official Fit 4 AI programme
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <aside className={styles.heroAside} aria-labelledby="starting-points-title">
            <p className={styles.asideLabel}>Start with what you know</p>
            <h2 id="starting-points-title">
              Bring a challenge, a need, an idea, or the whole opportunity list.
            </h2>
            <ul>
              {startingPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.portfolioNote}>
              A single assessment can examine multiple candidate use cases and
              identify the strongest priorities across the portfolio.
            </p>
          </aside>
        </section>

        <section
          className={`${styles.path} section-shell section-rule`}
          aria-labelledby="assessment-path-title"
        >
          <div className={styles.sectionHeading}>
            <p className="section-index">01 / Assessment path</p>
            <div>
              <h2 id="assessment-path-title">
                From an opportunity landscape to clear recommendations.
              </h2>
              <p>
                Fit 4 AI creates a common evidence base across business,
                operational and technical perspectives. It does not assume that
                every candidate should be implemented.
              </p>
            </div>
          </div>

          <ol className={styles.pathSteps}>
            <li>
              <span className={styles.stepNumber}>01</span>
              <div>
                <p className={styles.stepLabel}>Frame the landscape</p>
                <h3>Clarify the challenges, needs and candidate use cases.</h3>
                <p>
                  Connect each opportunity to the work, outcome, constraint or
                  risk that matters to the organisation.
                </p>
              </div>
            </li>
            <li>
              <span className={styles.stepNumber}>02</span>
              <div>
                <p className={styles.stepLabel}>Build the evidence</p>
                <h3>Examine what would make each opportunity worthwhile.</h3>
                <ul className={styles.evidenceList}>
                  {evidenceDimensions.map((dimension) => (
                    <li key={dimension}>{dimension}</li>
                  ))}
                </ul>
              </div>
            </li>
            <li>
              <span className={styles.stepNumber}>03</span>
              <div>
                <p className={styles.stepLabel}>Recommend and plan</p>
                <h3>Prioritise the portfolio and define the route forward.</h3>
                <div className={styles.decisions} aria-label="Recommendation outcomes">
                  <span>Invest</span>
                  <span>Defer</span>
                  <span>Reject</span>
                </div>
                <p>
                  The recommendations lead into a detailed, costed roadmap for
                  the opportunities that merit action.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section
          className={`${styles.outputs} section-shell section-rule`}
          aria-labelledby="management-outputs-title"
        >
          <div className={styles.sectionHeading}>
            <p className="section-index">02 / Management outputs</p>
            <div>
              <h2 id="management-outputs-title">
                Enough clarity to decide what happens next.
              </h2>
              <p>
                The outcome is a management view of the opportunity portfolio,
                supported by the operating and technical detail needed to act
                with control.
              </p>
            </div>
          </div>
          <div className={styles.outputGrid}>
            {managementOutputs.map((output) => (
              <article key={output.number}>
                <span>{output.number}</span>
                <h3>{output.title}</h3>
                <p>{output.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.difference} aria-labelledby="agila-difference-title">
          <div className="section-shell">
            <div className={styles.differenceHeading}>
              <p className="section-index">03 / Why Agila</p>
              <h2 id="agila-difference-title">
                Independent and vendor-neutral, grounded in the system around AI.
              </h2>
            </div>
            <div className={styles.differenceFormula}>
              <span>Operating reality</span>
              <span aria-hidden="true">+</span>
              <span>Data and architecture</span>
              <span aria-hidden="true">+</span>
              <span>Governed execution</span>
            </div>
            <p className={styles.differenceCopy}>
              Agila connects management priorities with processes, data,
              technology, architecture and governance. Recommendations are not
              shaped around selling a platform or implementation package.
            </p>
          </div>
        </section>

        <section
          className={`${styles.boundary} section-shell section-rule`}
          aria-labelledby="programme-boundary-title"
        >
          <div className={styles.sectionHeading}>
            <p className="section-index">04 / Scope and programme</p>
            <div>
              <h2 id="programme-boundary-title">
                Diagnose first. Make implementation a separate decision.
              </h2>
            </div>
          </div>
          <div className={styles.boundaryGrid}>
            <article>
              <p className={styles.cardLabel}>Fit 4 AI diagnostic</p>
              <h3>Evidence, recommendations and roadmap.</h3>
              <p>
                The assessment clarifies where AI may add value, what is
                feasible and what foundations or controls are required.
              </p>
            </article>
            <article>
              <p className={styles.cardLabel}>Implementation</p>
              <h3>A separate choice after the evidence is clear.</h3>
              <p>
                The organisation remains free to invest, defer or reject. Any
                later implementation is a separate scope and commitment.
              </p>
            </article>
          </div>

          <div className={styles.programmeNote}>
            <div>
              <p className={styles.cardLabel}>Public programme</p>
              <p>
                Public support may be available to eligible Luxembourg
                organisations. Eligibility and support decisions sit with the
                relevant programme authorities.
              </p>
              <a
                className="arrow-link"
                href={site.fit4AiOfficialUrl}
                rel="noreferrer"
                target="_blank"
              >
                <span>Check the current official programme information</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className={styles.statusNote}>
              <p className={styles.cardLabel}>Agila status</p>
              <p>
                Agila is pre-accredited by Luxinnovation for Fit 4 AI. Full
                accreditation follows the first successful assignment and
                applicable review.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.cta} aria-labelledby="fit4ai-cta-title">
          <div className="section-shell">
            <p className="section-index">Start with the opportunity landscape</p>
            <h2 id="fit4ai-cta-title">Where could AI make a material difference?</h2>
            <p>
              Bring the challenges, needs and ideas already on the table, even
              if they are still incomplete. Agila can help turn them into a
              structured assessment conversation.
            </p>
            <Link className="button button-light" href="/#contact">
              Explore your AI opportunity landscape
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
