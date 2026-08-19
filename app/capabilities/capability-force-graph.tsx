"use client";

import { forceCollide } from "d3-force";
import type {
  ForceGraphInstance,
  LinkObject,
  NodeObject,
} from "force-graph";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CapabilitySystem } from "./ontology-types";

export type CapabilityFocus =
  | { type: "overview" }
  | { type: "all" }
  | { type: "domain"; id: string }
  | { type: "cluster"; id: string }
  | { type: "component"; id: string };

type PublicGraphNode = NodeObject & {
  id: string;
  label: string;
  role: "root" | "domain" | "cluster" | "component";
  domainId?: string;
  parentId?: string;
  anchorX: number;
  anchorY: number;
  order: number;
};

type PublicGraphLink = LinkObject & {
  id: string;
  source: string | PublicGraphNode;
  target: string | PublicGraphNode;
  kind: "hierarchy" | "bridge";
  label: string;
};

type PublicGraphModel = {
  nodes: PublicGraphNode[];
  links: PublicGraphLink[];
  nodeById: Map<string, PublicGraphNode>;
};

type VisibleGraph = {
  nodes: PublicGraphNode[];
  links: PublicGraphLink[];
  selectedId?: string;
};

type CapabilityForceGraphProps = {
  className: string;
  focus: CapabilityFocus;
  model: CapabilitySystem;
  onReady: (nodes: number, links: number) => void;
  onSelect: (focus: CapabilityFocus) => void;
};

const ROOT_ID = "agila";
const DOMAIN_RADIUS = 330;
const DOMAIN_START_ANGLE = -Math.PI / 2;

function hashUnit(value: string, salt: number) {
  let hash = 2166136261 ^ salt;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

function domainAnchor(index: number, total: number) {
  const angle = DOMAIN_START_ANGLE + (index / total) * Math.PI * 2;
  return {
    angle,
    x: Math.cos(angle) * DOMAIN_RADIUS,
    y: Math.sin(angle) * DOMAIN_RADIUS,
  };
}

function buildPublicGraph(model: CapabilitySystem): PublicGraphModel {
  const nodes: PublicGraphNode[] = [
    {
      id: ROOT_ID,
      label: "Agila",
      role: "root",
      anchorX: 0,
      anchorY: 0,
      order: 0,
      x: 0,
      y: 0,
    },
  ];
  const links: PublicGraphLink[] = [];

  model.domains.forEach((domain, domainIndex) => {
    const anchor = domainAnchor(domainIndex, model.domains.length);
    nodes.push({
      id: domain.id,
      label: domain.title,
      role: "domain",
      domainId: domain.id,
      anchorX: anchor.x,
      anchorY: anchor.y,
      order: domain.order,
      x: anchor.x,
      y: anchor.y,
    });
    links.push({
      id: `hierarchy-${ROOT_ID}-${domain.id}`,
      source: ROOT_ID,
      target: domain.id,
      kind: "hierarchy",
      label: "capability domain",
    });

    domain.clusters.forEach((cluster, clusterIndex) => {
      const localAngle =
        anchor.angle +
        (clusterIndex - (domain.clusters.length - 1) / 2) * 0.24;
      const clusterX = anchor.x + Math.cos(localAngle) * 112;
      const clusterY = anchor.y + Math.sin(localAngle) * 112;
      nodes.push({
        id: cluster.id,
        label: cluster.title,
        role: "cluster",
        domainId: domain.id,
        parentId: domain.id,
        anchorX: clusterX,
        anchorY: clusterY,
        order: cluster.order,
        x: clusterX + (hashUnit(cluster.id, 1) - 0.5) * 22,
        y: clusterY + (hashUnit(cluster.id, 2) - 0.5) * 22,
      });
      links.push({
        id: `hierarchy-${domain.id}-${cluster.id}`,
        source: domain.id,
        target: cluster.id,
        kind: "hierarchy",
        label: "capability area",
      });

      cluster.components.forEach((component, componentIndex) => {
        const componentAngle =
          (componentIndex / cluster.components.length) * Math.PI * 2 +
          hashUnit(component.id, 3) * 0.3;
        const componentRadius = 34 + hashUnit(component.id, 4) * 20;
        const componentX = clusterX + Math.cos(componentAngle) * componentRadius;
        const componentY = clusterY + Math.sin(componentAngle) * componentRadius;
        nodes.push({
          id: component.id,
          label: component.title,
          role: "component",
          domainId: domain.id,
          parentId: cluster.id,
          anchorX: clusterX,
          anchorY: clusterY,
          order: component.order,
          x: componentX,
          y: componentY,
        });
        links.push({
          id: `hierarchy-${cluster.id}-${component.id}`,
          source: cluster.id,
          target: component.id,
          kind: "hierarchy",
          label: "component capability",
        });
      });
    });
  });

  for (const relationship of model.relationships) {
    links.push({
      id: relationship.id,
      source: relationship.source,
      target: relationship.target,
      kind: "bridge",
      label: relationship.label,
    });
  }

  return {
    nodes,
    links,
    nodeById: new Map(nodes.map((node) => [node.id, node])),
  };
}

function endpointId(endpoint: string | PublicGraphNode) {
  return typeof endpoint === "object" ? endpoint.id : endpoint;
}

function selectedId(focus: CapabilityFocus) {
  return focus.type === "overview" || focus.type === "all" ? undefined : focus.id;
}

function visiblePublicGraph(
  graph: PublicGraphModel,
  model: CapabilitySystem,
  focus: CapabilityFocus,
): VisibleGraph {
  const visible = new Set<string>([
    ROOT_ID,
    ...model.domains.map((domain) => domain.id),
  ]);
  const bridgeIds = new Set<string>();
  const selected = selectedId(focus);
  const selectedNode = selected ? graph.nodeById.get(selected) : undefined;
  const selectedDomainId = selectedNode?.domainId ??
    (selectedNode?.role === "domain" ? selectedNode.id : undefined);
  const selectedClusterId = selectedNode?.role === "cluster"
    ? selectedNode.id
    : selectedNode?.role === "component"
      ? selectedNode.parentId
      : undefined;

  if (focus.type === "overview") {
    graph.nodes
      .filter((node) => node.role === "cluster")
      .forEach((node) => visible.add(node.id));
    model.relationships.forEach((relationship) => bridgeIds.add(relationship.id));
  } else if (focus.type === "all") {
    graph.nodes.forEach((node) => visible.add(node.id));
    model.relationships.forEach((relationship) => bridgeIds.add(relationship.id));
  } else if (selectedDomainId) {
    graph.nodes
      .filter(
        (node) =>
          node.domainId === selectedDomainId &&
          (node.role !== "component" || !selectedClusterId || node.parentId === selectedClusterId),
      )
      .forEach((node) => visible.add(node.id));

    const localAreaIds = new Set(
      graph.nodes
        .filter(
          (node) => node.domainId === selectedDomainId && node.role === "cluster",
        )
        .map((node) => node.id),
    );
    for (const relationship of model.relationships) {
      if (
        localAreaIds.has(relationship.source) ||
        localAreaIds.has(relationship.target)
      ) {
        visible.add(relationship.source);
        visible.add(relationship.target);
        bridgeIds.add(relationship.id);
      }
    }
  }

  const nodes = graph.nodes.filter((node) => visible.has(node.id));
  const links = graph.links.filter((link) => {
    const source = endpointId(link.source);
    const target = endpointId(link.target);
    return (
      visible.has(source) &&
      visible.has(target) &&
      (link.kind === "hierarchy" || bridgeIds.has(link.id))
    );
  });
  return { nodes, links, selectedId: selected };
}

function nodeRadius(node: PublicGraphNode) {
  if (node.role === "root") return 24;
  if (node.role === "domain") return 18;
  if (node.role === "cluster") return 9;
  return 4.2;
}

function nodeValue(node: PublicGraphNode) {
  return Math.max(0.6, (nodeRadius(node) / 4) ** 2);
}

function nodeFill(node: PublicGraphNode) {
  if (node.role === "root") return "#f7f7f4";
  if (node.role === "domain") return "#deded8";
  if (node.role === "cluster") return "#a9aaa5";
  return "#676964";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function configureForces(graph: ForceGraphInstance) {
  graph.d3Force("charge")?.strength?.((node: PublicGraphNode) => {
    if (node.role === "root") return -600;
    if (node.role === "domain") return -340;
    if (node.role === "cluster") return -115;
    return -24;
  });
  graph.d3Force("link")
    ?.distance?.((link: PublicGraphLink) => {
      if (link.kind === "bridge") return 120;
      const target = typeof link.target === "object" ? link.target : undefined;
      if (target?.role === "domain") return 230;
      if (target?.role === "cluster") return 72;
      return 24;
    })
    ?.strength?.((link: PublicGraphLink) =>
      link.kind === "bridge" ? 0.035 : 0.62,
    );

  graph.d3Force(
    "collide",
    forceCollide<PublicGraphNode>((node) => nodeRadius(node) + 4)
      .iterations(2) as never,
  );

  let anchoredNodes: PublicGraphNode[] = [];
  const anchorForce = ((alpha: number) => {
    for (const node of anchoredNodes) {
      const strength =
        node.role === "root"
          ? 0.3
          : node.role === "domain"
            ? 0.19
            : node.role === "cluster"
              ? 0.09
              : 0.025;
      node.vx = (node.vx ?? 0) + (node.anchorX - (node.x ?? 0)) * strength * alpha;
      node.vy = (node.vy ?? 0) + (node.anchorY - (node.y ?? 0)) * strength * alpha;
    }
  }) as ((alpha: number) => void) & {
    initialize: (nodes: NodeObject[]) => void;
  };
  anchorForce.initialize = (nodes) => {
    anchoredNodes = nodes as PublicGraphNode[];
  };
  graph.d3Force("domain-anchor", anchorForce);
}

function drawNode(
  node: PublicGraphNode,
  context: CanvasRenderingContext2D,
  selected: string | undefined,
) {
  const radius = nodeRadius(node);
  const isSelected = selected === node.id;
  context.save();
  context.beginPath();
  context.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
  context.fillStyle = nodeFill(node);
  context.fill();
  context.lineWidth = isSelected ? 3.2 : node.role === "component" ? 0.8 : 1.4;
  context.strokeStyle = isSelected ? "#ffffff" : "rgba(255,255,255,.42)";
  context.stroke();
  if (isSelected) {
    context.beginPath();
    context.arc(node.x ?? 0, node.y ?? 0, radius + 5, 0, Math.PI * 2);
    context.lineWidth = 1.2;
    context.strokeStyle = "rgba(255,255,255,.72)";
    context.stroke();
  }
  context.restore();
}

function labelTier(node: PublicGraphNode, selected: string | undefined, scale: number) {
  if (node.id === selected) return 5;
  if (node.role === "root" || node.role === "domain") return 4;
  if (node.role === "cluster") return 3;
  if (scale > 1.55) return 1;
  return 0;
}

function wrapLabel(label: string, maxCharacters: number, maxLines: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of label.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || candidate.length <= maxCharacters) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  const lastIndex = visible.length - 1;
  visible[lastIndex] = `${visible[lastIndex].slice(0, maxCharacters - 1)}…`;
  return visible;
}

export function CapabilityForceGraph({
  className,
  focus,
  model,
  onReady,
  onSelect,
}: CapabilityForceGraphProps) {
  const host = useRef<HTMLDivElement>(null);
  const graphInstance = useRef<ForceGraphInstance | null>(null);
  const currentNodes = useRef<PublicGraphNode[]>([]);
  const focusType = useRef(focus.type);
  const fitTimer = useRef<number | undefined>(undefined);
  const selected = useRef<string | undefined>(undefined);
  const onReadyRef = useRef(onReady);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  focusType.current = focus.type;
  onReadyRef.current = onReady;
  onSelectRef.current = onSelect;

  const graphModel = useMemo(() => buildPublicGraph(model), [model]);
  const presentation = useMemo(
    () => visiblePublicGraph(graphModel, model, focus),
    [focus, graphModel, model],
  );
  selected.current = presentation.selectedId;

  useEffect(() => {
    if (!host.current) return;
    const graphElement: HTMLDivElement = host.current;
    let graph: ForceGraphInstance | undefined;
    let observer: ResizeObserver | undefined;
    let cancelled = false;
    setReady(false);
    setEngineReady(false);

    async function initialise() {
      const { default: createForceGraph } = await import("force-graph");
      if (cancelled) return;
      graph = createForceGraph()(graphElement)
        .backgroundColor("#080808")
        .nodeId("id")
        .nodeRelSize(4)
        .nodeVal((rawNode) => nodeValue(rawNode as PublicGraphNode))
        .nodeCanvasObject((rawNode, context) =>
          drawNode(rawNode as PublicGraphNode, context, selected.current),
        )
        .nodePointerAreaPaint((rawNode, colour, context) => {
          const node = rawNode as PublicGraphNode;
          context.fillStyle = colour;
          context.beginPath();
          context.arc(
            node.x ?? 0,
            node.y ?? 0,
            nodeRadius(node) + 5,
            0,
            Math.PI * 2,
          );
          context.fill();
        })
        .nodeLabel((rawNode) => {
          const node = rawNode as PublicGraphNode;
          const role =
            node.role === "cluster"
              ? "Capability area"
              : node.role === "component"
                ? "Component capability"
                : node.role === "domain"
                  ? "Capability domain"
                  : "Capability system";
          return `<div class="agila-graph-tooltip"><strong>${escapeHtml(node.label)}</strong><span>${role}</span></div>`;
        })
        .linkColor((rawLink) =>
          (rawLink as PublicGraphLink).kind === "bridge"
            ? "rgba(220,220,214,.46)"
            : "rgba(174,176,170,.22)",
        )
        .linkWidth((rawLink) =>
          (rawLink as PublicGraphLink).kind === "bridge" ? 1.05 : 0.72,
        )
        .linkLineDash((rawLink) =>
          (rawLink as PublicGraphLink).kind === "bridge" ? [5, 6] : null,
        )
        .linkDirectionalArrowLength((rawLink) =>
          (rawLink as PublicGraphLink).kind === "bridge" ? 2.8 : 0,
        )
        .linkDirectionalArrowRelPos(0.75)
        .linkLabel((rawLink) => escapeHtml((rawLink as PublicGraphLink).label))
        .onNodeClick((rawNode) => {
          const node = rawNode as PublicGraphNode;
          if (node.role === "root") onSelectRef.current({ type: "overview" });
          else onSelectRef.current({ type: node.role, id: node.id });
        })
        .onRenderFramePost((context, scale) => {
          const width = graphElement.clientWidth;
          const height = graphElement.clientHeight;
          const candidates = currentNodes.current
            .filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y))
            .map((node) => ({
              node,
              tier:
                width < 600 &&
                node.role === "cluster" &&
                node.id !== selected.current
                  ? 0
                  : labelTier(node, selected.current, scale),
              screen: graph?.graph2ScreenCoords(node.x ?? 0, node.y ?? 0) ?? {
                x: 0,
                y: 0,
              },
            }))
            .filter(
              ({ tier, screen }) =>
                tier > 0 &&
                screen.x > -100 &&
                screen.x < width + 100 &&
                screen.y > 0 &&
                screen.y < height + 70,
            )
            .sort(
              (left, right) =>
                right.tier - left.tier ||
                left.node.order - right.node.order ||
                left.node.label.localeCompare(right.node.label),
            );
          const placed: Array<{
            x: number;
            y: number;
            width: number;
            height: number;
          }> = [];
          const maxLabels =
            width < 600 ? 7 : focusType.current === "all" ? 58 : 42;
          context.save();
          context.textAlign = "center";
          context.textBaseline = "middle";
          for (const { node, tier, screen } of candidates) {
            if (placed.length >= maxLabels) break;
            const fontSize = tier >= 4 ? 12 : tier === 3 ? 10.5 : 9;
            const graphFontSize = fontSize / scale;
            context.font = `${tier >= 4 ? 700 : 600} ${graphFontSize}px Manrope, Arial, sans-serif`;
            const lines = wrapLabel(
              node.label,
              width < 600 ? 20 : node.role === "domain" ? 30 : 34,
              node.role === "domain" ? (width < 600 ? 3 : 2) : 2,
            );
            const lineHeight = fontSize + 2;
            const widthOnScreen =
              Math.max(
                ...lines.map((line) => context.measureText(line).width),
              ) * scale;
            const heightOnScreen = lines.length * lineHeight + 4;
            const centreY =
              screen.y - nodeRadius(node) * scale - heightOnScreen / 2 - 4;
            const rect = {
              x: screen.x - widthOnScreen / 2 - 4,
              y: centreY - heightOnScreen / 2,
              width: widthOnScreen + 8,
              height: heightOnScreen,
            };
            const overlaps = placed.some(
              (other) =>
                !(
                  rect.x > other.x + other.width ||
                  rect.x + rect.width < other.x ||
                  rect.y > other.y + other.height ||
                  rect.y + rect.height < other.y
                ),
            );
            if (overlaps && tier < 5) continue;
            placed.push(rect);
            const firstGraphY =
              (node.y ?? 0) -
              nodeRadius(node) -
              (heightOnScreen - lineHeight / 2) / scale;
            context.lineWidth = 3.4 / scale;
            context.strokeStyle = "rgba(8,8,8,.94)";
            lines.forEach((line, index) => {
              const graphY = firstGraphY + (index * lineHeight) / scale;
              context.strokeText(line, node.x ?? 0, graphY);
              context.fillStyle = tier >= 4 ? "#ffffff" : "#e4e4df";
              context.fillText(line, node.x ?? 0, graphY);
            });
          }
          context.restore();
        })
        .warmupTicks(60)
        .cooldownTicks(220)
        .minZoom(0.35)
        .maxZoom(4.5);

      configureForces(graph);
      graphInstance.current = graph;
      const resize = () => {
        graph?.width(graphElement.clientWidth).height(graphElement.clientHeight);
      };
      observer = new ResizeObserver(resize);
      observer.observe(graphElement);
      resize();
      setEngineReady(true);
    }
    void initialise();

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (fitTimer.current) window.clearTimeout(fitTimer.current);
      graph?._destructor();
      graphInstance.current = null;
    };
  }, [graphModel]);

  useEffect(() => {
    const graph = graphInstance.current;
    if (!graph || !engineReady) return;
    const previous = new Map(
      currentNodes.current.map((node) => [
        node.id,
        { x: node.x, y: node.y, vx: node.vx, vy: node.vy },
      ]),
    );
    const nodes = presentation.nodes.map((node) => ({
      ...node,
      ...previous.get(node.id),
    }));
    const links = presentation.links.map((link) => ({
      ...link,
      source: endpointId(link.source),
      target: endpointId(link.target),
    }));
    currentNodes.current = nodes;
    graph.graphData({ nodes, links });
    configureForces(graph);
    graph.d3ReheatSimulation();
    host.current?.setAttribute("data-node-count", String(nodes.length));
    host.current?.setAttribute("data-link-count", String(links.length));
    setReady(true);
    onReadyRef.current(nodes.length, links.length);
    if (fitTimer.current) window.clearTimeout(fitTimer.current);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fitTimer.current = window.setTimeout(
      () =>
        graph.zoomToFit(
          reducedMotion ? 0 : 500,
          host.current && host.current.clientWidth < 600
            ? 110
            : focus.type === "all"
              ? 70
              : 92,
        ),
      reducedMotion ? 40 : 420,
    );
  }, [engineReady, focus, presentation]);

  return (
    <div
      aria-label={`Interactive Agila capability force graph showing ${presentation.nodes.length} nodes and ${presentation.links.length} connections.`}
      className={className}
      data-link-count={presentation.links.length}
      data-node-count={presentation.nodes.length}
      data-ready={ready}
      data-renderer="force-graph"
      ref={host}
      role="img"
    />
  );
}
