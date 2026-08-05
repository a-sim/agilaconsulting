import Image from "next/image";
import Link from "next/link";

export function CapabilitySystemTeaser() {
  return (
    <div className="capability-system-teaser">
      <Image
        alt="Agila at the centre of a connected system of six capability domains, capability areas and components"
        className="capability-system-image"
        height={810}
        src="/agila-capability-system.webp"
        width={1440}
      />
      <div className="capability-system-link">
        <p>
          See how the six domains connect across 24 capability areas and 100
          capability components.
        </p>
        <Link
          className="button button-dark"
          href="/capabilities/"
          prefetch={false}
        >
          Explore the capability system <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </div>
  );
}
