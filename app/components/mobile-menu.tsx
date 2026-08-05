"use client";

import { useRef } from "react";

export function MobileMenu({
  items,
  contactHref = "#contact",
}: {
  items: ReadonlyArray<{ label: string; href: string }>;
  contactHref?: string;
}) {
  const menu = useRef<HTMLDetailsElement>(null);

  function closeMenu(href: string) {
    if (menu.current) {
      menu.current.open = false;
    }

    if (href === "#contact") {
      requestAnimationFrame(() => document.getElementById("contact-heading")?.focus());
    }
  }

  return (
    <details className="mobile-menu" ref={menu}>
      <summary aria-label="Open navigation">
        <span />
        <span />
      </summary>
      <nav aria-label="Mobile navigation">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => closeMenu(item.href)}
          >
            {item.label}
          </a>
        ))}
        <a href={contactHref} onClick={() => closeMenu(contactHref)}>
          Discuss a challenge
        </a>
      </nav>
    </details>
  );
}
