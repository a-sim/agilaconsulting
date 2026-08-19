"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CapabilityForceGraph,
  type CapabilityFocus,
} from "./capability-force-graph";
import type {
  CapabilityArea,
  CapabilityDomain,
  CapabilitySystem,
} from "./ontology-types";
import styles from "./capabilities.module.css";
import { INLINE_EXPLORER_RECOVERY } from "./inline-explorer-recovery";

type SearchItem = {
  id: string;
  title: string;
  type: "domain" | "cluster" | "component";
  context: string;
};

type GraphStatus = "fallback" | "ready";

type RecoveryWindow = Window & {
  __agilaCapabilityRecoveryCleanup?: () => void;
};

function focusHash(focus: CapabilityFocus) {
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
  const explorerRoot = useRef<HTMLElement>(null);
  const [focus, setFocus] = useState<CapabilityFocus>({ type: "overview" });
  const [query, setQuery] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [graphStatus, setGraphStatus] = useState<GraphStatus>("fallback");
  const [graphSummary, setGraphSummary] = useState({ nodes: 0, links: 0 });

  useLayoutEffect(() => {
    const root = explorerRoot.current;
    if (!root) return;
    const recoveryWindow = window as RecoveryWindow;
    recoveryWindow.__agilaCapabilityRecoveryCleanup?.();
    root.dataset.reactReady = "true";
  }, []);

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
    (hash: string): CapabilityFocus => {
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

  const commitFocus = useCallback((nextFocus: CapabilityFocus, push = true) => {
    setFocus(nextFocus);
    setQuery("");
    setShareStatus("");
    if (push && typeof window !== "undefined") {
      const hash = focusHash(nextFocus);
      if (window.location.hash !== hash) window.history.pushState({}, "", hash);
    }
  }, []);

  useEffect(() => {
    const updateFromHistory = () =>
      commitFocus(parseHash(window.location.hash), false);
    updateFromHistory();
    window.addEventListener("popstate", updateFromHistory);
    window.addEventListener("hashchange", updateFromHistory);
    return () => {
      window.removeEventListener("popstate", updateFromHistory);
      window.removeEventListener("hashchange", updateFromHistory);
    };
  }, [commitFocus, parseHash]);

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
    const normalised = query.trim().toLowerCase();
    if (normalised.length < 2) return [];
    return searchItems
      .filter((item) =>
        `${item.title} ${item.context}`.toLowerCase().includes(normalised),
      )
      .sort((left, right) => {
        const leftStarts = left.title.toLowerCase().startsWith(normalised) ? 0 : 1;
        const rightStarts = right.title.toLowerCase().startsWith(normalised) ? 0 : 1;
        return leftStarts - rightStarts || left.title.localeCompare(right.title);
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
    focus.type === "component"
      ? componentById.get(focus.id)?.component
      : undefined;
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
    if (item.type === "component") {
      commitFocus({ type: "component", id: item.id });
    }
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

  const recoveryPayload = JSON.stringify({
    model,
    classes: {
      breadcrumbs: styles.breadcrumbs,
      inspectorContent: styles.inspectorContent,
      inspectorEmpty: styles.inspectorEmpty,
      inspectorList: styles.inspectorList,
      inspectorRole: styles.inspectorRole,
      inspectorTopline: styles.inspectorTopline,
      searchResults: styles.searchResults,
    },
  }).replace(/</g, "\\u003c");
  const publicCapabilityCount =
    model.counts.capabilityAreas + model.counts.componentCapabilities;

  return (
    <section
      aria-labelledby="explorer-title"
      className={styles.explorer}
      data-capability-explorer="true"
      data-react-ready="false"
      id="explorer"
      ref={explorerRoot}
    >
      <div className={styles.explorerTopline}>
        <div>
          <p className="eyebrow">Interactive capability system</p>
          <h2 id="explorer-title">Choose a domain. Follow the connections.</h2>
        </div>
        <div className={styles.viewControls} aria-label="Explorer view">
          <button
            aria-pressed={focus.type === "overview"}
            data-recovery-view="overview"
            onClick={() => commitFocus({ type: "overview" })}
            type="button"
          >
            Overview
          </button>
          <button
            aria-pressed={focus.type === "all"}
            data-recovery-view="all"
            onClick={() => commitFocus({ type: "all" })}
            type="button"
          >
            All {publicCapabilityCount} capabilities
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
            data-recovery-domain={domain.id}
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
            <div className={styles.graphStatus} role="status">
              <span data-recovery-status="true">
                {graphStatus === "ready"
                  ? `Interactive map ready · ${graphSummary.nodes} nodes · ${graphSummary.links} connections`
                  : "Visual overview"}
              </span>
            </div>
            <span className={styles.graphHint} data-recovery-hint="true">
              {graphStatus === "ready"
                ? "Scroll to zoom · drag to pan · select a node"
                : "A visual overview remains available"}
            </span>
          </div>
          <div
            aria-hidden="true"
            className={styles.graphFallback}
            data-hidden={graphStatus === "ready"}
            data-recovery-fallback="true"
          >
            <Image
              alt=""
              height={900}
              priority
              sizes="(max-width: 980px) 100vw, 70vw"
              src="/agila-capability-system.webp"
              width={1600}
            />
          </div>
          <CapabilityForceGraph
            className={styles.forceGraph}
            focus={focus}
            model={model}
            onReady={(nodes, links) => {
              setGraphSummary({ nodes, links });
              setGraphStatus("ready");
            }}
            onSelect={commitFocus}
          />
          <canvas
            aria-hidden="true"
            className={styles.recoveryCanvas}
            data-ready="false"
            data-renderer="native-recovery"
          />
        </div>

        <aside
          aria-live="polite"
          className={styles.inspector}
          data-recovery-inspector="true"
        >
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
                <CapabilityAreaList
                  domain={selectedDomain}
                  onSelect={(cluster) =>
                    commitFocus({ type: "cluster", id: cluster.id })
                  }
                />
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
      <script
        dangerouslySetInnerHTML={{ __html: recoveryPayload }}
        id="agila-capability-recovery-data"
        type="application/json"
      />
      <script dangerouslySetInnerHTML={{ __html: INLINE_EXPLORER_RECOVERY }} />
    </section>
  );
}

function CapabilityAreaList({
  domain,
  onSelect,
}: {
  domain: CapabilityDomain;
  onSelect: (cluster: CapabilityArea) => void;
}) {
  return (
    <div className={styles.inspectorList}>
      <p>Capability areas</p>
      {domain.clusters.map((cluster) => (
        <button key={cluster.id} onClick={() => onSelect(cluster)} type="button">
          <span>{cluster.title}</span>
          <span aria-hidden="true">→</span>
        </button>
      ))}
    </div>
  );
}
