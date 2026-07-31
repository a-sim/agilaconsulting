"use client";

import { useRef } from "react";

export function MobileMenu({
  items,
}: {
  items: ReadonlyArray<{ label: string; href: string }>;
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
        <a href="#contact" onClick={() => closeMenu("#contact")}>
          Discuss a challenge
        </a>
      </nav>
    </details>
  );
}
