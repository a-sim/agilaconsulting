"use client";

import type {
  Core,
  EdgeSingular,
  ElementDefinition,
  EventObjectNode,
  NodeSingular,
} from "cytoscape";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CapabilityArea,
  CapabilityDomain,
  CapabilitySystem,
} from "./ontology-types";
import styles from "./capabilities.module.css";

type Focus =
  | { type: "overview" }
  | { type: "all" }
  | { type: "domain"; id: string }
  | { type: "cluster"; id: string }
  | { type: "component"; id: string };

type SearchItem = {
  id: string;
  title: string;
  type: "domain" | "cluster" | "component";
  context: string;
};

const ROOT_ID = "agila";
const DOMAIN_ANGLES = [-90, -150, -30, 30, 90, 150];

function radians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function point(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function graphElements(model: CapabilitySystem): ElementDefinition[] {
  const centre = { x: 500, y: 370 };
  const elements: ElementDefinition[] = [
    {
      data: { id: ROOT_ID, label: "Agila", role: "root" },
      position: centre,
    },
  ];

  model.domains.forEach((domain, domainIndex) => {
    const domainAngle = radians(DOMAIN_ANGLES[domainIndex]);
    elements.push({
      data: {
        id: domain.id,
        label: domain.title,
        role: "domain",
        domainId: domain.id,
      },
      position: point(centre.x, centre.y, 225, domainAngle),
    });
    elements.push({
      data: {
        id: `hierarchy-${ROOT_ID}-${domain.id}`,
        source: ROOT_ID,
        target: domain.id,
        kind: "hierarchy",
      },
    });

    domain.clusters.forEach((cluster, clusterIndex) => {
      const spread = (clusterIndex - (domain.clusters.length - 1) / 2) * 0.15;
      const clusterAngle = domainAngle + spread;
      const clusterPosition = point(centre.x, centre.y, 410, clusterAngle);
      elements.push({
        data: {
          id: cluster.id,
          label: cluster.title,
          role: "cluster",
          domainId: domain.id,
          parentId: domain.id,
        },
        position: clusterPosition,
      });
      elements.push({
        data: {
          id: `hierarchy-${domain.id}-${cluster.id}`,
          source: domain.id,
          target: cluster.id,
          kind: "hierarchy",
        },
      });

      const componentRadius = cluster.components.length > 4 ? 92 : 68;
      cluster.components.forEach((component, componentIndex) => {
        const componentAngle =
          (Math.PI * 2 * componentIndex) / cluster.components.length;
        elements.push({
          data: {
            id: component.id,
            label: component.title,
            role: "component",
            domainId: domain.id,
            parentId: cluster.id,
          },
          position: point(
            clusterPosition.x,
            clusterPosition.y,
            componentRadius,
            componentAngle,
          ),
        });
        elements.push({
          data: {
            id: `hierarchy-${cluster.id}-${component.id}`,
            source: cluster.id,
            target: component.id,
            kind: "hierarchy",
          },
        });
      });
    });
  });

  model.relationships.forEach((relationship) => {
    elements.push({
      data: {
        ...relationship,
        role: "bridge",
      },
    });
  });

  return elements;
}

function focusHash(focus: Focus) {
  switch (focus.type) {
    case "all":
      return "#all-capability-areas";
    case "domain":
      return `#domain=${focus.id}`;
    case "cluster":
      return `#area=${focus.id}`;
    case "component":
      return `#capability=${focus.id}`;
    default:
      return "#explorer";
  }
}

export function CapabilityExplorer({ model }: { model: CapabilitySystem }) {
  const graphContainer = useRef<HTMLDivElement>(null);
  const graph = useRef<Core | null>(null);
  const commitFocusRef = useRef<(focus: Focus, push?: boolean) => void>(() => {});
  const [focus, setFocus] = useState<Focus>({ type: "overview" });
  const [query, setQuery] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [graphStatus, setGraphStatus] = useState("Loading interactive map…");

  const domainById = useMemo(
    () => new Map(model.domains.map((domain) => [domain.id, domain])),
    [model.domains],
  );
  const clusterEntries = useMemo(
    () =>
      model.domains.flatMap((domain) =>
        domain.clusters.map((cluster) => ({ domain, cluster })),
      ),
    [model.domains],
  );
  const clusterById = useMemo(
    () => new Map(clusterEntries.map((entry) => [entry.cluster.id, entry])),
    [clusterEntries],
  );
  const componentEntries = useMemo(
    () =>
      clusterEntries.flatMap(({ domain, cluster }) =>
        cluster.components.map((component) => ({ domain, cluster, component })),
      ),
    [clusterEntries],
  );
  const componentById = useMemo(
    () =>
      new Map(componentEntries.map((entry) => [entry.component.id, entry])),
    [componentEntries],
  );

  const parseHash = useCallback(
    (hash: string): Focus => {
      const value = decodeURIComponent(hash.replace(/^#/, ""));
      if (value === "all-capability-areas") return { type: "all" };
      if (value.startsWith("domain=") && domainById.has(value.slice(7))) {
        return { type: "domain", id: value.slice(7) };
      }
      if (value.startsWith("area=") && clusterById.has(value.slice(5))) {
        return { type: "cluster", id: value.slice(5) };
      }
      if (value.startsWith("capability=") && componentById.has(value.slice(11))) {
        return { type: "component", id: value.slice(11) };
      }
      return { type: "overview" };
    },
    [clusterById, componentById, domainById],
  );

  const commitFocus = useCallback((nextFocus: Focus, push = true) => {
    setFocus(nextFocus);
    setQuery("");
    setShareStatus("");
    if (push && typeof window !== "undefined") {
      const hash = focusHash(nextFocus);
      if (window.location.hash !== hash) {
        window.history.pushState({}, "", hash);
      }
    }
  }, []);
  commitFocusRef.current = commitFocus;

  useEffect(() => {
    const updateFromHistory = () => commitFocus(parseHash(window.location.hash), false);
    updateFromHistory();
    window.addEventListener("popstate", updateFromHistory);
    window.addEventListener("hashchange", updateFromHistory);
    return () => {
      window.removeEventListener("popstate", updateFromHistory);
      window.removeEventListener("hashchange", updateFromHistory);
    };
  }, [commitFocus, parseHash]);

  useEffect(() => {
    if (!graphContainer.current) return;
    let cancelled = false;
    let instance: Core | null = null;

    async function initialise() {
      const { default: cytoscape } = await import("cytoscape");
      if (cancelled || !graphContainer.current) return;

      instance = cytoscape({
        container: graphContainer.current,
        elements: graphElements(model),
        layout: { name: "preset", fit: true, padding: 72 },
        minZoom: 0.35,
        maxZoom: 2.3,
        boxSelectionEnabled: false,
        style: [
          {
            selector: "node",
            style: {
              "background-color": "#d7d7d2",
              "border-color": "#f7f7f4",
              "border-width": 1.5,
              color: "#f7f7f4",
              label: "data(label)",
              "font-family": "Manrope, Arial, sans-serif",
              "font-size": 10,
              "font-weight": 600,
              "min-zoomed-font-size": 7,
              "text-background-color": "#080808",
              "text-background-opacity": 0.78,
              "text-background-padding": "3px",
              "text-margin-y": 9,
              "text-max-width": "120px",
              "text-valign": "bottom",
              "text-wrap": "wrap",
              height: 14,
              width: 14,
            },
          },
          {
            selector: 'node[role = "root"]',
            style: {
              "background-color": "#ffffff",
              "border-color": "#ffffff",
              color: "#ffffff",
              "font-size": 13,
              "font-weight": 700,
              height: 44,
              shape: "round-rectangle",
              width: 82,
            },
          },
          {
            selector: 'node[role = "domain"]',
            style: {
              "background-color": "#f2f2ee",
              "border-color": "#ffffff",
              "font-size": 11,
              height: 28,
              width: 28,
            },
          },
          {
            selector: 'node[role = "component"]',
            style: {
              "background-color": "#8c8c87",
              "border-width": 1,
              "font-size": 8,
              height: 8,
              width: 8,
            },
          },
          {
            selector: "edge",
            style: {
              "curve-style": "bezier",
              "line-color": "#5a5a57",
              opacity: 0.72,
              width: 1,
            },
          },
          {
            selector: 'edge[kind != "hierarchy"]',
            style: {
              "line-color": "#bdbdb8",
              "line-style": "dashed",
              "target-arrow-color": "#bdbdb8",
              "target-arrow-shape": "triangle",
              "arrow-scale": 0.6,
              width: 1.25,
            },
          },
          {
            selector: ".is-hidden",
            style: { display: "none" },
          },
          {
            selector: ".is-dim",
            style: { opacity: 0.14 },
          },
          {
            selector: ".is-context",
            style: { opacity: 0.5 },
          },
          {
            selector: ".is-selected",
            style: {
              "background-color": "#ffffff",
              "border-color": "#ffffff",
              "border-width": 4,
              color: "#ffffff",
              opacity: 1,
              "z-index": 20,
            },
          },
        ],
      });

      instance.on("tap", "node", (event: EventObjectNode) => {
        const node = event.target as NodeSingular;
        const role = node.data("role");
        if (role === "root") commitFocusRef.current({ type: "overview" });
        if (role === "domain") {
          commitFocusRef.current({ type: "domain", id: node.id() });
        }
        if (role === "cluster") {
          commitFocusRef.current({ type: "cluster", id: node.id() });
        }
        if (role === "component") {
          commitFocusRef.current({ type: "component", id: node.id() });
        }
      });

      graph.current = instance;
      setGraphStatus("Interactive map ready");
    }

    initialise().catch(() => setGraphStatus("The text explorer remains available below."));

    return () => {
      cancelled = true;
      graph.current = null;
      instance?.destroy();
    };
  }, [model]);

  useEffect(() => {
    const cy = graph.current;
    if (!cy) return;

    const visible = new Set<string>([ROOT_ID, ...model.domains.map((domain) => domain.id)]);
    const selected = new Set<string>();
    const context = new Set<string>();
    const bridges = new Set<string>();
    let focusDomain: CapabilityDomain | undefined;
    let focusCluster: CapabilityArea | undefined;

    if (focus.type === "all") {
      clusterEntries.forEach(({ cluster }) => visible.add(cluster.id));
      model.relationships.forEach((relationship) => bridges.add(relationship.id));
    } else if (focus.type === "domain") {
      focusDomain = domainById.get(focus.id);
    } else if (focus.type === "cluster") {
      const entry = clusterById.get(focus.id);
      focusDomain = entry?.domain;
      focusCluster = entry?.cluster;
    } else if (focus.type === "component") {
      const entry = componentById.get(focus.id);
      focusDomain = entry?.domain;
      focusCluster = entry?.cluster;
    }

    if (focusDomain) {
      selected.add(focusDomain.id);
      focusDomain.clusters.forEach((cluster) => visible.add(cluster.id));
      for (const relationship of model.relationships) {
        const localSource = focusDomain.clusters.some(
          (cluster) => cluster.id === relationship.source,
        );
        const localTarget = focusDomain.clusters.some(
          (cluster) => cluster.id === relationship.target,
        );
        if (localSource || localTarget) {
          bridges.add(relationship.id);
          visible.add(relationship.source);
          visible.add(relationship.target);
          if (!localSource) context.add(relationship.source);
          if (!localTarget) context.add(relationship.target);
        }
      }
    }

    if (focusCluster) {
      selected.add(focusCluster.id);
      focusCluster.components.forEach((component) => visible.add(component.id));
    }
    if (focus.type === "component") selected.add(focus.id);
    if (focus.type === "domain") selected.add(focus.id);

    cy.batch(() => {
      cy.elements().removeClass("is-hidden is-dim is-context is-selected");
      cy.nodes().forEach((node: NodeSingular) => {
        if (!visible.has(node.id())) node.addClass("is-hidden");
        else if (context.has(node.id())) node.addClass("is-context");
        else if (
          focusDomain &&
          node.data("role") === "domain" &&
          node.id() !== focusDomain.id
        ) {
          node.addClass("is-dim");
        }
        if (selected.has(node.id())) node.addClass("is-selected");
      });
      cy.edges().forEach((edge: EdgeSingular) => {
        const endpointsVisible =
          visible.has(edge.source().id()) && visible.has(edge.target().id());
        const bridgeVisible =
          edge.data("kind") === "hierarchy" || bridges.has(edge.id());
        if (!endpointsVisible || !bridgeVisible) edge.addClass("is-hidden");
        if (edge.data("kind") !== "hierarchy") edge.addClass("is-context");
      });
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shown = cy.elements(":visible");
    if (reduceMotion) cy.fit(shown, 72);
    else cy.animate({ fit: { eles: shown, padding: 72 }, duration: 360 });
  }, [
    clusterById,
    clusterEntries,
    componentById,
    domainById,
    focus,
    model.domains,
    model.relationships,
  ]);

  const searchItems = useMemo<SearchItem[]>(
    () => [
      ...model.domains.map((domain) => ({
        id: domain.id,
        title: domain.title,
        type: "domain" as const,
        context: domain.strategicRole,
      })),
      ...clusterEntries.map(({ domain, cluster }) => ({
        id: cluster.id,
        title: cluster.title,
        type: "cluster" as const,
        context: domain.title,
      })),
      ...componentEntries.map(({ domain, cluster, component }) => ({
        id: component.id,
        title: component.title,
        type: "component" as const,
        context: `${domain.title} / ${cluster.title}`,
      })),
    ],
    [clusterEntries, componentEntries, model.domains],
  );
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];
    return searchItems
      .filter((item) => `${item.title} ${item.context}`.toLowerCase().includes(normalized))
      .sort((a, b) => {
        const aStarts = a.title.toLowerCase().startsWith(normalized) ? 0 : 1;
        const bStarts = b.title.toLowerCase().startsWith(normalized) ? 0 : 1;
        return aStarts - bStarts || a.title.localeCompare(b.title);
      })
      .slice(0, 8);
  }, [query, searchItems]);

  const selectedDomain =
    focus.type === "domain"
      ? domainById.get(focus.id)
      : focus.type === "cluster"
        ? clusterById.get(focus.id)?.domain
        : focus.type === "component"
          ? componentById.get(focus.id)?.domain
          : undefined;
  const selectedCluster =
    focus.type === "cluster"
      ? clusterById.get(focus.id)?.cluster
      : focus.type === "component"
        ? componentById.get(focus.id)?.cluster
        : undefined;
  const selectedComponent =
    focus.type === "component" ? componentById.get(focus.id)?.component : undefined;
  const related = selectedCluster
    ? model.relationships.filter(
        (relationship) =>
          relationship.source === selectedCluster.id ||
          relationship.target === selectedCluster.id,
      )
    : [];

  function selectSearchResult(item: SearchItem) {
    if (item.type === "domain") commitFocus({ type: "domain", id: item.id });
    if (item.type === "cluster") commitFocus({ type: "cluster", id: item.id });
    if (item.type === "component") commitFocus({ type: "component", id: item.id });
  }

  async function shareView() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Link copied");
    } catch {
      setShareStatus("Copy the address from your browser");
    }
  }

  function relationshipTitle(id: string) {
    return clusterById.get(id)?.cluster.title ?? id;
  }

  return (
    <section className={styles.explorer} id="explorer" aria-labelledby="explorer-title">
      <div className={styles.explorerTopline}>
        <div>
          <p className="eyebrow">Interactive capability system</p>
          <h2 id="explorer-title">Choose a domain. Follow the connections.</h2>
        </div>
        <div className={styles.viewControls} aria-label="Explorer view">
          <button
            aria-pressed={focus.type === "overview"}
            onClick={() => commitFocus({ type: "overview" })}
            type="button"
          >
            Overview
          </button>
          <button
            aria-pressed={focus.type === "all"}
            onClick={() => commitFocus({ type: "all" })}
            type="button"
          >
            All 24 areas
          </button>
        </div>
      </div>

      <div className={styles.searchArea}>
        <label htmlFor="capability-search">Search the capability system</label>
        <input
          autoComplete="off"
          id="capability-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try ‘data governance’, ‘MQTT’ or ‘adoption’"
          type="search"
          value={query}
        />
        {searchResults.length > 0 && (
          <ul className={styles.searchResults}>
            {searchResults.map((item) => (
              <li key={item.id}>
                <button onClick={() => selectSearchResult(item)} type="button">
                  <span>{item.title}</span>
                  <small>{item.context}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.domainControls} aria-label="Capability domains">
        {model.domains.map((domain) => (
          <button
            aria-pressed={selectedDomain?.id === domain.id}
            key={domain.id}
            onClick={() => commitFocus({ type: "domain", id: domain.id })}
            type="button"
          >
            <span>{domain.number}</span>
            {domain.title}
          </button>
        ))}
      </div>

      <div className={styles.explorerWorkspace}>
        <div className={styles.graphPanel}>
          <div className={styles.graphCaption}>
            <span>{graphStatus}</span>
            <span>Scroll to zoom · drag to pan · select a node</span>
          </div>
          <div
            aria-hidden="true"
            className={styles.graphCanvas}
            ref={graphContainer}
          />
        </div>

        <aside className={styles.inspector} aria-live="polite">
          <div className={styles.inspectorTopline}>
            <span>Selected capability</span>
            <button onClick={shareView} type="button">
              Share view
            </button>
          </div>
          {shareStatus && <p className={styles.shareStatus}>{shareStatus}</p>}

          {!selectedDomain && (
            <div className={styles.inspectorEmpty}>
              <span>A</span>
              <h3>Start with one of six domains.</h3>
              <p>
                Select a domain to see its capability areas. Choose an area to
                continue into its components and connections.
              </p>
            </div>
          )}

          {selectedDomain && (
            <div className={styles.inspectorContent}>
              <div className={styles.breadcrumbs}>
                <button onClick={() => commitFocus({ type: "overview" })} type="button">
                  Agila
                </button>
                <span>/</span>
                <button
                  onClick={() =>
                    commitFocus({ type: "domain", id: selectedDomain.id })
                  }
                  type="button"
                >
                  {selectedDomain.title}
                </button>
                {selectedCluster && <span>/</span>}
                {selectedCluster && (
                  <button
                    onClick={() =>
                      commitFocus({ type: "cluster", id: selectedCluster.id })
                    }
                    type="button"
                  >
                    {selectedCluster.title}
                  </button>
                )}
              </div>
              <p className={styles.inspectorRole}>
                {selectedComponent
                  ? "Component capability"
                  : selectedCluster
                    ? "Capability area"
                    : selectedDomain.strategicRole}
              </p>
              <h3>
                {selectedComponent?.title ??
                  selectedCluster?.title ??
                  selectedDomain.title}
              </h3>
              <p>
                {selectedComponent
                  ? `A component capability within ${selectedCluster?.title}.`
                  : selectedCluster?.summary ?? selectedDomain.description}
              </p>

              {!selectedCluster && (
                <div className={styles.inspectorList}>
                  <p>Capability areas</p>
                  {selectedDomain.clusters.map((cluster) => (
                    <button
                      key={cluster.id}
                      onClick={() => commitFocus({ type: "cluster", id: cluster.id })}
                      type="button"
                    >
                      <span>{cluster.title}</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedCluster && (
                <div className={styles.inspectorList}>
                  <p>Component capabilities</p>
                  {selectedCluster.components.map((component) => (
                    <button
                      aria-pressed={selectedComponent?.id === component.id}
                      key={component.id}
                      onClick={() =>
                        commitFocus({ type: "component", id: component.id })
                      }
                      type="button"
                    >
                      <span>{component.title}</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              )}

              {related.length > 0 && (
                <div className={styles.relationships}>
                  <p>Connects to</p>
                  {related.map((relationship) => {
                    const otherId =
                      relationship.source === selectedCluster?.id
                        ? relationship.target
                        : relationship.source;
                    return (
                      <button
                        key={relationship.id}
                        onClick={() => commitFocus({ type: "cluster", id: otherId })}
                        type="button"
                      >
                        <span>{relationshipTitle(otherId)}</span>
                        <small>{relationship.label}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
