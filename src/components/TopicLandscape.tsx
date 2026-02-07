"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { RadarItem, Cluster } from "../types";

// ── Cluster colors ──────────────────────────────────────────────
const CLUSTER_COLORS: Record<string, string> = {
  trust: "#6366f1",
  teamwork: "#2563eb",
  delegation: "#0891b2",
  communication: "#059669",
  learning: "#d97706",
  ethics: "#dc2626",
  creativity: "#7c3aed",
};

// ── Geometry helpers ────────────────────────────────────────────

function cross(O: [number, number], A: [number, number], B: [number, number]) {
  return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
}

function convexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 2) return [...points];
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (const p of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function expandHull(hull: [number, number][], pad: number): [number, number][] {
  if (hull.length < 3) return hull;
  const expanded: [number, number][] = [];
  const n = hull.length;
  for (let i = 0; i < n; i++) {
    const prev = hull[(i - 1 + n) % n];
    const curr = hull[i];
    const next = hull[(i + 1) % n];
    const dx1 = curr[0] - prev[0], dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0], dy2 = next[1] - curr[1];
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
    const nx1 = -dy1 / len1, ny1 = dx1 / len1;
    const nx2 = -dy2 / len2, ny2 = dx2 / len2;
    let nx = nx1 + nx2, ny = ny1 + ny2;
    const nLen = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= nLen;
    ny /= nLen;
    expanded.push([curr[0] + nx * pad, curr[1] + ny * pad]);
  }
  return convexHull(expanded);
}

function catmullRomPath(points: [number, number][], alpha = 0.35): string {
  if (points.length < 3) return "";
  const n = points.length;
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const cp1x = p1[0] + (p2[0] - p0[0]) * alpha;
    const cp1y = p1[1] + (p2[1] - p0[1]) * alpha;
    const cp2x = p2[0] - (p3[0] - p1[0]) * alpha;
    const cp2y = p2[1] - (p3[1] - p1[1]) * alpha;
    d += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  return d + "Z";
}

// ── Point-in-polygon (ray-casting) ─────────────────────────────

function pointInPolygon(pt: [number, number], poly: [number, number][]): boolean {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    if (
      ((yi > pt[1]) !== (yj > pt[1])) &&
      (pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi)
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** Synthesize polygon points around a circle (for hit-testing small clusters) */
function circlePoints(cx: number, cy: number, r: number, n = 12): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

// ── Overlap relaxation ──────────────────────────────────────────

function relaxPositions(
  items: RadarItem[],
  minDist = 16,
  iterations = 4,
  maxShift = 4
): Map<string, [number, number]> {
  const pos = new Map<string, [number, number]>();
  items.forEach((item) => pos.set(item.id, [...item.embedding] as [number, number]));
  const clusterGroups = new Map<string, string[]>();
  items.forEach((item) => {
    const group = clusterGroups.get(item.cluster) || [];
    group.push(item.id);
    clusterGroups.set(item.cluster, group);
  });
  for (let iter = 0; iter < iterations; iter++) {
    for (const [, ids] of clusterGroups) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = pos.get(ids[i])!;
          const b = pos.get(ids[j])!;
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist && dist > 0.01) {
            const shift = Math.min((minDist - dist) / 2, maxShift);
            const ux = dx / dist;
            const uy = dy / dist;
            a[0] -= ux * shift;
            a[1] -= uy * shift;
            b[0] += ux * shift;
            b[1] += uy * shift;
          }
        }
      }
    }
  }
  return pos;
}

// ── Visual encoding helpers ─────────────────────────────────────

function nodeRadius(item: RadarItem): number {
  return item.tags?.includes("emerging") ? 6 : 4.5;
}

function yearOpacity(year: number): number {
  if (year >= 2024) return 0.92;
  if (year >= 2022) return 0.78;
  return 0.60;
}

// ── Component ───────────────────────────────────────────────────

interface TopicLandscapeProps {
  items: RadarItem[];
  clusters: Cluster[];
  visibleItemIds: Set<string>;
  selectedItem: RadarItem | null;
  onItemClick: (item: RadarItem) => void;
  clusterAnchors: Record<string, [number, number]>;
}

export default function TopicLandscape({
  items,
  clusters,
  visibleItemIds,
  selectedItem,
  onItemClick,
}: TopicLandscapeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredItem, setHoveredItem] = useState<RadarItem | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: -50, y: -30, w: 1100, h: 760 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // ── Relaxed positions (once) ──
  const relaxedPositions = useMemo(() => relaxPositions(items), [items]);

  // ── Pad hull computation ──
  const clusterPads = useMemo(() => {
    const grouped = new Map<string, { points: [number, number][]; ids: string[] }>();
    items.forEach((item) => {
      const pos = relaxedPositions.get(item.id) || item.embedding;
      const g = grouped.get(item.cluster) || { points: [], ids: [] };
      g.points.push(pos);
      g.ids.push(item.id);
      grouped.set(item.cluster, g);
    });

    const pads: {
      clusterId: string;
      padPath: string;
      hullPoints: [number, number][];
      color: string;
      centroid: [number, number];
      count: number;
      label: string;
    }[] = [];

    for (const [clusterId, { points, ids }] of grouped) {
      const color = CLUSTER_COLORS[clusterId] || "#888";
      const clusterInfo = clusters.find((c) => c.id === clusterId);
      const label = clusterInfo?.label || clusterId;

      const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
      const cy = points.reduce((s, p) => s + p[1], 0) / points.length;

      if (points.length < 3) {
        const r = 55;
        const fallbackPath =
          points.length === 1
            ? `M ${points[0][0] - r} ${points[0][1]} A ${r} ${r} 0 1 1 ${points[0][0] + r} ${points[0][1]} A ${r} ${r} 0 1 1 ${points[0][0] - r} ${points[0][1]} Z`
            : (() => {
                const mx = (points[0][0] + points[1][0]) / 2;
                const my = (points[0][1] + points[1][1]) / 2;
                return `M ${mx - r} ${my - r} L ${mx + r} ${my - r} A ${r} ${r} 0 0 1 ${mx + r} ${my + r} L ${mx - r} ${my + r} A ${r} ${r} 0 0 1 ${mx - r} ${my - r} Z`;
              })();
        // Synthesize hit-test polygon for small clusters
        const hitPoly = circlePoints(cx, cy, r, 12);
        pads.push({
          clusterId,
          padPath: fallbackPath,
          hullPoints: hitPoly,
          color,
          centroid: [cx, cy],
          count: ids.length,
          label,
        });
        continue;
      }

      const hull = convexHull(points);
      const expanded = expandHull(hull, 40);
      const pathD = catmullRomPath(expanded);

      pads.push({
        clusterId,
        padPath: pathD,
        hullPoints: expanded,
        color,
        centroid: [cx, cy],
        count: ids.length,
        label,
      });
    }

    return pads;
  }, [items, clusters, relaxedPositions]);

  // ── Cluster visibility for filter-responsive labels ──
  const clusterVisibility = useMemo(() => {
    const vis = new Map<string, { visible: number; total: number }>();
    const hasFiltersLocal = visibleItemIds.size > 0;
    items.forEach((item) => {
      const entry = vis.get(item.cluster) || { visible: 0, total: 0 };
      entry.total++;
      if (!hasFiltersLocal || visibleItemIds.has(item.id)) entry.visible++;
      vis.set(item.cluster, entry);
    });
    return vis;
  }, [items, visibleItemIds]);

  const hasFilters = visibleItemIds.size > 0;

  // ── SVG coordinate conversion ──
  const svgPointFromClient = useCallback(
    (clientX: number, clientY: number): [number, number] | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
      const y = ((clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
      return [x, y];
    },
    [viewBox]
  );

  // ── Zoom & pan ──

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.08 : 0.92;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
      const my = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
      setViewBox({
        x: mx - (mx - viewBox.x) * factor,
        y: my - (my - viewBox.y) * factor,
        w: viewBox.w * factor,
        h: viewBox.h * factor,
      });
    },
    [viewBox]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Pad hover detection (only when not panning)
      if (!isPanning.current) {
        const svgPt = svgPointFromClient(e.clientX, e.clientY);
        if (svgPt) {
          let found: string | null = null;
          for (const h of clusterPads) {
            if (pointInPolygon(svgPt, h.hullPoints)) {
              found = h.clusterId;
              break;
            }
          }
          setHoveredCluster((prev) => (prev === found ? prev : found));
        }
      }

      // Pan logic
      if (!isPanning.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = ((e.clientX - panStart.current.x) / rect.width) * viewBox.w;
      const dy = ((e.clientY - panStart.current.y) / rect.height) * viewBox.h;
      setViewBox((prev) => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
      panStart.current = { x: e.clientX, y: e.clientY };
    },
    [viewBox.w, viewBox.h, svgPointFromClient, clusterPads]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  useEffect(() => {
    const up = () => { isPanning.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full"
        style={{ cursor: isPanning.current ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* ══════════ DEFS ══════════ */}
        <defs>
          {/* Pad radial gradient per cluster (center-bright, edge-fade) */}
          {clusterPads.map((h) => (
            <radialGradient
              key={`pad-grad-${h.clusterId}`}
              id={`pad-grad-${h.clusterId}`}
              cx="50%" cy="45%" r="55%" fx="50%" fy="45%"
            >
              <stop offset="0%" stopColor={h.color} stopOpacity={0.28} />
              <stop offset="60%" stopColor={h.color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={h.color} stopOpacity={0.12} />
            </radialGradient>
          ))}

          {/* Dot-grid background pattern */}
          <pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.6" fill="var(--foreground)" opacity="0.035" />
          </pattern>

          {/* Pad soft shadow */}
          <filter id="pad-shadow" x="-20%" y="-15%" width="140%" height="145%">
            <feDropShadow dx="0" dy="4" stdDeviation="16" floodColor="#000" floodOpacity="0.08" />
          </filter>

          {/* Pad hover glow */}
          <filter id="pad-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur" />
            <feFlood floodOpacity="0.12" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node micro-shadow */}
          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
          </filter>

          {/* Node hover ring glow */}
          <filter id="node-hover-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {/* ══════════ LAYER 0: Background texture ══════════ */}
        <rect
          x={-50} y={-30} width={1100} height={760}
          fill="url(#dot-grid)"
          className="pointer-events-none"
        />

        {/* ══════════ LAYER 1a: Cluster Pads ══════════ */}
        {clusterPads.map((h) => {
          const isHoveredPad = hoveredCluster === h.clusterId;
          const isActivePad = selectedItem?.cluster === h.clusterId;
          const isFadedPad = hoveredCluster !== null && !isHoveredPad;
          const cv = clusterVisibility.get(h.clusterId);
          const dimmed = hasFilters && cv && cv.visible === 0;

          return (
            <path
              key={`pad-${h.clusterId}`}
              className="cluster-pad"
              d={h.padPath}
              fill={`url(#pad-grad-${h.clusterId})`}
              filter={isHoveredPad ? "url(#pad-glow)" : "url(#pad-shadow)"}
              opacity={dimmed ? 0.2 : isFadedPad ? 0.35 : 1}
              style={{
                transform: isHoveredPad
                  ? "scale(1.04)"
                  : isActivePad
                    ? "scale(1.03)"
                    : "scale(1)",
                transformOrigin: `${h.centroid[0]}px ${h.centroid[1]}px`,
              }}
              pointerEvents="none"
            />
          );
        })}

        {/* ══════════ LAYER 1b: Inner glow overlay (pressed state) ══════════ */}
        {clusterPads.map((h) => {
          const isActivePad = selectedItem?.cluster === h.clusterId;
          if (!isActivePad) return null;
          return (
            <path
              key={`pad-glow-${h.clusterId}`}
              className="cluster-pad-inner-glow"
              d={h.padPath}
              fill={h.color}
              fillOpacity={0.06}
              stroke={h.color}
              strokeOpacity={0.15}
              strokeWidth={1.5}
              pointerEvents="none"
            />
          );
        })}

        {/* ══════════ LAYER 2: Connection lines (selected node) ══════════ */}
        {selectedItem &&
          items
            .filter(
              (i) => i.cluster === selectedItem.cluster && i.id !== selectedItem.id
            )
            .map((sibling) => {
              const selPos = relaxedPositions.get(selectedItem.id)!;
              const sibPos = relaxedPositions.get(sibling.id)!;
              return (
                <line
                  key={`conn-${sibling.id}`}
                  x1={selPos[0]}
                  y1={selPos[1]}
                  x2={sibPos[0]}
                  y2={sibPos[1]}
                  stroke={CLUSTER_COLORS[selectedItem.cluster] || "#888"}
                  strokeOpacity={0.15}
                  strokeWidth={0.75}
                  strokeDasharray="3 5"
                  className="connection-line"
                />
              );
            })}

        {/* ══════════ LAYER 3: Cluster labels (inside pads) ══════════ */}
        {clusterPads.map((h) => {
          const isFadedPad = hoveredCluster !== null && hoveredCluster !== h.clusterId;
          const cv = clusterVisibility.get(h.clusterId);
          const showFiltered = hasFilters && cv;

          // Two-line split for labels containing "&"
          const parts = h.label.includes(" & ")
            ? h.label.split(" & ")
            : [h.label];

          return (
            <g key={`label-${h.clusterId}`}>
              {parts.map((line, i) => (
                <text
                  key={i}
                  x={h.centroid[0]}
                  y={h.centroid[1] + (i - (parts.length - 1) / 2) * 18}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={h.color}
                  opacity={isFadedPad ? 0.25 : 0.9}
                  fontSize={14}
                  fontWeight={700}
                  fontFamily="var(--font-dm-serif), Georgia, serif"
                  letterSpacing={0.3}
                  className="cluster-pad-label"
                  pointerEvents="none"
                >
                  {parts.length > 1 && i === 0 ? line + " &" : line}
                </text>
              ))}
              {/* Count badge */}
              <text
                x={h.centroid[0]}
                y={h.centroid[1] + ((parts.length - 1) / 2) * 18 + 18}
                textAnchor="middle"
                dominantBaseline="central"
                fill={h.color}
                opacity={isFadedPad ? 0.15 : 0.45}
                fontSize={9}
                fontFamily="var(--font-inter), sans-serif"
                className="cluster-pad-label"
                pointerEvents="none"
              >
                {showFiltered
                  ? `${cv!.visible} of ${cv!.total}`
                  : `${h.count} ${h.count === 1 ? "item" : "items"}`}
              </text>
            </g>
          );
        })}

        {/* ══════════ LAYER 4: Nodes ══════════ */}
        {items.map((item) => {
          const pos = relaxedPositions.get(item.id) || item.embedding;
          const isVisible = visibleItemIds.size === 0 || visibleItemIds.has(item.id);
          const isSelected = selectedItem?.id === item.id;
          const isHovered = hoveredItem?.id === item.id;
          const clusterColor = CLUSTER_COLORS[item.cluster] || "#888";
          const r = nodeRadius(item);
          const baseOpacity = yearOpacity(item.year);

          return (
            <g
              key={item.id}
              className={`landscape-node${!isVisible ? " landscape-node--dimmed" : ""}`}
              style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
              onClick={(e) => {
                e.stopPropagation();
                onItemClick(item);
              }}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Hover ring (faint expanding ring) */}
              {isHovered && (
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={r * 2.2}
                  fill="none"
                  stroke={clusterColor}
                  strokeWidth={1}
                  opacity={0.2}
                  className="node-hover-ring"
                />
              )}

              {/* Selection pulse (SMIL animation) */}
              {isSelected && (
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={12}
                  fill="none"
                  stroke={clusterColor}
                  strokeWidth={1.5}
                  opacity={0.35}
                >
                  <animate
                    attributeName="r"
                    values="10;18;10"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.35;0.08;0.35"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Node circle (unified — all dots are circles) */}
              <circle
                cx={pos[0]}
                cy={pos[1]}
                r={isHovered ? r * 1.25 : r}
                fill={clusterColor}
                opacity={baseOpacity}
                filter="url(#node-shadow)"
              />

              {/* Label (on hover or selected) */}
              {(isHovered || isSelected) && (
                <text
                  className="landscape-label"
                  x={pos[0]}
                  y={pos[1] + (r * 1.25 + 10)}
                  textAnchor="middle"
                  fill="var(--foreground)"
                  fontSize={9}
                  fontFamily="var(--font-inter), sans-serif"
                  opacity={0.75}
                >
                  {item.title.length > 45
                    ? item.title.slice(0, 42) + "..."
                    : item.title}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredItem && !selectedItem && (
        <div
          className="landscape-tooltip fixed z-50 max-w-xs p-3 rounded-lg shadow-lg border"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y - 10,
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2 h-2 flex-shrink-0 rounded-full"
              style={{
                backgroundColor: CLUSTER_COLORS[hoveredItem.cluster] || "var(--research-color)",
                width: 8,
                height: 8,
              }}
            />
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              {hoveredItem.source} · {hoveredItem.year}
            </span>
          </div>
          <p
            className="text-sm font-medium leading-snug mb-2"
            style={{
              color: "var(--foreground)",
              fontFamily: "var(--font-dm-serif), Georgia, serif",
            }}
          >
            {hoveredItem.title}
          </p>
          {hoveredItem.designQuestion && (
            <p
              className="text-xs italic leading-relaxed"
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-dm-serif), Georgia, serif",
              }}
            >
              {hoveredItem.designQuestion}
            </p>
          )}
        </div>
      )}

      {/* Item count */}
      <div
        className="absolute bottom-3 left-3 text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        {visibleItemIds.size > 0
          ? `Showing ${visibleItemIds.size} of ${items.length} items`
          : `${items.length} items`}
      </div>
    </div>
  );
}
