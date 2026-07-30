import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public site is fully static. Azure Static Web Apps serves the exported
  // HTML and manages TLS for the Microsoft-hosted custom domains.
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
