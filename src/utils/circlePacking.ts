/**
 * Zone-based layout engine for theme blob visualization.
 * Positions 18 themes in a 3×2 grid organized by design lever.
 * Generates soft organic blob shapes (gentle wobble, squishy silhouettes).
 */

import { DesignLever, DesignTheme } from "../types";
import { LEVER_META } from "../data/theme-map";

/* ─── Exported types ────────────────────────────────────────────────── */

export interface ThemeBlobLayout {
  themeId: string;
  leverCategory: DesignLever;
  cx: number;
  cy: number;
  radius: number;
  color: string;
  colorLight: string;
  leverLabel: string;
  seed: number;
  /** SVG path string for the organic blob shape */
  blobPath: string;
  /** Slightly larger halo path */
  haloPath: string;
  /** Satellite positions (relative to blob center) */
  satellites: { dx: number; dy: number; r: number; angle: number }[];
}

export interface ZoneLayout {
  lever: DesignLever;
  cx: number;
  cy: number;
  label: string;
  color: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

/** Deterministic hash from string */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h / 2 ** 32;
}

/** Seeded pseudo-random (simple LCG) */
function seededRandom(seed: number): () => number {
  let s = seed * 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ─── Organic blob path generation ──────────────────────────────────── */

/**
 * Generate a smooth organic blob path using cubic Bézier curves.
 * Creates soft, squishy silhouettes inspired by Matisse cutouts.
 *
 * @param cx - center x
 * @param cy - center y
 * @param radius - base radius
 * @param seed - deterministic seed for shape variation
 * @param wobbleAmt - how much to deviate from a circle (0..1), default 0.18
 * @param numPoints - anchor points around the shape, default 8
 */
function generateOrganicBlobPath(
  cx: number,
  cy: number,
  radius: number,
  seed: number,
  wobbleAmt = 0.18,
  numPoints = 8
): string {
  const rng = seededRandom(seed);

  // Generate anchor points with gentle radial variation
  const points: { x: number; y: number; r: number; angle: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const baseAngle = (2 * Math.PI * i) / numPoints;
    // Small angular jitter for organic feel
    const angle = baseAngle + (rng() - 0.5) * 0.3;
    // Gentle radius variation — keeps shape round-ish but soft
    const rVariation = 1 + (rng() - 0.5) * 2 * wobbleAmt;
    const r = radius * rVariation;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      r,
      angle,
    });
  }

  // Build smooth cubic Bézier path through the points
  // Using Catmull-Rom-to-Bézier conversion for smooth curves
  const n = points.length;
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    // Catmull-Rom tension (lower = rounder/softer)
    const tension = 0.3;

    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  d += " Z";
  return d;
}

/* ─── Zone-based layout ─────────────────────────────────────────────── */

const BASE_R_DEFAULT = 38;
const RANGE_R_DEFAULT = 20;

/** Lever ordering for the 3×2 grid */
const LEVER_ORDER: DesignLever[] = [
  "interface",
  "workflow",
  "role",
  "ritual",
  "governance",
  "capability_boundary",
];

/**
 * Position themes within a zone using deterministic sub-layouts.
 * Returns offsets relative to zone center (0, 0).
 */
function positionThemesInZone(
  count: number,
  avgRadius: number
): [number, number][] {
  const gap = avgRadius * 2.6;

  switch (count) {
    case 1:
      return [[0, 0]];
    case 2:
      return [
        [-gap * 0.55, -gap * 0.08],
        [gap * 0.55, gap * 0.08],
      ];
    case 3:
      return [
        [0, -gap * 0.55],
        [-gap * 0.5, gap * 0.35],
        [gap * 0.5, gap * 0.35],
      ];
    case 4:
      return [
        [-gap * 0.48, -gap * 0.48],
        [gap * 0.48, -gap * 0.42],
        [-gap * 0.42, gap * 0.48],
        [gap * 0.48, gap * 0.52],
      ];
    case 5:
      return [
        [-gap * 0.7, -gap * 0.5],
        [0, -gap * 0.55],
        [gap * 0.7, -gap * 0.45],
        [-gap * 0.45, gap * 0.45],
        [gap * 0.45, gap * 0.5],
      ];
    default:
      return Array.from({ length: count }, (_, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        return [Math.cos(angle) * gap * 0.8, Math.sin(angle) * gap * 0.8] as [
          number,
          number,
        ];
      });
  }
}

/**
 * Generate satellite positions for a theme.
 */
function generateSatellites(
  radius: number,
  seed: number,
  itemCount: number
): { dx: number; dy: number; r: number; angle: number }[] {
  const rng = seededRandom(seed + 99);
  const count = Math.min(Math.max(1, Math.floor(itemCount / 2)), 3);
  const satellites: { dx: number; dy: number; r: number; angle: number }[] = [];

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = radius * (1.4 + rng() * 0.6);
    const r = 4 + rng() * 6;
    satellites.push({
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      r,
      angle,
    });
  }
  return satellites;
}

/**
 * Compute the full theme blob layout.
 */
export function computeThemeBlobLayout(
  themes: DesignTheme[],
  width: number,
  height: number
): { blobs: ThemeBlobLayout[]; zones: ZoneLayout[] } {
  const cols = 3;
  const rows = 2;
  const padL = 70;
  const padR = 100;
  const padY = 56;
  const mainHeight = height - 70;
  const cellW = (width - padL - padR) / cols;
  const cellH = (mainHeight - padY * 2) / rows;

  // Scale blob radii down when width is narrow (e.g. when detail drawer is open)
  const REF_WIDTH = 960;
  const scale = Math.min(1, width / REF_WIDTH);
  const BASE_R = BASE_R_DEFAULT * scale;
  const RANGE_R = RANGE_R_DEFAULT * scale;

  const maxItems = Math.max(...themes.map((t) => t.itemIds.length), 1);

  const grouped = new Map<DesignLever, DesignTheme[]>();
  for (const lever of LEVER_ORDER) {
    grouped.set(
      lever,
      themes.filter((t) => t.leverCategory === lever)
    );
  }

  const blobs: ThemeBlobLayout[] = [];
  const zones: ZoneLayout[] = [];

  LEVER_ORDER.forEach((lever, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const zoneCx = padL + cellW * (col + 0.5);
    const zoneCy = padY + cellH * (row + 0.5);
    const meta = LEVER_META[lever];
    const leverThemes = grouped.get(lever) || [];

    zones.push({
      lever,
      cx: zoneCx,
      cy: zoneCy,
      label: meta.label,
      color: meta.color,
    });

    if (leverThemes.length === 0) return;

    const radii = leverThemes.map((theme) => {
      const ratio = Math.sqrt(theme.itemIds.length) / Math.sqrt(maxItems);
      return BASE_R + ratio * RANGE_R;
    });
    const avgR = radii.reduce((a, b) => a + b, 0) / radii.length;
    const offsets = positionThemesInZone(leverThemes.length, avgR);

    leverThemes.forEach((theme, i) => {
      const r = radii[i];
      const cx = zoneCx + offsets[i][0];
      const cy = zoneCy + offsets[i][1];
      const seed = hash(theme.id) * 100;

      blobs.push({
        themeId: theme.id,
        leverCategory: lever,
        cx,
        cy,
        radius: r,
        color: meta.color,
        colorLight: meta.colorLight,
        leverLabel: meta.label,
        seed,
        blobPath: generateOrganicBlobPath(cx, cy, r, seed, 0.22, 8),
        haloPath: generateOrganicBlobPath(cx, cy, r * 1.35, seed + 7, 0.16, 8),
        satellites: generateSatellites(r, seed, theme.itemIds.length),
      });
    });
  });

  // Overlap relaxation
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) {
        const a = blobs[i];
        const b = blobs[j];
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius + 20;
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.cx -= nx * overlap;
          a.cy -= ny * overlap;
          b.cx += nx * overlap;
          b.cy += ny * overlap;
        }
      }
    }
  }

  // Viewport clamping — keep blobs (and satellites) within visible area
  for (const blob of blobs) {
    const margin = blob.radius * 1.5 + 16;
    blob.cx = Math.max(margin, Math.min(width - margin, blob.cx));
    blob.cy = Math.max(margin, Math.min(mainHeight - margin, blob.cy));
  }

  // Regenerate paths after position changes
  for (const blob of blobs) {
    blob.blobPath = generateOrganicBlobPath(
      blob.cx, blob.cy, blob.radius, blob.seed, 0.22, 8
    );
    blob.haloPath = generateOrganicBlobPath(
      blob.cx, blob.cy, blob.radius * 1.25, blob.seed + 7, 0.16, 8
    );
  }

  return { blobs, zones };
}
