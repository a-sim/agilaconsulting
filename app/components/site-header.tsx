import Image from "next/image";
import { navigation } from "../content";
import { MobileMenu } from "./mobile-menu";

export function Wordmark({ reversed = false }: { reversed?: boolean }) {
  return (
    <Image
      className="wordmark"
      src={
        reversed
          ? "/agila-wordmark-white.svg?v=20260805"
          : "/agila-wordmark-black.svg?v=20260805"
      }
      alt="AGILA"
      width={613}
      height={260}
      priority={!reversed}
    />
  );
}

export function SiteHeader({ home = false }: { home?: boolean }) {
  const items = home
    ? navigation
    : navigation.map((item) => ({
        ...item,
        href: item.href.startsWith("#") ? `/${item.href}` : item.href,
      }));
  const homeHref = home ? "#top" : "/";
  const contactHref = home ? "#contact" : "/#contact";

  return (
    <header className="site-header">
      <a className="brand-link" href={homeHref} aria-label="Agila home">
        <Wordmark />
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {items.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <a className="header-contact" href={contactHref}>
        Discuss a challenge
        <span aria-hidden="true">↓</span>
      </a>
      <MobileMenu items={items} contactHref={contactHref} />
    </header>
  );
}
