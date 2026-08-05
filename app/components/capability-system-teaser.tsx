import Link from "next/link";
import { capabilities } from "../content";

export function CapabilitySystemTeaser() {
  return (
    <section className="capability-system-teaser section-shell section-rule">
      <div className="section-heading">
        <div className="section-index">03 / Capability system</div>
        <div>
          <h2>Complex change rarely sits in one box.</h2>
          <p className="section-note">
            Explore how Agila connects AI, architecture, industrial operations,
            digital delivery, governance and adoption around a real business
            challenge.
          </p>
        </div>
      </div>
      <div className="capability-teaser-panel">
        <div className="capability-teaser-map" aria-hidden="true">
          <div className="teaser-centre">Agila</div>
          {capabilities.map((capability) => (
            <div className="teaser-domain" key={capability.number}>
              <span>{capability.number}</span>
              {capability.title}
            </div>
          ))}
        </div>
        <div className="capability-teaser-copy">
          <p className="eyebrow">Connected capability system</p>
          <p>
            Navigate six client-facing domains, 24 focused capability areas and
            the component capabilities that make implementation coherent.
          </p>
          <Link className="button button-light" href="/capabilities/" prefetch={false}>
            Explore the capability system <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
