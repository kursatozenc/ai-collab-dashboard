/**
 * Isometric City Map — Layout Engine
 *
 * Computes screen-space positions for 6 City Districts, their Buildings
 * (design theme clusters), and Windows (individual papers) in a 2:1
 * isometric projection ("Elephants on Tour" aesthetic).
 */

import { DesignTheme } from "../types";
import { RadarItem } from "../types";

/* ─── Tile constants ─────────────────────────────────────────────── */

export const TILE_W = 64; // isometric tile width in screen pixels
export const TILE_H = 32; // tile height = TILE_W / 2 (2:1 ratio)

const MIN_BH = 22; // building height for 1 paper
const MAX_BH = 78; // building height for max papers (log scale)

/* ─── City District type ─────────────────────────────────────────── */

export type CityDistrict =
  | "interaction_modality"
  | "orchestration"
  | "agency_tower"
  | "ritual_gardens"
  | "accountability_hall"
  | "trust_lighthouse";

export interface DistrictConfig {
  id: CityDistrict;
  label: string;
  /** Theme IDs from DESIGN_THEMES that belong to this district */
  themeIds: string[];
}

/** 6 reconceptualized districts. Does NOT map 1-to-1 with DesignLever. */
export const DISTRICT_CONFIG: DistrictConfig[] = [
  {
    id: "interaction_modality",
    label: "Interaction &\nModality Hub",
    themeIds: ["communication-design", "social-emotional-ai", "ai-behavioral-patterns"],
  },
  {
    id: "orchestration",
    label: "Orchestration\nPlaza",
    themeIds: [
      "task-delegation",
      "co-creative-workflows",
      "team-effectiveness",
      "human-in-the-loop",
    ],
  },
  {
    id: "agency_tower",
    label: "The Agency\nTower",
    themeIds: [
      "tool-vs-teammate",
      "team-composition",
      "identity-meaning",
      "teaming-vs-interaction",
    ],
  },
  {
    id: "ritual_gardens",
    label: "Ritual\nGardens",
    themeIds: ["onboarding-rituals", "trust-repair", "training-upskilling"],
  },
  {
    id: "accountability_hall",
    label: "Accountability &\nPolicy Hall",
    themeIds: ["accountability-harm", "power-fairness"],
  },
  {
    id: "trust_lighthouse",
    label: "Trust &\nObservability Lighthouse",
    themeIds: ["trust-calibration", "shared-understanding"],
  },
];

/* ─── Pastel color palette per district ─────────────────────────── */

export const DISTRICT_PALETTES: Record<
  CityDistrict,
  { top: string; left: string; right: string; ground: string }
> = {
  interaction_modality: {
    top: "#B2E0DC",
    left: "#7CCCC6",
    right: "#4DB8B0",
    ground: "#D6F0EE",
  },
  orchestration: {
    top: "#B8D4F5",
    left: "#7AAEE8",
    right: "#4D8ED4",
    ground: "#D8E8F8",
  },
  agency_tower: {
    top: "#C8B8F0",
    left: "#A080DC",
    right: "#7A50C8",
    ground: "#E0D6F8",
  },
  ritual_gardens: {
    top: "#C8E6C4",
    left: "#8DC88A",
    right: "#5AA054",
    ground: "#DFF2DC",
  },
  accountability_hall: {
    top: "#F5B8B8",
    left: "#E88080",
    right: "#D45050",
    ground: "#FAE0E0",
  },
  trust_lighthouse: {
    top: "#FFF3B0",
    left: "#F0D060",
    right: "#D8A830",
    ground: "#FFF8D0",
  },
};

export const GHOST_PALETTE = {
  top: "#EAE6DF",
  left: "#D8D3CB",
  right: "#C8C2B8",
  ground: "#F0EDE8",
};

/* ─── Layout interfaces ──────────────────────────────────────────── */

export interface WindowPosition {
  itemId: string;
  /** screen x relative to building anchor (sx, sy) */
  wx: number;
  wy: number;
  face: "left" | "right";
}

export interface BuildingLayout {
  themeId: string;
  themeLabel: string;
  /** screen-space anchor: bottom-center of building base */
  sx: number;
  sy: number;
  /** building height in screen pixels */
  bHeight: number;
  tileW: number;
  tileH: number;
  colorTop: string;
  colorLeft: string;
  colorRight: string;
  isGhost: boolean;
  windows: WindowPosition[];
  /** iso sort key for painter's algorithm */
  sortKey: number;
  themeDescription: string;
  paperCount: number;
}

export interface DistrictLayout {
  districtId: CityDistrict;
  label: string;
  /** screen-space center of district ground platform */
  sx: number;
  sy: number;
  /** iso col/row of district top corner */
  isoCol: number;
  isoRow: number;
  buildings: BuildingLayout[];
  palette: { top: string; left: string; right: string; ground: string };
  isFullyGhost: boolean;
}

/* ─── Isometric math ─────────────────────────────────────────────── */

/**
 * Map iso grid (col, row) to screen (x, y).
 * @param col iso column
 * @param row iso row
 * @param originX screen x origin
 * @param originY screen y origin
 */
export function isoToScreen(
  col: number,
  row: number,
  originX: number,
  originY: number,
  tileW = TILE_W,
  tileH = TILE_H
): { x: number; y: number } {
  return {
    x: originX + (col - row) * (tileW / 2),
    y: originY + (col + row) * (tileH / 2),
  };
}

/**
 * Iso rectangle ground platform path (filled diamond for a W×D tile block).
 * Vertices: top, right, bottom, left of the rhombus.
 */
export function isoRectPath(
  topIsoCol: number,
  topIsoRow: number,
  w: number, // width in iso tiles
  d: number, // depth in iso tiles
  originX: number,
  originY: number,
  tileW = TILE_W,
  tileH = TILE_H
): string {
  const top = isoToScreen(topIsoCol, topIsoRow, originX, originY, tileW, tileH);
  const right = isoToScreen(
    topIsoCol + w,
    topIsoRow,
    originX,
    originY,
    tileW,
    tileH
  );
  const bottom = isoToScreen(
    topIsoCol + w,
    topIsoRow + d,
    originX,
    originY,
    tileW,
    tileH
  );
  const left = isoToScreen(
    topIsoCol,
    topIsoRow + d,
    originX,
    originY,
    tileW,
    tileH
  );
  return `M ${top.x.toFixed(1)},${top.y.toFixed(1)} L ${right.x.toFixed(
    1
  )},${right.y.toFixed(1)} L ${bottom.x.toFixed(1)},${bottom.y.toFixed(
    1
  )} L ${left.x.toFixed(1)},${left.y.toFixed(1)} Z`;
}

/* ─── Private helpers ────────────────────────────────────────────── */

/** Seeded pseudo-random LCG */
function seededRandom(seed: number): () => number {
  let s = seed * 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Deterministic hash from string */
function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h / 2 ** 32;
}

/** Building height from paper count using log scale */
function buildingHeight(paperCount: number, maxCount: number): number {
  if (maxCount <= 0) return MIN_BH;
  const t = Math.log(paperCount + 1) / Math.log(maxCount + 1);
  return MIN_BH + t * (MAX_BH - MIN_BH);
}

/**
 * Building positions within a district (iso offsets from district top corner).
 * Returns [isoCol offset, isoRow offset] for each building.
 * District spans 5×5 tiles; buildings constrained to interior 1..3.
 */
function buildingOffsets(n: number): [number, number][] {
  switch (n) {
    case 1:
      return [[2, 2]];
    case 2:
      return [
        [1, 2],
        [3, 2],
      ];
    case 3:
      return [
        [2, 1],
        [1, 3],
        [3, 3],
      ];
    case 4:
      return [
        [1, 1],
        [3, 1],
        [1, 3],
        [3, 3],
      ];
    default: // 5+
      return [
        [2, 1],
        [1, 2],
        [3, 2],
        [1, 4],
        [3, 4],
      ];
  }
}

/**
 * Generate window positions on the left and right faces of a building.
 * Windows are distributed in a grid across both faces, max 8 total.
 */
function buildingWindows(
  itemIds: string[],
  tileW: number,
  tileH: number,
  bHeight: number
): WindowPosition[] {
  const windows: WindowPosition[] = [];
  const total = Math.min(itemIds.length, 8);
  const floors = Math.max(1, Math.floor(bHeight / 16));
  const perFloor = Math.ceil(total / floors);

  let placed = 0;
  for (let floor = 0; floor < floors && placed < total; floor++) {
    const yStep = bHeight / (floors + 1);
    const yOff = -(floor + 1) * yStep; // negative = up from base
    for (let col = 0; col < perFloor && placed < total; col++) {
      const face: "left" | "right" = placed % 2 === 0 ? "left" : "right";
      // Position window center on the face
      const faceProgress = (col + 1) / (perFloor + 1);
      if (face === "left") {
        // Left face spans from (-tileW/2, 0) to (0, tileH/2)
        const wx = (-tileW / 2) * (1 - faceProgress) * 0.7;
        const wy = yOff + tileH / 4 * (1 - faceProgress) * 0.5;
        windows.push({ itemId: itemIds[placed], wx, wy, face: "left" });
      } else {
        // Right face spans from (0, tileH/2) to (tileW/2, 0)
        const wx = (tileW / 2) * faceProgress * 0.7;
        const wy = yOff + tileH / 4 * (1 - faceProgress) * 0.5;
        windows.push({ itemId: itemIds[placed], wx, wy, face: "right" });
      }
      placed++;
    }
  }
  return windows;
}

/* ─── Main export ────────────────────────────────────────────────── */

/**
 * Compute the full isometric city layout.
 *
 * Districts are arranged in a 3×2 iso grid, each spanning 5×5 tiles,
 * with 1 tile gap between districts (col step = 6, row step = 6).
 *
 * @param themes DESIGN_THEMES from theme-map.ts
 * @param items all RadarItems (184 papers)
 * @param visibleItemIds active filter set (empty = no filter)
 * @param W SVG canvas width
 * @param H SVG canvas height
 * @param tileScale multiplier for tile dimensions (use 1 for overview, 2.5 for detail)
 */
export function computeDistrictLayout(
  themes: DesignTheme[],
  items: RadarItem[],
  visibleItemIds: Set<string>,
  W: number,
  H: number,
  tileScale = 1
): DistrictLayout[] {
  const TW = TILE_W * tileScale;
  const TH = TILE_H * tileScale;

  // Maximum theme item count across all themes (for log scale)
  const maxCount = Math.max(...themes.map((t) => t.itemIds.length), 1);

  // Iso origin: center the 3×2 grid of 5-tile districts + 1-tile gaps
  // Grid spans iso cols 0..17 (3 districts × 5 tiles + 2 gaps × 1 tile = 17)
  // and iso rows 0..17 similarly.
  // The screen extent: right corner at isoToScreen(18,0) and left at isoToScreen(0,18)
  // span_x = 18 * TW/2 * 2 = 18*TW, center_y = 18*TH/2
  const gridIsoSpan = 18; // iso units from top to bottom/left to right
  const screenWidth = gridIsoSpan * (TW / 2);
  const screenHeight = gridIsoSpan * (TH / 2);

  const originX = (W - screenWidth) / 2 + screenWidth / 2;
  const originY = Math.max(40, (H - screenHeight) / 2) + TH; // some top margin

  return DISTRICT_CONFIG.map((config, idx) => {
    const distCol = (idx % 3) * 6; // 0, 6, 12
    const distRow = Math.floor(idx / 3) * 6; // 0, 6

    // District ground platform center (2.5 tiles from top corner)
    const centerPos = isoToScreen(
      distCol + 2.5,
      distRow + 2.5,
      originX,
      originY,
      TW,
      TH
    );

    const distThemes = themes.filter((t) => config.themeIds.includes(t.id));
    const offsets = buildingOffsets(distThemes.length);
    const isFiltering = visibleItemIds.size > 0;

    const buildings: BuildingLayout[] = distThemes.map((theme, i) => {
      const [dc, dr] = offsets[i] ?? [2, 2];
      const bIsoCol = distCol + dc;
      const bIsoRow = distRow + dr;

      const bPos = isoToScreen(bIsoCol, bIsoRow, originX, originY, TW, TH);

      const matchingItems = theme.itemIds.filter((id) => {
        if (!isFiltering) return true;
        return visibleItemIds.has(id);
      });
      const isGhost =
        isFiltering &&
        theme.itemIds.every((id) => !visibleItemIds.has(id));

      const palette = isGhost ? GHOST_PALETTE : DISTRICT_PALETTES[config.id];
      const bH = buildingHeight(theme.itemIds.length, maxCount) * tileScale;

      const windows = buildingWindows(
        isFiltering ? matchingItems : theme.itemIds,
        TW,
        TH,
        bH
      );

      return {
        themeId: theme.id,
        themeLabel: theme.label,
        sx: bPos.x,
        sy: bPos.y,
        bHeight: bH,
        tileW: TW,
        tileH: TH,
        colorTop: palette.top,
        colorLeft: palette.left,
        colorRight: palette.right,
        isGhost,
        windows,
        sortKey: bIsoCol + bIsoRow, // painter's algorithm key
        themeDescription:
          (theme as DesignTheme & { description?: string }).description ?? "",
        paperCount: theme.itemIds.length,
      };
    });

    // Sort back-to-front: higher sortKey = further back in iso space
    buildings.sort((a, b) => a.sortKey - b.sortKey);

    const isFullyGhost =
      isFiltering &&
      distThemes.every((t) => t.itemIds.every((id) => !visibleItemIds.has(id)));

    const pal = isFullyGhost ? GHOST_PALETTE : DISTRICT_PALETTES[config.id];

    return {
      districtId: config.id,
      label: config.label,
      sx: centerPos.x,
      sy: centerPos.y,
      isoCol: distCol,
      isoRow: distRow,
      buildings,
      palette: pal,
      isFullyGhost,
    };
  });
}

/**
 * Iso building face SVG paths.
 * All coordinates are absolute screen pixels.
 * @param sx screen x of building base center
 * @param sy screen y of building base center (bottom of front edge)
 * @param bH building height in screen pixels
 * @param TW tile width
 * @param TH tile height
 */
export function isoBuildingPaths(
  sx: number,
  sy: number,
  bH: number,
  TW: number,
  TH: number
): { top: string; left: string; right: string } {
  // Base level: the "ground" of the building front = (sx, sy)
  // The iso tile rhombus sits so its front vertex is at (sx, sy + TH/2)
  // But we anchor buildings at the front vertex of their base tile for simplicity.
  // We use the center-bottom of the building base tile as anchor.

  // Top face (rhombus, shifted up by bH):
  const top =
    `M ${sx},${sy - bH} ` +
    `L ${sx + TW / 2},${sy - bH + TH / 2} ` +
    `L ${sx},${sy - bH + TH} ` +
    `L ${sx - TW / 2},${sy - bH + TH / 2} Z`;

  // Left face (parallelogram: from top-left of top face to bottom-left at base):
  const left =
    `M ${sx - TW / 2},${sy - bH + TH / 2} ` +
    `L ${sx},${sy - bH + TH} ` +
    `L ${sx},${sy + TH / 2} ` +
    `L ${sx - TW / 2},${sy} Z`;

  // Right face (parallelogram: from top-right of top face to bottom-right at base):
  const right =
    `M ${sx},${sy - bH + TH} ` +
    `L ${sx + TW / 2},${sy - bH + TH / 2} ` +
    `L ${sx + TW / 2},${sy} ` +
    `L ${sx},${sy + TH / 2} Z`;

  return { top, left, right };
}
