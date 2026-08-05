import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function cluster(id, title, components) {
  return { id, title, components };
}

const DOMAIN_DEFINITIONS = [
  {
    id: "data-ai",
    number: "01",
    title: "Data, analytics and AI",
    shortTitle: "AI, data & analytics",
    description:
      "Find where AI and analytics can improve real work, then put the right data, controls and operating foundations in place.",
    strategicRole: "Primary value focus",
    clusters: [
      cluster("ai-readiness", "AI opportunity and readiness", [
        "Decision-first opportunity discovery",
        "Process, people, data and architecture maturity",
        "AI versus rules or conventional automation",
        "Value, feasibility and risk portfolio",
      ]),
      cluster(
        "data-foundations",
        "Data foundations, engineering and governance",
        [
          "Ownership and stewardship",
          "Quality, profiling and exception handling",
          "Canonical models, lineage and access",
          "Source contracts, pipelines and operational handover",
        ],
      ),
      cluster("analytics-decisions", "Analytics and decision systems", [
        "KPI trees and metric definitions",
        "Executive and operational dashboards",
        "Performance diagnostics and scenario analysis",
        "Management cadence and decision follow-through",
      ]),
      cluster(
        "agentic-systems",
        "Governed agentic workflows and operating systems",
        [
          "Agentic architecture",
          "Harness engineering",
          "Graph engineering",
          "Loop engineering",
          "Context, memory and knowledge",
          "Agents, skills, tools and applications",
          "Evaluation, evidence and governance",
          "Observability, resilience and recovery",
        ],
      ),
    ],
  },
  {
    id: "transformation",
    number: "02",
    title: "Business and operating-model transformation",
    shortTitle: "Transform & adopt",
    description:
      "Connect strategy to processes, roles, investment choices and adoption so that change works beyond the technology layer.",
    strategicRole: "Transformation and adoption",
    clusters: [
      cluster("discovery-framing", "Discovery and current-state framing", [
        "Sponsor and decision-owner mapping",
        "Pain and economic-consequence framing",
        "Stakeholder, constraint and dependency mapping",
        "Outcomes and acceptance criteria",
      ]),
      cluster("process-design", "Capability and process design", [
        "Capability and value-stream mapping",
        "Current-state and target-state processes",
        "Roles, handoffs and controls",
        "Requirements and traceability",
      ]),
      cluster("value-roadmaps", "Value cases and roadmaps", [
        "Investment value, cost and total-cost framing",
        "Scenario and sensitivity analysis",
        "Value, feasibility and risk prioritisation",
        "Roadmap and investment sequencing",
      ]),
      cluster("operating-model", "Operating model and adoption", [
        "Decision rights and accountability",
        "Organisation and service-delivery roles",
        "Scorecards, cadence and management routines",
        "Adoption and knowledge transfer",
      ]),
    ],
  },
  {
    id: "architecture",
    number: "03",
    title: "Enterprise, solution and integration architecture",
    shortTitle: "Architecture spine",
    description:
      "Define coherent current and target states, make technology trade-offs clear and give implementation teams designs they can use.",
    strategicRole: "Professional spine",
    clusters: [
      cluster(
        "enterprise-architecture",
        "Enterprise and target-state architecture",
        [
          "Business, data, application and technology views",
          "Current-state and target-state architecture",
          "Principles, standards and architecture runway",
          "Transition states and dependency roadmap",
        ],
      ),
      cluster("solution-architecture", "Solution architecture", [
        "Solution architecture descriptions",
        "Functional and non-functional requirements",
        "Decisions and trade-offs",
        "Security, privacy, resilience and operability",
      ]),
      cluster("integration", "Integration and interoperability", [
        "API and service-integration patterns",
        "Event-driven architecture",
        "Canonical models and data contracts",
        "Source-to-target mapping and reconciliation",
      ]),
      cluster("platform-assurance", "Platform assessment and design assurance", [
        "Architecture and technical maturity",
        "Product and user-value maturity",
        "Requirements-to-design traceability",
        "Vendor and implementation assurance",
      ]),
    ],
  },
  {
    id: "industrial",
    number: "04",
    title: "Industrial operations, IT/OT and IIoT",
    shortTitle: "Industrial anchor",
    description:
      "Connect plant, edge, cloud and enterprise environments with attention to operational context, resilience and scale.",
    strategicRole: "Differentiating field anchor",
    clusters: [
      cluster(
        "digital-manufacturing",
        "Industrial operations and digital manufacturing",
        [
          "MES, SCADA, ERP and historian context",
          "OEE, Andon and operator experience",
          "Process-to-quality and parameter analytics",
          "Multi-site digital-manufacturing roadmaps",
        ],
      ),
      cluster("itot-resilience", "IT/OT architecture and resilience", [
        "Segmentation, zones and conduits",
        "Edge, plant, cloud and enterprise boundaries",
        "Availability and failure domains",
        "Monitoring, backup, recovery and rollback",
      ]),
      cluster("industrial-connectivity", "UNS, MQTT and industrial connectivity", [
        "UNS principles, topic taxonomy and governance",
        "MQTT and broker architecture",
        "OPC UA and industrial-system integration",
        "Payload semantics, quality and lineage",
      ]),
      cluster("operational-data", "Operational-data and AI readiness", [
        "Operational-data landscape and quality",
        "Context, units, timestamps and lineage",
        "Anomaly, predictive and vision opportunities",
        "Pilot feasibility and controlled scale-out",
      ]),
    ],
  },
  {
    id: "digital-products",
    number: "05",
    title: "Digital products and operating systems",
    shortTitle: "Build & operationalise",
    description:
      "Design and build focused applications, dashboards, integrations and workflows that support a defined business need.",
    strategicRole: "Build and operationalise",
    clusters: [
      cluster("product-discovery", "Product discovery and UX", [
        "User, job and workflow discovery",
        "User journeys and interaction design",
        "Functional scope and acceptance criteria",
        "Privacy, multilingual and local-first choices",
      ]),
      cluster("applications", "Applications and dashboards", [
        "Application and service development",
        "Web and mobile interfaces",
        "BI and operational dashboards",
        "Workflow and conversational interfaces",
      ]),
      cluster("automation", "APIs, connectors and automation", [
        "APIs, webhooks and service contracts",
        "Workplace and collaboration integrations",
        "CRM, document and business-system connectors",
        "Messaging and workflow orchestration",
      ]),
      cluster("quality-handover", "Quality, deployment and handover", [
        "Unit, integration and regression testing",
        "Release pipelines and deployment controls",
        "Visual QA and accessibility review",
        "Documentation, handover, support and rollback",
      ]),
    ],
  },
  {
    id: "governance",
    number: "06",
    title: "Governance, delivery and adoption",
    shortTitle: "Govern & scale",
    description:
      "Keep programmes, AI use and implementation work accountable through clear ownership, evidence, assurance and knowledge transfer.",
    strategicRole: "Govern, deliver and scale",
    clusters: [
      cluster("programme-delivery", "Programme and project delivery", [
        "Scope, work packages and delivery plans",
        "Risks, assumptions, issues and dependencies",
        "Stakeholder and governance cadence",
        "Milestones, acceptance and transition",
      ]),
      cluster("responsible-governance", "AI, data and privacy governance", [
        "Responsible-AI principles and risk taxonomy",
        "Regulatory-workstream framing and specialist escalation",
        "Data-use, privacy and security decisions",
        "Vendor neutrality and governance controls",
      ]),
      cluster(
        "human-assurance",
        "Human authority, evidence and assurance",
        [
          "Human decision rights and autonomy tiers",
          "Maker-checker separation and approval gates",
          "Provenance and public-claim controls",
          "Tests, audit trails and recovery evidence",
        ],
      ),
      cluster("training-adoption", "Training, adoption and knowledge transfer", [
        "AI literacy and tool selection",
        "Architecture and industrial workshops",
        "Playbooks, templates and knowledge assets",
        "Train-the-trainer, reuse and improvement",
      ]),
    ],
  },
];

const PUBLIC_RELATIONSHIPS = [
  ["discovery-framing", "ai-readiness", "informs", "informs"],
  ["ai-readiness", "data-foundations", "depends on", "depends-on"],
  ["data-foundations", "analytics-decisions", "enables", "enables"],
  ["integration", "data-foundations", "shapes", "informs"],
  ["agentic-systems", "human-assurance", "governed by", "governed-by"],
  ["agentic-systems", "automation", "implemented through", "implemented-through"],
  ["process-design", "product-discovery", "informs", "informs"],
  ["operating-model", "enterprise-architecture", "aligns with", "aligns-with"],
  ["solution-architecture", "itot-resilience", "applies to", "connects-to"],
  ["integration", "industrial-connectivity", "connects to", "connects-to"],
  ["operational-data", "ai-readiness", "specialises", "specialises"],
  ["quality-handover", "training-adoption", "transitions through", "transitions-through"],
];

const FORBIDDEN_PUBLIC_KEYS = new Set([
  "evidence_ids",
  "evidence_maturity",
  "publication_class",
  "delivery_modes",
  "authority_limit",
  "source_id",
  "kumu_id",
  "view_tags",
  "group_path",
  "visual_domain",
]);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function sentenceList(items) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const sourcePath = argument("--source");
const outputPath = path.resolve(
  argument("--output") ?? "app/capabilities/public-capability-system.json",
);

if (!sourcePath) {
  throw new Error(
    "Provide the private V3 Cytoscape export with --source. The public website never reads the private ontology during its build.",
  );
}

const source = JSON.parse(await readFile(path.resolve(sourcePath), "utf8"));
const sourceNodes = source.elements.filter((element) => element.group === "nodes");
const sourceEdges = source.elements.filter((element) => element.group === "edges");

if (sourceNodes.length !== 316 || sourceEdges.length !== 536) {
  throw new Error(
    `Unexpected private source baseline: ${sourceNodes.length} nodes and ${sourceEdges.length} relationships. Review the public projection before rebuilding.`,
  );
}

const domains = DOMAIN_DEFINITIONS.map((definition, domainIndex) => ({
  id: definition.id,
  number: definition.number,
  title: definition.title,
  shortTitle: definition.shortTitle,
  description: definition.description,
  strategicRole: definition.strategicRole,
  order: domainIndex + 1,
  clusters: definition.clusters.map((item, clusterIndex) => ({
    id: item.id,
    title: item.title,
    summary: `Includes ${sentenceList(
      item.components.map((component) => component.toLowerCase()),
    )}.`,
    order: clusterIndex + 1,
    components: item.components.map((title, componentIndex) => ({
      id: `${item.id}-${slug(title)}`,
      title,
      order: componentIndex + 1,
    })),
  })),
}));

const publicClusterIds = new Set(
  domains.flatMap((domain) => domain.clusters.map((item) => item.id)),
);
const relationships = PUBLIC_RELATIONSHIPS.map(
  ([sourceId, targetId, label, kind], index) => {
    if (!publicClusterIds.has(sourceId) || !publicClusterIds.has(targetId)) {
      throw new Error(`Unknown public relationship ${sourceId} -> ${targetId}.`);
    }

    return {
      id: `bridge-${String(index + 1).padStart(2, "0")}`,
      source: sourceId,
      target: targetId,
      label,
      kind,
    };
  },
);

const clusterCount = domains.reduce(
  (total, domain) => total + domain.clusters.length,
  0,
);
const componentCount = domains.reduce(
  (total, domain) =>
    total +
    domain.clusters.reduce(
      (clusterTotal, item) => clusterTotal + item.components.length,
      0,
    ),
  0,
);

const publicSystem = {
  schemaVersion: 1,
  edition: "2026-08-05-public-demo-v1",
  title: "Agila capability system",
  summary:
    "A public, client-facing view of how Agila connects AI, architecture, industrial operations, transformation, digital delivery and governance.",
  disclaimer:
    "This is a navigational capability model, not a fixed service catalogue, delivery promise or statement that every capability is used in every engagement.",
  counts: {
    domains: domains.length,
    capabilityAreas: clusterCount,
    componentCapabilities: componentCount,
    curatedBridges: relationships.length,
  },
  domains,
  relationships,
};

const publicText = JSON.stringify(publicSystem, null, 2);
for (const key of FORBIDDEN_PUBLIC_KEYS) {
  if (publicText.includes(`"${key}"`)) {
    throw new Error(`Forbidden private field ${key} reached the public projection.`);
  }
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${publicText}\n`, "utf8");

console.log(
  `Wrote ${outputPath}: ${domains.length} domains, ${clusterCount} capability areas, ${componentCount} component capabilities and ${relationships.length} curated bridges.`,
);
