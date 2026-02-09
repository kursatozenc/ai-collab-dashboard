"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
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

/** Subdivide hull edges to increase control point density for smoother curves */
function interpolateHull(
  hull: [number, number][],
  subdivisions = 2
): [number, number][] {
  if (hull.length < 3) return hull;
  const result: [number, number][] = [];
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    result.push(a);
    for (let s = 1; s <= subdivisions; s++) {
      const t = s / (subdivisions + 1);
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return result;
}

/** Apply sine-harmonic radial perturbations for organic blob shapes */
function addRadialWobble(
  points: [number, number][],
  cx: number,
  cy: number,
  amplitude = 0.12,
  seed = 0
): [number, number][] {
  return points.map((p) => {
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    const angle = Math.atan2(dy, dx);
    // Deterministic wobble using 3 sine harmonics at decreasing amplitudes
    const wobble =
      1 +
      amplitude *
        (Math.sin(angle * 3 + seed) * 0.6 +
          Math.sin(angle * 5 + seed * 1.7) * 0.3 +
          Math.sin(angle * 7 + seed * 2.3) * 0.1);
    return [cx + dx * wobble, cy + dy * wobble] as [number, number];
  });
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

// ── Zoom helpers ────────────────────────────────────────────────

const DEFAULT_VIEWBOX = { x: -50, y: -30, w: 1100, h: 760 };
const SVG_ASPECT = DEFAULT_VIEWBOX.w / DEFAULT_VIEWBOX.h;

function computeClusterViewBox(
  hullPoints: [number, number][],
  padding = 60
): { x: number; y: number; w: number; h: number } {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [px, py] of hullPoints) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  const rawW = maxX - minX + padding * 2;
  const rawH = maxY - minY + padding * 2;
  // Maintain aspect ratio
  let w = rawW;
  let h = rawH;
  if (w / h > SVG_ASPECT) {
    h = w / SVG_ASPECT;
  } else {
    w = h * SVG_ASPECT;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
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
  const [viewBox, setViewBox] = useState(DEFAULT_VIEWBOX);
  const [zoomedCluster, setZoomedCluster] = useState<string | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const viewBoxRef = useRef(viewBox);
  viewBoxRef.current = viewBox;
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

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
      /** Organic ambient blob paths (larger, softer) for slow drift effect */
      ambientBlobPaths: string[];
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
        // Ambient blobs: two larger circles for soft glow
        const blobR1 = r * 2.2;
        const blobR2 = r * 2.9;
        const blob1 = `M ${cx - blobR1} ${cy} A ${blobR1} ${blobR1} 0 1 1 ${cx + blobR1} ${cy} A ${blobR1} ${blobR1} 0 1 1 ${cx - blobR1} ${cy} Z`;
        const blob2 = `M ${cx - blobR2} ${cy} A ${blobR2} ${blobR2} 0 1 1 ${cx + blobR2} ${cy} A ${blobR2} ${blobR2} 0 1 1 ${cx - blobR2} ${cy} Z`;
        pads.push({
          clusterId,
          padPath: fallbackPath,
          hullPoints: hitPoly,
          color,
          centroid: [cx, cy],
          count: ids.length,
          label,
          ambientBlobPaths: [blob1, blob2],
        });
        continue;
      }

      const hull = convexHull(points);
      const expanded = expandHull(hull, 40);
      // Organic blob pipeline: interpolate → wobble → smooth
      const interpolated = interpolateHull(expanded, 2);
      const seed = clusterId.charCodeAt(0) + clusterId.charCodeAt(clusterId.length - 1);
      const wobbled = addRadialWobble(interpolated, cx, cy, 0.12, seed);
      const pathD = catmullRomPath(wobbled, 0.55);

      // Ambient blobs: larger, softer organic shapes that drift slowly
      const expandedBlob1 = expandHull(hull, 72);
      const expandedBlob2 = expandHull(hull, 100);
      const interp1 = interpolateHull(expandedBlob1, 2);
      const interp2 = interpolateHull(expandedBlob2, 2);
      const wobbled1 = addRadialWobble(interp1, cx, cy, 0.18, seed + 1);
      const wobbled2 = addRadialWobble(interp2, cx, cy, 0.22, seed + 2.3);
      const ambientBlobPaths = [
        catmullRomPath(wobbled1, 0.55),
        catmullRomPath(wobbled2, 0.55),
      ];

      pads.push({
        clusterId,
        padPath: pathD,
        hullPoints: expanded,
        color,
        centroid: [cx, cy],
        count: ids.length,
        label,
        ambientBlobPaths,
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

  // ── Animated viewBox transitions ──
  const animateViewBox = useCallback(
    (
      from: { x: number; y: number; w: number; h: number },
      to: { x: number; y: number; w: number; h: number },
      durationMs = 500
    ) => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      const startTime = performance.now();
      const ease = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const t = ease(progress);
        setViewBox({
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
          w: from.w + (to.w - from.w) * t,
          h: from.h + (to.h - from.h) * t,
        });
        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          animFrameRef.current = null;
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);
    },
    []
  );

  const handleClusterClick = useCallback(
    (clusterId: string) => {
      if (zoomedCluster === clusterId) {
        // Toggle: zoom out
        setZoomedCluster(null);
        animateViewBox(viewBoxRef.current, DEFAULT_VIEWBOX, 400);
        return;
      }
      const pad = clusterPads.find((p) => p.clusterId === clusterId);
      if (!pad) return;
      const targetVB = computeClusterViewBox(pad.hullPoints, 60);
      setZoomedCluster(clusterId);
      animateViewBox(viewBoxRef.current, targetVB, 500);
    },
    [zoomedCluster, clusterPads, animateViewBox]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      // Cancel any in-flight animation
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (zoomedCluster !== null) setZoomedCluster(null);

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
    [viewBox, zoomedCluster]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
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

  // ── SVG click handler (reset zoom on empty space) ──
  const handleSvgClick = useCallback(
    (e: React.MouseEvent) => {
      // If mouse moved significantly since mousedown, it was a pan
      if (mouseDownPos.current) {
        const dx = e.clientX - mouseDownPos.current.x;
        const dy = e.clientY - mouseDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) return;
      }
      const svgPt = svgPointFromClient(e.clientX, e.clientY);
      if (!svgPt) return;
      // If click is inside any cluster hull, do nothing on single click
      for (const pad of clusterPads) {
        if (pointInPolygon(svgPt, pad.hullPoints)) {
          return;
        }
      }
      // Click on empty background: reset zoom
      if (zoomedCluster !== null) {
        setZoomedCluster(null);
        animateViewBox(viewBoxRef.current, DEFAULT_VIEWBOX, 400);
      }
    },
    [svgPointFromClient, clusterPads, zoomedCluster, animateViewBox]
  );

  // ── SVG double-click handler (cluster zoom) ──
  const handleSvgDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // If mouse moved significantly since mousedown, it was a pan
      if (mouseDownPos.current) {
        const dx = e.clientX - mouseDownPos.current.x;
        const dy = e.clientY - mouseDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) return;
      }
      const svgPt = svgPointFromClient(e.clientX, e.clientY);
      if (!svgPt) return;
      // Check if double-click is inside any cluster hull
      for (const pad of clusterPads) {
        if (pointInPolygon(svgPt, pad.hullPoints)) {
          handleClusterClick(pad.clusterId);
          return;
        }
      }
    },
    [svgPointFromClient, clusterPads, handleClusterClick]
  );

  useEffect(() => {
    const up = () => { isPanning.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  // ── Escape key to reset zoom ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zoomedCluster !== null) {
        setZoomedCluster(null);
        animateViewBox(viewBoxRef.current, DEFAULT_VIEWBOX, 400);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomedCluster, animateViewBox]);

  // ── Cleanup animation frame on unmount ──
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full"
        style={{
          cursor: isPanning.current
            ? "grabbing"
            : hoveredCluster !== null
              ? "zoom-in"
              : "grab",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleSvgClick}
        onDoubleClick={handleSvgDoubleClick}
      >
        {/* ══════════ DEFS ══════════ */}
        <defs>
          {/* Three gradient layers per cluster for glass effect */}
          {clusterPads.map((h) => (
            <React.Fragment key={`grads-${h.clusterId}`}>
              {/* Primary fill: rich glass interior */}
              <radialGradient
                id={`pad-grad-${h.clusterId}`}
                cx="50%" cy="42%" r="60%" fx="44%" fy="38%"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
                <stop offset="12%" stopColor={h.color} stopOpacity={0.75} />
                <stop offset="45%" stopColor={h.color} stopOpacity={0.50} />
                <stop offset="75%" stopColor={h.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={h.color} stopOpacity={0.10} />
              </radialGradient>
              {/* Halo: ambient glow bleeding beyond shape */}
              <radialGradient
                id={`pad-halo-${h.clusterId}`}
                cx="50%" cy="50%" r="70%"
              >
                <stop offset="0%" stopColor={h.color} stopOpacity={0.30} />
                <stop offset="50%" stopColor={h.color} stopOpacity={0.12} />
                <stop offset="100%" stopColor={h.color} stopOpacity={0.0} />
              </radialGradient>
              {/* Specular highlight: bright spot for 3D curvature */}
              <radialGradient
                id={`pad-specular-${h.clusterId}`}
                cx="38%" cy="32%" r="30%" fx="36%" fy="28%"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.40} />
                <stop offset="40%" stopColor="#ffffff" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
              </radialGradient>
            </React.Fragment>
          ))}

          {/* Dot-grid background pattern (faint white on dark) */}
          <pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.5" fill="#ffffff" opacity="0.04" />
          </pattern>

          {/* Blob ambient halo filter */}
          <filter id="pad-ambient-halo" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="halo-blur" />
            <feColorMatrix in="halo-blur" type="matrix" result="halo-bright"
              values="1.3 0 0 0 0
                      0 1.3 0 0 0
                      0 0 1.3 0 0
                      0 0 0 0.6 0" />
            <feMerge>
              <feMergeNode in="halo-bright" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pad hover glow (intensified) */}
          <filter id="pad-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="big-glow" />
            <feColorMatrix in="big-glow" type="matrix" result="bright-glow"
              values="1.5 0 0 0 0.05
                      0 1.5 0 0 0.05
                      0 0 1.5 0 0.05
                      0 0 0 0.8 0" />
            <feMerge>
              <feMergeNode in="bright-glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node luminous glow (replaces shadow for dark bg) */}
          <filter id="node-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="node-blur" />
            <feColorMatrix in="node-blur" type="matrix" result="node-bright"
              values="1.2 0 0 0 0.1
                      0 1.2 0 0 0.1
                      0 0 1.2 0 0.1
                      0 0 0 0.9 0" />
            <feMerge>
              <feMergeNode in="node-bright" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node hover ring glow */}
          <filter id="node-hover-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          </filter>

          {/* Connection line glow */}
          <filter id="connection-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="line-blur" />
            <feMerge>
              <feMergeNode in="line-blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft glow for ambient blobs (translucent, slow-moving) */}
          <filter id="ambient-blob-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="28" result="blob-blur" />
            <feColorMatrix in="blob-blur" type="matrix" result="blob-soft"
              values="1.2 0 0 0 0
                      0 1.2 0 0 0
                      0 0 1.2 0 0
                      0 0 0 0.85 0" />
            <feMerge>
              <feMergeNode in="blob-soft" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Per-cluster radial gradient for blob fill */}
          {clusterPads.map((h) => (
            <radialGradient
              key={`blob-grad-${h.clusterId}`}
              id={`blob-grad-${h.clusterId}`}
              cx="50%" cy="50%" r="70%" fx="45%" fy="45%"
            >
              <stop offset="0%" stopColor={h.color} stopOpacity={0.35} />
              <stop offset="40%" stopColor={h.color} stopOpacity={0.18} />
              <stop offset="75%" stopColor={h.color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={h.color} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>

        {/* ══════════ LAYER 0: Dark background + texture ══════════ */}
        <rect
          x={viewBox.x - viewBox.w} y={viewBox.y - viewBox.h}
          width={viewBox.w * 3} height={viewBox.h * 3}
          fill="#12121f"
          className="pointer-events-none"
        />
        <rect
          x={-50} y={-30} width={1100} height={760}
          fill="url(#dot-grid)"
          className="pointer-events-none"
        />

        {/* ══════════ LAYER 1: Cluster Animated Groups ══════════ */}
        {clusterPads.map((h, index) => {
          const isHoveredPad = hoveredCluster === h.clusterId;
          const isActivePad = selectedItem?.cluster === h.clusterId;
          const isFadedByHover = hoveredCluster !== null && !isHoveredPad && !selectedItem;
          const isFadedBySelection = selectedItem !== null && !isActivePad;
          const cv = clusterVisibility.get(h.clusterId);
          const dimmed = hasFilters && cv && cv.visible === 0;
          const showFiltered = hasFilters && cv;
          const floatVariant = ["a", "b", "c"][index % 3];

          // Two-line split for labels containing "&"
          const parts = h.label.includes(" & ")
            ? h.label.split(" & ")
            : [h.label];

          return (
            <g
              key={`cluster-group-${h.clusterId}`}
              className={`cluster-group cluster-group--float-${floatVariant}${isHoveredPad ? " cluster-group--hovered" : ""}`}
              style={{
                "--float-delay": `${index * -1.7}s`,
                "--centroid-x": `${h.centroid[0]}px`,
                "--centroid-y": `${h.centroid[1]}px`,
                transformOrigin: `${h.centroid[0]}px ${h.centroid[1]}px`,
              } as React.CSSProperties}
            >
              {/* Layer 0: Organic ambient blobs (soft, translucent, slow drift) */}
              <g className="cluster-ambient-blobs" pointerEvents="none">
                {h.ambientBlobPaths.map((blobD, blobIdx) => (
                  <path
                    key={`blob-${h.clusterId}-${blobIdx}`}
                    className="cluster-ambient-blob"
                    d={blobD}
                    fill={`url(#blob-grad-${h.clusterId})`}
                    stroke="none"
                    filter="url(#ambient-blob-blur)"
                    opacity={dimmed ? 0.12 : isFadedBySelection ? 0.15 : isFadedByHover ? 0.25 : 0.7}
                    style={{
                      animationDelay: `${blobIdx * 2.5}s`,
                      transformOrigin: `${h.centroid[0]}px ${h.centroid[1]}px`,
                    }}
                  />
                ))}
              </g>

              {/* Layer A: Ambient halo (blurred glow behind shape) */}
              <path
                className="cluster-pad-halo"
                d={h.padPath}
                fill={`url(#pad-halo-${h.clusterId})`}
                stroke="none"
                filter="url(#pad-ambient-halo)"
                opacity={dimmed ? 0.08 : isFadedBySelection ? 0.10 : isFadedByHover ? 0.15 : 0.7}
                style={{
                  transform: isHoveredPad
                    ? "scale(1.08)"
                    : isActivePad
                      ? "scale(1.06)"
                      : "scale(1.02)",
                  transformOrigin: `${h.centroid[0]}px ${h.centroid[1]}px`,
                }}
                pointerEvents="none"
              />

              {/* Layer B: Main glass body */}
              <path
                className="cluster-pad"
                d={h.padPath}
                fill={`url(#pad-grad-${h.clusterId})`}
                stroke={h.color}
                strokeWidth={1.5}
                strokeOpacity={isHoveredPad ? 0.55 : 0.30}
                strokeLinejoin="round"
                filter={isHoveredPad ? "url(#pad-glow)" : undefined}
                opacity={dimmed ? 0.15 : isFadedBySelection ? 0.20 : isFadedByHover ? 0.30 : 1}
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

              {/* Layer C: Specular highlight (3D curvature) */}
              <path
                className="cluster-pad-specular"
                d={h.padPath}
                fill={`url(#pad-specular-${h.clusterId})`}
                stroke="none"
                opacity={dimmed ? 0.05 : isFadedBySelection ? 0.08 : isFadedByHover ? 0.12 : 0.6}
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

              {/* Inner glow overlay (pressed/selected state) */}
              {isActivePad && (
                <path
                  className="cluster-pad-inner-glow"
                  d={h.padPath}
                  fill={h.color}
                  fillOpacity={0.12}
                  stroke={h.color}
                  strokeOpacity={0.30}
                  strokeWidth={2}
                  pointerEvents="none"
                />
              )}

              {/* Label text (dark halo + white fill for dark bg) */}
              {parts.map((line, i) => {
                const labelText = parts.length > 1 && i === 0 ? line + " &" : line;
                const ly = h.centroid[1] + (i - (parts.length - 1) / 2) * 20;
                return (
                  <g key={`label-line-${i}`}>
                    {/* Dark halo for readability on dark bg */}
                    <text
                      x={h.centroid[0]}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="none"
                      stroke="#12121f"
                      strokeWidth={4}
                      strokeOpacity={isFadedBySelection ? 0.3 : isFadedByHover ? 0.4 : 0.7}
                      strokeLinejoin="round"
                      fontSize={16}
                      fontWeight={700}
                      fontFamily="var(--font-dm-serif), Georgia, serif"
                      letterSpacing={0.5}
                      pointerEvents="none"
                    >
                      {labelText}
                    </text>
                    {/* White label */}
                    <text
                      x={h.centroid[0]}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      opacity={isFadedBySelection ? 0.25 : isFadedByHover ? 0.30 : 0.95}
                      fontSize={16}
                      fontWeight={700}
                      fontFamily="var(--font-dm-serif), Georgia, serif"
                      letterSpacing={0.5}
                      className="cluster-pad-label"
                      pointerEvents="none"
                    >
                      {labelText}
                    </text>
                  </g>
                );
              })}

              {/* Count badge */}
              <text
                x={h.centroid[0]}
                y={h.centroid[1] + ((parts.length - 1) / 2) * 20 + 20}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                opacity={isFadedBySelection ? 0.12 : isFadedByHover ? 0.18 : 0.40}
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
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeDasharray="3 5"
                  filter="url(#connection-glow)"
                  className="connection-line"
                />
              );
            })}

        {/* ══════════ LAYER 3: Nodes ══════════ */}
        {items.map((item) => {
          const pos = relaxedPositions.get(item.id) || item.embedding;
          const isVisible = visibleItemIds.size === 0 || visibleItemIds.has(item.id);
          const isSelected = selectedItem?.id === item.id;
          const isHovered = hoveredItem?.id === item.id;
          const clusterColor = CLUSTER_COLORS[item.cluster] || "#888";
          const r = nodeRadius(item);
          const baseOpacity = yearOpacity(item.year);
          const isEmerging = item.tags?.includes("emerging");

          // Region-first interaction: dots outside hovered cluster fade to 35%
          const isOutsideHoveredCluster = hoveredCluster !== null && item.cluster !== hoveredCluster;

          // Selection: non-selected cluster dots fade to 20%
          const isOutsideSelectedCluster = selectedItem !== null && item.cluster !== selectedItem.cluster;

          // Compute final dot opacity
          let dotOpacity = baseOpacity;
          if (isOutsideSelectedCluster && !isSelected) {
            dotOpacity = 0.20;
          } else if (isOutsideHoveredCluster && !selectedItem) {
            dotOpacity = 0.35;
          }

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
              {/* Emerging / novelty pulse ring (always-on for emerging items) */}
              {isEmerging && (
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={r * 1.8}
                  fill="none"
                  stroke={clusterColor}
                  strokeWidth={1.5}
                  opacity={0.25}
                >
                  <animate
                    attributeName="r"
                    values={`${r * 1.0};${r * 1.15 * 2.2};${r * 1.0}`}
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.25;0.06;0.25"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Hover ring (faint expanding ring) */}
              {isHovered && (
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={r * 2.2}
                  fill="none"
                  stroke={clusterColor}
                  strokeWidth={1.5}
                  opacity={0.35}
                  filter="url(#node-hover-glow)"
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
                  strokeWidth={2}
                  opacity={0.50}
                  filter="url(#node-hover-glow)"
                >
                  <animate
                    attributeName="r"
                    values="10;18;10"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.50;0.12;0.50"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Node circle (unified — all dots are circles, luminous glow) */}
              <circle
                cx={pos[0]}
                cy={pos[1]}
                r={isHovered ? r * 1.25 : r}
                fill={clusterColor}
                opacity={dotOpacity}
                filter="url(#node-glow)"
              />

              {/* Label (on hover or selected — white text for dark bg) */}
              {(isHovered || isSelected) && (
                <text
                  className="landscape-label"
                  x={pos[0]}
                  y={pos[1] + (r * 1.25 + 10)}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={9}
                  fontFamily="var(--font-inter), sans-serif"
                  opacity={0.85}
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

      {/* Hover card (dark glassmorphic) */}
      {hoveredItem && !selectedItem && (
        <div
          className="landscape-tooltip fixed z-50 max-w-sm p-4 rounded-xl shadow-xl border"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y - 10,
            backgroundColor: "rgba(12, 12, 22, 0.92)",
            borderColor: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
            color: "#e8e6e2",
          }}
        >
          {/* Source + year */}
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="flex-shrink-0 rounded-full"
              style={{
                backgroundColor: CLUSTER_COLORS[hoveredItem.cluster] || "var(--research-color)",
                width: 8,
                height: 8,
              }}
            />
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              {hoveredItem.source} · {hoveredItem.year}
            </span>
          </div>

          {/* Title */}
          <p
            className="text-sm font-semibold leading-snug mb-1.5"
            style={{
              color: "#f0ece8",
              fontFamily: "var(--font-dm-serif), Georgia, serif",
            }}
          >
            {hoveredItem.title}
          </p>

          {/* One-line summary */}
          {hoveredItem.summary && (
            <p
              className="text-xs leading-relaxed mb-2"
              style={{ color: "rgba(255, 255, 255, 0.55)" }}
            >
              {hoveredItem.summary.length > 140
                ? hoveredItem.summary.slice(0, 137) + "..."
                : hoveredItem.summary}
            </p>
          )}

          {/* Design question (emphasized) */}
          {hoveredItem.designQuestion && (
            <p
              className="text-xs italic leading-relaxed pt-1.5"
              style={{
                color: CLUSTER_COLORS[hoveredItem.cluster] || "rgba(255, 255, 255, 0.6)",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                fontFamily: "var(--font-dm-serif), Georgia, serif",
              }}
            >
              &ldquo;{hoveredItem.designQuestion}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Item count */}
      <div
        className="absolute bottom-3 left-3 text-xs"
        style={{ color: "rgba(255, 255, 255, 0.4)" }}
      >
        {visibleItemIds.size > 0
          ? `Showing ${visibleItemIds.size} of ${items.length} items`
          : `${items.length} items`}
      </div>

      {/* Reset Zoom button */}
      {zoomedCluster !== null && (
        <button
          onClick={() => {
            setZoomedCluster(null);
            animateViewBox(viewBoxRef.current, DEFAULT_VIEWBOX, 400);
          }}
          className="absolute bottom-3 right-3 px-3 py-1.5 text-xs rounded-lg border transition-colors hover:border-white/30"
          style={{
            backgroundColor: "rgba(12, 12, 22, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.15)",
            color: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          Reset Zoom
        </button>
      )}
    </div>
  );
}
