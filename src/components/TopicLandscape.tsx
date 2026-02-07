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

/** Cross product of vectors OA and OB */
function cross(O: [number, number], A: [number, number], B: [number, number]) {
  return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
}

/** Graham scan convex hull — returns CCW ordered polygon */
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 1) return [...points];
  if (points.length === 2) return [...points];

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
  // Remove last point of each half because it's repeated
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/** Expand a convex polygon outward by `pad` pixels */
function expandHull(hull: [number, number][], pad: number): [number, number][] {
  if (hull.length < 3) return hull;
  const expanded: [number, number][] = [];
  const n = hull.length;

  for (let i = 0; i < n; i++) {
    const prev = hull[(i - 1 + n) % n];
    const curr = hull[i];
    const next = hull[(i + 1) % n];

    // Outward bisector
    const dx1 = curr[0] - prev[0], dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0], dy2 = next[1] - curr[1];

    // Outward normals (rotate edge direction 90° CCW)
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
    const nx1 = -dy1 / len1, ny1 = dx1 / len1;
    const nx2 = -dy2 / len2, ny2 = dx2 / len2;

    // Average normal
    let nx = nx1 + nx2, ny = ny1 + ny2;
    const nLen = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= nLen;
    ny /= nLen;

    expanded.push([curr[0] + nx * pad, curr[1] + ny * pad]);
  }

  // Re-hull to clean up any self-intersections
  return convexHull(expanded);
}

/** Catmull-Rom-to-Bézier: converts polygon to smooth closed SVG path */
function catmullRomPath(points: [number, number][], alpha = 0.35): string {
  if (points.length < 3) return "";
  const n = points.length;

  // Start with moveTo first point
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)} `;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    // Convert Catmull-Rom to cubic Bézier control points
    const cp1x = p1[0] + (p2[0] - p0[0]) * alpha;
    const cp1y = p1[1] + (p2[1] - p0[1]) * alpha;
    const cp2x = p2[0] - (p3[0] - p1[0]) * alpha;
    const cp2y = p2[1] - (p3[1] - p1[1]) * alpha;

    d += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }

  return d + "Z";
}

// ── Overlap relaxation ──────────────────────────────────────────

function relaxPositions(
  items: RadarItem[],
  minDist = 16,
  iterations = 4,
  maxShift = 4
): Map<string, [number, number]> {
  // Initialize with original positions
  const pos = new Map<string, [number, number]>();
  items.forEach((item) => pos.set(item.id, [...item.embedding] as [number, number]));

  // Group by cluster
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
            const overlap = (minDist - dist) / 2;
            const shift = Math.min(overlap, maxShift);
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
  clusterAnchors,
}: TopicLandscapeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredItem, setHoveredItem] = useState<RadarItem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Zoom and pan state
  const [viewBox, setViewBox] = useState({ x: -50, y: -30, w: 1100, h: 760 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // ── Step 2: Relaxed positions ──
  const relaxedPositions = useMemo(() => relaxPositions(items), [items]);

  // ── Step 1 & 3: Hull data + label positions ──
  const clusterHulls = useMemo(() => {
    const grouped = new Map<string, { points: [number, number][]; ids: string[] }>();

    items.forEach((item) => {
      const pos = relaxedPositions.get(item.id) || item.embedding;
      const g = grouped.get(item.cluster) || { points: [], ids: [] };
      g.points.push(pos);
      g.ids.push(item.id);
      grouped.set(item.cluster, g);
    });

    const hulls: {
      clusterId: string;
      path: string;
      color: string;
      centroid: [number, number];
      labelY: number;
      count: number;
      label: string;
    }[] = [];

    for (const [clusterId, { points, ids }] of grouped) {
      const color = CLUSTER_COLORS[clusterId] || "#888";
      const clusterInfo = clusters.find((c) => c.id === clusterId);
      const label = clusterInfo?.label || clusterId;

      // Centroid
      const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
      const cy = points.reduce((s, p) => s + p[1], 0) / points.length;

      // Y-extent for label placement
      const minY = Math.min(...points.map((p) => p[1]));

      // Label sits above the point cloud, inside the hull
      const labelY = minY - 18;

      if (points.length < 3) {
        // Defensive: draw circle or pill
        const r = 50;
        if (points.length === 1) {
          const [px, py] = points[0];
          hulls.push({
            clusterId,
            path: `M ${px - r} ${py} A ${r} ${r} 0 1 1 ${px + r} ${py} A ${r} ${r} 0 1 1 ${px - r} ${py} Z`,
            color,
            centroid: [cx, cy],
            labelY,
            count: ids.length,
            label,
          });
        } else {
          // 2 points → pill
          const [p1, p2] = points;
          const midX = (p1[0] + p2[0]) / 2;
          const midY = (p1[1] + p2[1]) / 2;
          hulls.push({
            clusterId,
            path: `M ${midX - r} ${midY - r} L ${midX + r} ${midY - r} A ${r} ${r} 0 0 1 ${midX + r} ${midY + r} L ${midX - r} ${midY + r} A ${r} ${r} 0 0 1 ${midX - r} ${midY - r} Z`,
            color,
            centroid: [cx, cy],
            labelY,
            count: ids.length,
            label,
          });
        }
        continue;
      }

      const hull = convexHull(points);
      const expanded = expandHull(hull, 40);
      const pathD = catmullRomPath(expanded);

      hulls.push({
        clusterId,
        path: pathD,
        color,
        centroid: [cx, cy],
        labelY,
        count: ids.length,
        label,
      });
    }

    return hulls;
  }, [items, clusters, relaxedPositions]);

  // ── Zoom & pan handlers ──

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.08 : 0.92;
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
      const my = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;

      const newW = viewBox.w * factor;
      const newH = viewBox.h * factor;
      const newX = mx - (mx - viewBox.x) * factor;
      const newY = my - (my - viewBox.y) * factor;

      setViewBox({ x: newX, y: newY, w: newW, h: newH });
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

      if (!isPanning.current) return;
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const dx = ((e.clientX - panStart.current.x) / rect.width) * viewBox.w;
      const dy = ((e.clientY - panStart.current.y) / rect.height) * viewBox.h;

      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy,
      }));
      panStart.current = { x: e.clientX, y: e.clientY };
    },
    [viewBox.w, viewBox.h]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  useEffect(() => {
    const handleGlobalUp = () => {
      isPanning.current = false;
    };
    window.addEventListener("mouseup", handleGlobalUp);
    return () => window.removeEventListener("mouseup", handleGlobalUp);
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
        {/* ── Layer 1: Cluster hulls (soft background blobs) ── */}
        {clusterHulls.map((hull) => (
          <path
            key={`hull-${hull.clusterId}`}
            className="cluster-hull"
            d={hull.path}
            fill={hull.color}
            fillOpacity={0.045}
            stroke={hull.color}
            strokeOpacity={0.12}
            strokeWidth={1}
          />
        ))}

        {/* ── Layer 2: Cluster labels (inside hulls) ── */}
        {clusterHulls.map((hull) => (
          <g key={`label-${hull.clusterId}`}>
            <text
              x={hull.centroid[0]}
              y={hull.labelY}
              textAnchor="middle"
              fill={hull.color}
              opacity={0.14}
              fontSize={20}
              fontFamily="var(--font-dm-serif), Georgia, serif"
              fontWeight={400}
              letterSpacing={0.5}
            >
              {hull.label}
            </text>
            <text
              x={hull.centroid[0]}
              y={hull.labelY + 15}
              textAnchor="middle"
              fill={hull.color}
              opacity={0.22}
              fontSize={9}
              fontFamily="var(--font-inter), sans-serif"
            >
              {hull.count} {hull.count === 1 ? "item" : "items"}
            </text>
          </g>
        ))}

        {/* ── Layer 3: Nodes ── */}
        {items.map((item) => {
          const pos = relaxedPositions.get(item.id) || item.embedding;
          const isVisible = visibleItemIds.size === 0 || visibleItemIds.has(item.id);
          const isSelected = selectedItem?.id === item.id;
          const isHovered = hoveredItem?.id === item.id;
          const color =
            item.source === "research"
              ? "var(--research-color)"
              : "var(--industry-color)";

          return (
            <g
              key={item.id}
              className="landscape-node"
              style={{
                opacity: isVisible ? 1 : 0.08,
                pointerEvents: isVisible ? "auto" : "none",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onItemClick(item);
              }}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={11}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
              )}

              {/* Hover glow */}
              {isHovered && !isSelected && (
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={10}
                  fill={color}
                  opacity={0.1}
                />
              )}

              {/* Node dot */}
              <circle
                cx={pos[0]}
                cy={pos[1]}
                r={isSelected ? 6 : isHovered ? 5.5 : 4.5}
                fill={color}
                opacity={0.85}
              />

              {/* Label (on hover or selected) */}
              {(isHovered || isSelected) && (
                <text
                  className="landscape-label"
                  x={pos[0]}
                  y={pos[1] + 14}
                  textAnchor="middle"
                  fill="var(--foreground)"
                  fontSize={9}
                  fontFamily="var(--font-inter), sans-serif"
                  opacity={0.7}
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
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor:
                  hoveredItem.source === "research"
                    ? "var(--research-color)"
                    : "var(--industry-color)",
              }}
            />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              {hoveredItem.source} · {hoveredItem.year}
            </span>
          </div>
          <p
            className="text-sm font-medium leading-snug mb-2"
            style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            {hoveredItem.title}
          </p>
          {hoveredItem.designQuestion && (
            <p
              className="text-xs italic leading-relaxed"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}
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
