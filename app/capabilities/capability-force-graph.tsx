"use client";

import { forceCollide, forceX, forceY } from "d3-force";
import type {
  ForceGraphInstance,
  LinkObject,
  NodeObject,
} from "force-graph";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
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
  colour: string;
  domainId?: string;
  parentId?: string;
  anchorX: number;
  anchorY: number;
  baseAnchorX: number;
  baseAnchorY: number;
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

type CapabilityForceGraphProps = {
  className: string;
  focus: CapabilityFocus;
  model: CapabilitySystem;
  onReady: (nodes: number, links: number) => void;
  onSelect: (focus: CapabilityFocus) => void;
};

export type CapabilityForceGraphHandle = {
  arrange: () => void;
  fit: () => void;
  reset: () => void;
};

const ROOT_ID = "agila";

export const DOMAIN_COLOURS: Record<string, string> = {
  "data-ai": "#735BEA",
  transformation: "#B77A16",
  architecture: "#3D7EA6",
  industrial: "#24A6B3",
  "digital-products": "#4C91D1",
  governance: "#C16492",
};

const DOMAIN_ANCHORS: Record<string, { x: number; y: number }> = {
  transformation: { x: -430, y: -250 },
  architecture: { x: 380, y: -270 },
  industrial: { x: 475, y: 20 },
  "data-ai": { x: 350, y: 285 },
  "digital-products": { x: -150, y: 345 },
  governance: { x: -470, y: 95 },
};

function hashUnit(value: string, salt: number) {
  let hash = 2166136261 ^ salt;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

function domainAnchor(id: string, index: number, total: number) {
  const configured = DOMAIN_ANCHORS[id];
  if (configured) {
    return {
      angle: Math.atan2(configured.y, configured.x),
      ...configured,
    };
  }
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  return {
    angle,
    x: Math.cos(angle) * 440,
    y: Math.sin(angle) * 300,
  };
}

function buildPublicGraph(model: CapabilitySystem): PublicGraphModel {
  const nodes: PublicGraphNode[] = [
    {
      id: ROOT_ID,
      label: "Agila",
      role: "root",
      colour: "#F7F7F4",
      anchorX: 0,
      anchorY: 0,
      baseAnchorX: 0,
      baseAnchorY: 0,
      order: 0,
      x: 0,
      y: 0,
    },
  ];
  const links: PublicGraphLink[] = [];

  model.domains.forEach((domain, domainIndex) => {
    const anchor = domainAnchor(domain.id, domainIndex, model.domains.length);
    const colour = DOMAIN_COLOURS[domain.id] ?? "#A9AAA5";
    nodes.push({
      id: domain.id,
      label: domain.title,
      role: "domain",
      colour,
      domainId: domain.id,
      anchorX: anchor.x,
      anchorY: anchor.y,
      baseAnchorX: anchor.x,
      baseAnchorY: anchor.y,
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
        (clusterIndex - (domain.clusters.length - 1) / 2) * 0.48;
      const clusterRadius = 92 + (clusterIndex % 2) * 16;
      const clusterX = anchor.x + Math.cos(localAngle) * clusterRadius;
      const clusterY = anchor.y + Math.sin(localAngle) * clusterRadius;
      nodes.push({
        id: cluster.id,
        label: cluster.title,
        role: "cluster",
        colour,
        domainId: domain.id,
        parentId: domain.id,
        anchorX: clusterX,
        anchorY: clusterY,
        baseAnchorX: clusterX,
        baseAnchorY: clusterY,
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
        const componentRadius = 24 + hashUnit(component.id, 4) * 20;
        const componentX = clusterX + Math.cos(componentAngle) * componentRadius;
        const componentY = clusterY + Math.sin(componentAngle) * componentRadius;
        nodes.push({
          id: component.id,
          label: component.title,
          role: "component",
          colour,
          domainId: domain.id,
          parentId: cluster.id,
          anchorX: clusterX,
          anchorY: clusterY,
          baseAnchorX: clusterX,
          baseAnchorY: clusterY,
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

function connectedNodeIds(graph: PublicGraphModel, nodeId: string | undefined) {
  const connected = new Set<string>();
  if (!nodeId) return connected;
  connected.add(nodeId);
  for (const link of graph.links) {
    const source = endpointId(link.source);
    const target = endpointId(link.target);
    if (source === nodeId) connected.add(target);
    if (target === nodeId) connected.add(source);
  }
  return connected;
}

function nodeRadius(node: PublicGraphNode) {
  if (node.role === "root") return 19;
  if (node.role === "domain") return 22;
  if (node.role === "cluster") return 10;
  return 4.5;
}

function nodeValue(node: PublicGraphNode) {
  return Math.max(0.6, (nodeRadius(node) / 4) ** 2);
}

function colourWithAlpha(colour: string, alpha: number) {
  const red = Number.parseInt(colour.slice(1, 3), 16);
  const green = Number.parseInt(colour.slice(3, 5), 16);
  const blue = Number.parseInt(colour.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
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
    if (node.role === "root") return -860;
    if (node.role === "domain") return -460;
    if (node.role === "cluster") return -145;
    return -27;
  });
  graph.d3Force("link")
    ?.distance?.((link: PublicGraphLink) => {
      if (link.kind === "bridge") return 150;
      const target = typeof link.target === "object" ? link.target : undefined;
      if (target?.role === "domain") return 300;
      if (target?.role === "cluster") return 86;
      return 22;
    })
    ?.strength?.((link: PublicGraphLink) =>
      link.kind === "bridge" ? 0.018 : 0.7,
    );

  graph.d3Force(
    "collide",
    forceCollide<PublicGraphNode>((node) =>
      nodeRadius(node) + (node.role === "component" ? 1.8 : 4),
    )
      .iterations(2) as never,
  );
  const anchorStrength = (node: PublicGraphNode) => {
    if (node.role === "root") return 0.28;
    if (node.role === "domain") return 0.24;
    if (node.role === "cluster") return 0.115;
    return 0.042;
  };
  graph.d3Force(
    "x",
    forceX<PublicGraphNode>((node) => node.anchorX).strength(anchorStrength) as never,
  );
  graph.d3Force(
    "y",
    forceY<PublicGraphNode>((node) => node.anchorY).strength(anchorStrength) as never,
  );
}

function drawNode(
  node: PublicGraphNode,
  context: CanvasRenderingContext2D,
  selected: string | undefined,
  connected: Set<string>,
) {
  const radius = nodeRadius(node);
  const isSelected = selected === node.id;
  const isContext = Boolean(selected && node.role !== "root" && !connected.has(node.id));
  context.save();
  context.globalAlpha = isContext ? 0.28 : node.role === "component" ? 0.92 : 0.98;
  context.beginPath();
  context.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
  context.fillStyle = node.colour;
  context.fill();
  context.lineWidth = isSelected ? 3.2 : node.role === "component" ? 0.9 : 1.6;
  context.strokeStyle = isSelected ? "#ffffff" : "rgba(255,255,255,.38)";
  context.stroke();
  if (node.role === "domain" && !isContext) {
    context.beginPath();
    context.arc(node.x ?? 0, node.y ?? 0, radius + 4, 0, Math.PI * 2);
    context.lineWidth = 1;
    context.strokeStyle = colourWithAlpha(node.colour, 0.58);
    context.stroke();
  }
  if (isSelected) {
    context.beginPath();
    context.arc(node.x ?? 0, node.y ?? 0, radius + 5, 0, Math.PI * 2);
    context.lineWidth = 1.2;
    context.strokeStyle = "rgba(255,255,255,.72)";
    context.stroke();
  }
  context.restore();
}

function linkTouchesSelection(
  link: PublicGraphLink,
  selected: string | undefined,
) {
  if (!selected) return false;
  return endpointId(link.source) === selected || endpointId(link.target) === selected;
}

function graphLinkColour(
  link: PublicGraphLink,
  selected: string | undefined,
) {
  if (selected && !linkTouchesSelection(link, selected)) {
    return "rgba(120,130,143,.045)";
  }
  if (link.kind === "bridge") {
    return selected ? "rgba(241,244,248,.9)" : "rgba(218,223,230,.36)";
  }
  const target = typeof link.target === "object" ? link.target : undefined;
  if (!target) return "rgba(174,176,170,.2)";
  return colourWithAlpha(
    target.colour,
    selected ? 0.82 : target.role === "domain" ? 0.3 : 0.24,
  );
}

function graphLinkWidth(
  link: PublicGraphLink,
  selected: string | undefined,
) {
  if (selected && !linkTouchesSelection(link, selected)) return 0.3;
  if (selected) return 1.9;
  if (link.kind === "bridge") return 0.78;
  const target = typeof link.target === "object" ? link.target : undefined;
  return target?.role === "component" ? 0.58 : 0.76;
}

function labelTier(
  node: PublicGraphNode,
  selected: string | undefined,
  scale: number,
  detail: CapabilityFocus["type"],
) {
  if (node.id === selected) return 5;
  if (node.role === "root" || node.role === "domain") return 4;
  if (node.role === "cluster") return 3;
  if (scale > (detail === "all" ? 0.55 : 1.55)) return 1;
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

export const CapabilityForceGraph = forwardRef<
  CapabilityForceGraphHandle,
  CapabilityForceGraphProps
>(function CapabilityForceGraph(
  { className, focus, model, onReady, onSelect },
  ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const graphInstance = useRef<ForceGraphInstance | null>(null);
  const currentNodes = useRef<PublicGraphNode[]>([]);
  const focusType = useRef(focus.type);
  const fitTimer = useRef<number | undefined>(undefined);
  const selected = useRef<string | undefined>(undefined);
  const connected = useRef(new Set<string>());
  const dragCount = useRef(0);
  const onReadyRef = useRef(onReady);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  focusType.current = focus.type;
  onReadyRef.current = onReady;
  onSelectRef.current = onSelect;

  const graphModel = useMemo(() => buildPublicGraph(model), [model]);
  selected.current = selectedId(focus);
  connected.current = connectedNodeIds(graphModel, selected.current);

  function fitGraph(duration = 500) {
    const graph = graphInstance.current;
    const graphElement = host.current;
    if (!graph || !graphElement) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    graph.zoomToFit(
      reducedMotion ? 1 : duration,
      graphElement.clientWidth < 600 ? 176 : 92,
    );
  }

  useImperativeHandle(ref, () => ({
    arrange() {
      const graph = graphInstance.current;
      if (!graph) return;
      configureForces(graph);
      graph.d3ReheatSimulation();
    },
    fit() {
      fitGraph();
    },
    reset() {
      const graph = graphInstance.current;
      if (!graph) return;
      for (const node of currentNodes.current) {
        node.anchorX = node.baseAnchorX;
        node.anchorY = node.baseAnchorY;
        node.x = node.baseAnchorX + (hashUnit(node.id, 7) - 0.5) * 18;
        node.y = node.baseAnchorY + (hashUnit(node.id, 8) - 0.5) * 18;
        node.vx = 0;
        node.vy = 0;
        node.fx = undefined;
        node.fy = undefined;
      }
      configureForces(graph);
      graph.d3ReheatSimulation();
      window.setTimeout(() => fitGraph(600), 360);
    },
  }));

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
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      graph = createForceGraph()(graphElement)
        .backgroundColor("#070A0F")
        .nodeId("id")
        .nodeRelSize(4)
        .nodeVal((rawNode) => nodeValue(rawNode as PublicGraphNode))
        .nodeCanvasObject((rawNode, context) =>
          drawNode(
            rawNode as PublicGraphNode,
            context,
            selected.current,
            connected.current,
          ),
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
          graphLinkColour(rawLink as PublicGraphLink, selected.current),
        )
        .linkWidth((rawLink) =>
          graphLinkWidth(rawLink as PublicGraphLink, selected.current),
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
        .onNodeHover((rawNode) => {
          if (rawNode) {
            graphElement.setAttribute(
              "data-hovered-node",
              (rawNode as PublicGraphNode).id,
            );
          } else {
            graphElement.removeAttribute("data-hovered-node");
          }
        })
        .onBackgroundClick(() => onSelectRef.current({ type: "overview" }))
        .onNodeDrag(() => {
          graphElement.setAttribute("data-interaction", "node-drag");
        })
        .onNodeDragEnd((rawNode) => {
          const node = rawNode as PublicGraphNode;
          node.anchorX = node.x ?? node.anchorX;
          node.anchorY = node.y ?? node.anchorY;
          dragCount.current += 1;
          graphElement.setAttribute("data-interaction", "idle");
          graphElement.setAttribute("data-last-dragged", node.id);
          graphElement.setAttribute("data-drag-count", String(dragCount.current));
        })
        .onRenderFramePost((context, scale) => {
          const width = graphElement.clientWidth;
          const height = graphElement.clientHeight;
          const candidates = currentNodes.current
            .filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y))
            .map((node) => ({
              node,
              tier:
                (selected.current &&
                  node.role !== "root" &&
                  !connected.current.has(node.id)) ||
                (width < 600 &&
                  node.role === "cluster" &&
                  node.id !== selected.current)
                  ? 0
                  : labelTier(
                      node,
                      selected.current,
                      scale,
                      focusType.current,
                    ),
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
            width < 600 ? 8 : focusType.current === "all" ? 76 : 58;
          context.save();
          context.textAlign = "center";
          context.textBaseline = "middle";
          for (const { node, tier, screen } of candidates) {
            if (placed.length >= maxLabels) break;
            const fontSize =
              tier >= 4
                ? width < 600
                  ? 12.5
                  : 15
                : tier === 3
                  ? 11.5
                  : 9.5;
            const graphFontSize = fontSize / scale;
            context.font = `${tier >= 3 ? 700 : 600} ${graphFontSize}px Manrope, Arial, sans-serif`;
            const lines = wrapLabel(
              node.label,
              width < 600 ? 16 : node.role === "domain" ? 34 : 30,
              node.role === "domain" ? (width < 600 ? 4 : 2) : 2,
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
            context.strokeStyle = "rgba(7,10,15,.96)";
            lines.forEach((line, index) => {
              const graphY = firstGraphY + (index * lineHeight) / scale;
              context.strokeText(line, node.x ?? 0, graphY);
              context.fillStyle = tier >= 4 ? "#ffffff" : "#e4e4df";
              context.fillText(line, node.x ?? 0, graphY);
            });
          }
          context.restore();
        })
        .autoPauseRedraw(false)
        .enableNodeDrag(true)
        .enablePanInteraction(true)
        .enablePointerInteraction(true)
        .enableZoomInteraction(true)
        .d3AlphaDecay(reducedMotion ? 0.0228 : 0.008)
        .d3VelocityDecay(0.36)
        .warmupTicks(reducedMotion ? 300 : 70)
        .cooldownTicks(Infinity)
        .cooldownTime(45_000)
        .minZoom(0.2)
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
    const nodes = graphModel.nodes.map((node) => ({
      ...node,
      ...previous.get(node.id),
    }));
    const links = graphModel.links.map((link) => ({
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
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    fitTimer.current = window.setTimeout(
      () => fitGraph(reducedMotion ? 0 : 620),
      reducedMotion ? 40 : 460,
    );
  }, [engineReady, graphModel]);

  useEffect(() => {
    const graph = graphInstance.current;
    if (!graph || !engineReady) return;
    graph
      .nodeCanvasObject((rawNode, context) =>
        drawNode(
          rawNode as PublicGraphNode,
          context,
          selected.current,
          connected.current,
        ),
      )
      .linkColor((rawLink) =>
        graphLinkColour(rawLink as PublicGraphLink, selected.current),
      )
      .linkWidth((rawLink) =>
        graphLinkWidth(rawLink as PublicGraphLink, selected.current),
      );

    const activeNode = selected.current
      ? currentNodes.current.find((node) => node.id === selected.current)
      : undefined;
    if (activeNode && Number.isFinite(activeNode.x) && Number.isFinite(activeNode.y)) {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      graph.centerAt(
        activeNode.x,
        activeNode.y,
        reducedMotion ? 1 : 420,
      );
      const minimumZoom = activeNode.role === "domain" ? 1.12 : 1.38;
      if (graph.zoom() < minimumZoom) {
        graph.zoom(minimumZoom, reducedMotion ? 1 : 420);
      }
    }
  }, [engineReady, focus, graphModel]);

  return (
    <div
      aria-label={`Interactive Agila capability force graph showing ${graphModel.nodes.length} nodes and ${graphModel.links.length} connections.`}
      className={className}
      data-drag-count="0"
      data-interaction="idle"
      data-link-count={graphModel.links.length}
      data-colour-mode="domain"
      data-layout="clustered-islands"
      data-node-count={graphModel.nodes.length}
      data-node-drag="enabled"
      data-ready={ready}
      data-renderer="force-graph"
      ref={host}
      role="img"
    />
  );
});
