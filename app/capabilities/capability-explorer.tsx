"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
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

type GraphStatus = "fallback" | "ready";

type GraphNode = {
  id: string;
  label: string;
  role: "root" | "domain" | "cluster" | "component";
  domainId?: string;
  parentId?: string;
  position: { x: number; y: number };
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: "hierarchy" | "bridge";
};

type GraphModel = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type GraphPresentation = {
  visible: Set<string>;
  selected: Set<string>;
  context: Set<string>;
  bridges: Set<string>;
  focusDomainId?: string;
};

type GraphView = { zoom: number; x: number; y: number };
type HitTarget = { node: GraphNode; x: number; y: number; radius: number };

const ROOT_ID = "agila";
const DOMAIN_ANGLES = [-90, -150, -30, 30, 90, 150];
const GRAPH_CENTRE = { x: 500, y: 370 };

const graphStatusLabels: Record<GraphStatus, string> = {
  fallback: "Visual overview",
  ready: "Interactive map ready",
};

function radians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function point(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function buildGraph(model: CapabilitySystem): GraphModel {
  const nodes: GraphNode[] = [
    { id: ROOT_ID, label: "Agila", role: "root", position: GRAPH_CENTRE },
  ];
  const edges: GraphEdge[] = [];

  model.domains.forEach((domain, domainIndex) => {
    const domainAngle = radians(DOMAIN_ANGLES[domainIndex]);
    nodes.push({
      id: domain.id,
      label: domain.title,
      role: "domain",
      domainId: domain.id,
      position: point(GRAPH_CENTRE.x, GRAPH_CENTRE.y, 225, domainAngle),
    });
    edges.push({
      id: `hierarchy-${ROOT_ID}-${domain.id}`,
      source: ROOT_ID,
      target: domain.id,
      kind: "hierarchy",
    });

    domain.clusters.forEach((cluster, clusterIndex) => {
      const spread = (clusterIndex - (domain.clusters.length - 1) / 2) * 0.15;
      const clusterAngle = domainAngle + spread;
      const clusterPosition = point(
        GRAPH_CENTRE.x,
        GRAPH_CENTRE.y,
        410,
        clusterAngle,
      );
      nodes.push({
        id: cluster.id,
        label: cluster.title,
        role: "cluster",
        domainId: domain.id,
        parentId: domain.id,
        position: clusterPosition,
      });
      edges.push({
        id: `hierarchy-${domain.id}-${cluster.id}`,
        source: domain.id,
        target: cluster.id,
        kind: "hierarchy",
      });

      const componentRadius = cluster.components.length > 4 ? 92 : 68;
      cluster.components.forEach((component, componentIndex) => {
        const componentAngle =
          (Math.PI * 2 * componentIndex) / cluster.components.length;
        nodes.push({
          id: component.id,
          label: component.title,
          role: "component",
          domainId: domain.id,
          parentId: cluster.id,
          position: point(
            clusterPosition.x,
            clusterPosition.y,
            componentRadius,
            componentAngle,
          ),
        });
        edges.push({
          id: `hierarchy-${cluster.id}-${component.id}`,
          source: cluster.id,
          target: component.id,
          kind: "hierarchy",
        });
      });
    });
  });

  model.relationships.forEach((relationship) => {
    edges.push({
      id: relationship.id,
      source: relationship.source,
      target: relationship.target,
      kind: "bridge",
    });
  });

  return { nodes, edges };
}

function wrapGraphLabel(label: string) {
  const words = label.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= 24 || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= 2) return lines;
  return [lines[0], `${lines[1].slice(0, 21)}…`];
}

function renderGraph(
  canvas: HTMLCanvasElement,
  graph: GraphModel,
  presentation: GraphPresentation,
  view: GraphView,
) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width < 1 || height < 1) return [];

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const renderWidth = Math.round(width * pixelRatio);
  const renderHeight = Math.round(height * pixelRatio);
  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth;
    canvas.height = renderHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) return [];
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const visibleNodes = graph.nodes.filter((node) =>
    presentation.visible.has(node.id),
  );
  if (visibleNodes.length === 0) return [];
  const minX = Math.min(...visibleNodes.map((node) => node.position.x));
  const maxX = Math.max(...visibleNodes.map((node) => node.position.x));
  const minY = Math.min(...visibleNodes.map((node) => node.position.y));
  const maxY = Math.max(...visibleNodes.map((node) => node.position.y));
  const worldWidth = Math.max(maxX - minX, 320);
  const worldHeight = Math.max(maxY - minY, 320);
  const baseScale = Math.max(
    0.2,
    Math.min((width - 150) / worldWidth, (height - 150) / worldHeight),
  );
  const centreX = (minX + maxX) / 2;
  const centreY = (minY + maxY) / 2;
  const position = (node: GraphNode) => ({
    x: width / 2 + view.x + (node.position.x - centreX) * baseScale * view.zoom,
    y: height / 2 + view.y + (node.position.y - centreY) * baseScale * view.zoom,
  });
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));

  context.lineCap = "round";
  for (const edge of graph.edges) {
    if (
      !presentation.visible.has(edge.source) ||
      !presentation.visible.has(edge.target) ||
      (edge.kind === "bridge" && !presentation.bridges.has(edge.id))
    ) {
      continue;
    }
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) continue;
    const from = position(source);
    const to = position(target);
    context.beginPath();
    context.setLineDash(edge.kind === "bridge" ? [5, 6] : []);
    context.strokeStyle = edge.kind === "bridge" ? "#bdbdb8" : "#5a5a57";
    context.globalAlpha = edge.kind === "bridge" ? 0.48 : 0.72;
    context.lineWidth = edge.kind === "bridge" ? 1.25 : 1;
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }
  context.setLineDash([]);

  const targets: HitTarget[] = [];
  for (const node of visibleNodes) {
    const { x, y } = position(node);
    const radius =
      node.role === "root"
        ? 24
        : node.role === "domain"
          ? 14
          : node.role === "cluster"
            ? 7
            : 4;
    const isDimmed =
      Boolean(presentation.focusDomainId) &&
      node.role === "domain" &&
      node.id !== presentation.focusDomainId;
    context.globalAlpha = presentation.context.has(node.id)
      ? 0.5
      : isDimmed
        ? 0.16
        : 1;
    context.fillStyle =
      node.role === "component"
        ? "#8c8c87"
        : node.role === "cluster"
          ? "#d7d7d2"
          : "#f2f2ee";
    context.strokeStyle = "#ffffff";
    context.lineWidth = presentation.selected.has(node.id) ? 4 : 1.5;
    context.beginPath();
    if (node.role === "root") {
      context.rect(x - 41, y - 22, 82, 44);
    } else {
      context.arc(x, y, radius, 0, Math.PI * 2);
    }
    context.fill();
    context.stroke();

    const lines = wrapGraphLabel(node.label);
    const fontSize =
      node.role === "root"
        ? 13
        : node.role === "domain"
          ? 11
          : node.role === "component"
            ? 8
            : 10;
    const fontWeight = node.role === "root" ? 700 : 600;
    context.font = `${fontWeight} ${fontSize}px Manrope, Arial, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const labelY = node.role === "root" ? y : y + radius + 12;
    lines.forEach((line, index) => {
      const lineY = labelY + index * (fontSize + 2);
      const textWidth = context.measureText(line).width;
      context.fillStyle =
        node.role === "root" ? "#080808" : "rgba(8, 8, 8, 0.82)";
      if (node.role !== "root") {
        context.fillRect(
          x - textWidth / 2 - 3,
          lineY - fontSize / 2 - 2,
          textWidth + 6,
          fontSize + 4,
        );
        context.fillStyle = "#f7f7f4";
      }
      context.fillText(line, x, lineY);
    });
    targets.push({
      node,
      x,
      y,
      radius: node.role === "root" ? 42 : Math.max(radius, 18),
    });
  }
  context.globalAlpha = 1;
  return targets;
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
  const graphCanvas = useRef<HTMLCanvasElement>(null);
  const graphView = useRef<GraphView>({ zoom: 1, x: 0, y: 0 });
  const drawGraph = useRef<() => void>(() => {});
  const hitTargets = useRef<HitTarget[]>([]);
  const drag = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    viewX: number;
    viewY: number;
  } | null>(null);
  const [focus, setFocus] = useState<Focus>({ type: "overview" });
  const [query, setQuery] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [graphStatus, setGraphStatus] = useState<GraphStatus>("fallback");

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

  const graphModel = useMemo(() => buildGraph(model), [model]);
  const graphPresentation = useMemo<GraphPresentation>(() => {
    const visible = new Set<string>([
      ROOT_ID,
      ...model.domains.map((domain) => domain.id),
    ]);
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

    return {
      visible,
      selected,
      context,
      bridges,
      focusDomainId: focusDomain?.id,
    };
  }, [
    clusterById,
    clusterEntries,
    componentById,
    domainById,
    focus,
    model.domains,
    model.relationships,
  ]);

  useEffect(() => {
    graphView.current = { zoom: 1, x: 0, y: 0 };
  }, [focus]);

  useEffect(() => {
    const canvas = graphCanvas.current;
    if (!canvas) return;
    let active = true;
    const draw = () => {
      if (!active) return;
      try {
        const targets = renderGraph(
          canvas,
          graphModel,
          graphPresentation,
          graphView.current,
        );
        hitTargets.current = targets;
        if (targets.length > 0) setGraphStatus("ready");
      } catch {
        hitTargets.current = [];
        setGraphStatus("fallback");
      }
    };
    drawGraph.current = draw;
    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    void document.fonts?.ready.then(draw);
    return () => {
      active = false;
      observer.disconnect();
      drawGraph.current = () => {};
    };
  }, [graphModel, graphPresentation]);

  function handleGraphWheel(event: ReactWheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left - rect.width / 2;
    const localY = event.clientY - rect.top - rect.height / 2;
    const previousZoom = graphView.current.zoom;
    const nextZoom = Math.min(
      2.4,
      Math.max(0.55, previousZoom * Math.exp(-event.deltaY * 0.0015)),
    );
    const ratio = nextZoom / previousZoom;
    graphView.current = {
      zoom: nextZoom,
      x: localX - (localX - graphView.current.x) * ratio,
      y: localY - (localY - graphView.current.y) * ratio,
    };
    drawGraph.current();
  }

  function handleGraphPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      viewX: graphView.current.x,
      viewY: graphView.current.y,
    };
    event.currentTarget.style.cursor = "grabbing";
  }

  function handleGraphPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const currentDrag = drag.current;
    if (currentDrag?.active) {
      const deltaX = event.clientX - currentDrag.startX;
      const deltaY = event.clientY - currentDrag.startY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 4) currentDrag.moved = true;
      graphView.current.x = currentDrag.viewX + deltaX;
      graphView.current.y = currentDrag.viewY + deltaY;
      drawGraph.current();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const overNode = hitTargets.current.some(
      (target) => Math.hypot(target.x - x, target.y - y) <= target.radius,
    );
    event.currentTarget.style.cursor = overNode ? "pointer" : "grab";
  }

  function handleGraphPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.current) drag.current.active = false;
    event.currentTarget.style.cursor = "grab";
  }

  function handleGraphClick(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (drag.current?.moved) {
      drag.current = null;
      return;
    }
    drag.current = null;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const target = hitTargets.current.find(
      (candidate) =>
        Math.hypot(candidate.x - x, candidate.y - y) <= candidate.radius,
    );
    if (!target) return;
    if (target.node.role === "root") commitFocus({ type: "overview" });
    if (target.node.role === "domain") {
      commitFocus({ type: "domain", id: target.node.id });
    }
    if (target.node.role === "cluster") {
      commitFocus({ type: "cluster", id: target.node.id });
    }
    if (target.node.role === "component") {
      commitFocus({ type: "component", id: target.node.id });
    }
  }

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
            <div className={styles.graphStatus} role="status">
              <span>{graphStatusLabels[graphStatus]}</span>
            </div>
            <span className={styles.graphHint}>
              {graphStatus === "ready"
                ? "Scroll to zoom · drag to pan · select a node"
                : "A visual overview remains available"}
            </span>
          </div>
          <div
            aria-hidden="true"
            className={styles.graphFallback}
            data-hidden={graphStatus === "ready"}
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
          <canvas
            aria-hidden="true"
            className={styles.graphCanvas}
            data-renderer="native-canvas"
            data-ready={graphStatus === "ready"}
            onClick={handleGraphClick}
            onPointerDown={handleGraphPointerDown}
            onPointerMove={handleGraphPointerMove}
            onPointerUp={handleGraphPointerUp}
            onPointerCancel={handleGraphPointerUp}
            onWheel={handleGraphWheel}
            ref={graphCanvas}
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
