import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import publicCapabilitySystem from "./public-capability-system.json";
import { CapabilityExplorer } from "./capability-explorer";
import type { CapabilitySystem } from "./ontology-types";
import styles from "./capabilities.module.css";

export const metadata: Metadata = {
  title: "Interactive capability system",
  description:
    "Explore how Agila connects AI, data, architecture, industrial operations, transformation, digital delivery, governance and adoption.",
  alternates: { canonical: "/capabilities" },
  openGraph: {
    title: "Agila interactive capability system",
    description: "Capabilities that work as a connected system.",
    url: "/capabilities/",
  },
  twitter: {
    title: "Agila interactive capability system",
    description: "Capabilities that work as a connected system.",
  },
};

const capabilitySystem = publicCapabilitySystem as CapabilitySystem;

export default function CapabilitiesPage() {
  return (
    <>
      <a className="skip-link" href="#capabilities-content">
        Skip to main content
      </a>
      <SiteHeader />

      <main id="capabilities-content">
        <section className={`${styles.hero} section-shell`}>
          <div>
            <p className="eyebrow">Capabilities / Interactive system</p>
            <h1>Capabilities that work as a system.</h1>
          </div>
          <div className={styles.heroCopy}>
            <p>
              Agila connects six capability domains. Together, they help move a
              complex challenge from definition through design, delivery and
              adoption.
            </p>
            <p>
              Choose a domain to see its capability areas and components. Follow
              the connections to understand what else the work may depend on.
            </p>
          </div>
          <dl className={styles.modelStats}>
            <div>
              <dt>{capabilitySystem.counts.domains}</dt>
              <dd>Domains</dd>
            </div>
            <div>
              <dt>{capabilitySystem.counts.capabilityAreas}</dt>
              <dd>Capability areas</dd>
            </div>
            <div>
              <dt>{capabilitySystem.counts.componentCapabilities}</dt>
              <dd>Capability components</dd>
            </div>
          </dl>
        </section>

        <CapabilityExplorer model={capabilitySystem} />

        <section
          className={`${styles.textIndex} section-shell section-rule`}
          id="capability-index"
          aria-labelledby="capability-index-title"
        >
          <div className="section-heading">
            <div className="section-index">Browse the full list</div>
            <div>
              <h2 id="capability-index-title">Browse the complete capability list.</h2>
              <p className="section-note">
                Open any domain to see its capability areas and components. Use
                the list to scan the whole system at your own pace.
              </p>
            </div>
          </div>

          <div className={styles.domainIndex}>
            {capabilitySystem.domains.map((domain) => (
              <details key={domain.id} id={`index-${domain.id}`}>
                <summary>
                  <span>{domain.number}</span>
                  <strong>{domain.title}</strong>
                  <small>{domain.clusters.length} capability areas</small>
                </summary>
                <div className={styles.domainIndexContent}>
                  <p>{domain.description}</p>
                  <div className={styles.clusterIndex}>
                    {domain.clusters.map((cluster) => (
                      <article key={cluster.id}>
                        <h3>{cluster.title}</h3>
                        <ul>
                          {cluster.components.map((component) => (
                            <li key={component.id}>{component.title}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
          <p className={styles.disclaimer}>{capabilitySystem.disclaimer}</p>
        </section>

        <section className={styles.contactPanel}>
          <div className="section-shell">
            <p className="section-index">Discuss a challenge</p>
            <h2>Where does your challenge enter the system?</h2>
            <p>
              Start with the decision, constraint or operating problem. The
              relevant capabilities can then be assembled around it.
            </p>
            <Link className="button button-light" href="/#contact">
              Bring the challenge into focus <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
