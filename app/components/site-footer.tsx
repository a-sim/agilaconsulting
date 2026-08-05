import Link from "next/link";
import { site } from "../content";
import { Wordmark } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="section-shell footer-inner">
        <a className="footer-brand" href="/" aria-label="Agila home">
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
  );
}
