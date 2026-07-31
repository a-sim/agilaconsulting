export const site = {
  canonicalUrl: "https://agilaconsult.com",
  email: "alejandro@agilaconsult.com",
  linkedin: "https://www.linkedin.com/in/asimovesperinas/",
  fit4AiUrl:
    "https://luxinnovation.lu/digitalise-activities/digital-cyber-maturity/fit-4-ai",
};

export function mailtoHref({
  subject,
  body,
}: {
  subject?: string;
  body?: string;
} = {}) {
  const parameters: string[] = [];

  if (subject) {
    parameters.push(`subject=${encodeURIComponent(subject)}`);
  }

  if (body) {
    parameters.push(`body=${encodeURIComponent(body)}`);
  }

  const query = parameters.join("&");

  return `mailto:${site.email}${query ? `?${query}` : ""}`;
}

export const navigation = [
  { label: "Capabilities", href: "#capabilities" },
  { label: "Approach", href: "#approach" },
  { label: "Experience", href: "#experience" },
  { label: "About", href: "#about" },
];

export const capabilities = [
  {
    number: "01",
    title: "Data, analytics and AI",
    text: "Find where AI and analytics can improve real work, then put the right data, controls and operating foundations in place.",
    details: [
      "AI opportunity and readiness assessment",
      "Data strategy, quality and governance",
      "Analytics and decision support",
      "Governed agentic workflows",
    ],
  },
  {
    number: "02",
    title: "Business and operating-model transformation",
    text: "Connect strategy to processes, roles, investment choices and adoption so that change works beyond the technology layer.",
    details: [
      "Current-state assessment",
      "Capability and process design",
      "Business cases and roadmaps",
      "Operating models and adoption",
    ],
  },
  {
    number: "03",
    title: "Enterprise, solution and integration architecture",
    text: "Define coherent current and target states, make technology trade-offs clear and give implementation teams designs they can use.",
    details: [
      "Enterprise and solution design",
      "Integration and interoperability",
      "Platform and product assessment",
      "Roadmaps and design assurance",
    ],
  },
  {
    number: "04",
    title: "Industrial operations, IT/OT and IIoT",
    text: "Connect plant, edge, cloud and enterprise environments with attention to operational context, resilience and scale.",
    details: [
      "Digital manufacturing and MES",
      "IT/OT boundaries and resilience",
      "UNS, MQTT and industrial connectivity",
      "Operational data and AI readiness",
    ],
  },
  {
    number: "05",
    title: "Digital products and operating systems",
    text: "Design and build focused applications, dashboards, integrations and workflows that support a defined business need.",
    details: [
      "Product discovery and UX",
      "Applications and dashboards",
      "APIs, connectors and automation",
      "Deployment and handover",
    ],
  },
  {
    number: "06",
    title: "Governance, delivery and adoption",
    text: "Keep programmes, AI use and implementation work accountable through clear ownership, evidence, assurance and knowledge transfer.",
    details: [
      "Programme and project delivery",
      "AI, data and privacy governance",
      "Quality and implementation assurance",
      "Training and knowledge transfer",
    ],
  },
];

export const method = [
  {
    number: "01",
    title: "Assess the current situation",
    text: "Understand the problem, objectives, processes, data, systems, constraints and readiness.",
  },
  {
    number: "02",
    title: "Design the target state",
    text: "Define the future capabilities, operating model, architecture and transition options.",
  },
  {
    number: "03",
    title: "Select and plan",
    text: "Evaluate technology choices and trade-offs, then set priorities and an implementation roadmap.",
  },
  {
    number: "04",
    title: "Implement and govern",
    text: "Build, integrate or guide delivery with clear decisions, controls and quality assurance.",
  },
  {
    number: "05",
    title: "Support and improve",
    text: "Help with handover, adoption, operational support and the next cycle of improvement.",
  },
];

export const experience = [
  {
    context: "Global manufacturing",
    title: "Industrial data architecture from assessment to proof of concept",
    text: "Defined MQTT and Unified Namespace patterns, edge-to-cloud boundaries, governance and a phased rollout path for a complex multi-site environment.",
  },
  {
    context: "European aviation",
    title: "Cross-system solution and integration architecture",
    text: "Authored and governed designs spanning event flows, data contracts, resilience, operational ownership and GDPR separation for an airline transformation.",
  },
  {
    context: "Industrial platforms",
    title: "Technical and commercial-readiness assessment",
    text: "Assessed an industrial analytics platform across architecture, product operations, user value, support, pricing logic and roadmap priorities.",
  },
  {
    context: "Specialist healthcare SME",
    title: "A management system built around better decisions",
    text: "Turned fragmented operating, financial and CRM data into a privacy-aware management cockpit and an executable operating roadmap.",
  },
  {
    context: "Critical infrastructure",
    title: "Secure industrial connectivity and rollout support",
    text: "Contributed requirements, security and rollout design for a monitored MQTT and Unified Namespace platform in a critical operating environment.",
  },
  {
    context: "AI operating systems",
    title: "Governed multi-agent architecture for real work",
    text: "Designed and operated a private environment connecting persistent knowledge, tools, tests, approval gates, observability and recovery loops.",
  },
];
