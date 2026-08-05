import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agilaconsult.com"),
  title: {
    default: "Agila | AI-central, architecture-led transformation",
    template: "%s | Agila",
  },
  description:
    "Agila helps organisations assess complex transformations, design target systems, select technology and support implementation across AI, data and industrial operations.",
  applicationName: "Agila",
  authors: [{ name: "Agila Consulting S.à r.l." }],
  creator: "Agila",
  publisher: "Agila Consulting S.à r.l.",
  alternates: { canonical: "/" },
  keywords: [
    "AI transformation",
    "enterprise architecture",
    "solution architecture",
    "agentic systems",
    "industrial IT OT",
    "operational data",
    "Luxembourg",
  ],
  icons: {
    icon: "/agila-wordmark-black.svg",
    shortcut: "/agila-wordmark-black.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: "Agila",
    title: "Agila | AI-central, architecture-led transformation",
    description:
      "From AI ambition to working systems.",
  },
  twitter: {
    card: "summary",
    title: "Agila | AI-central, architecture-led transformation",
    description:
      "From AI ambition to working systems.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
