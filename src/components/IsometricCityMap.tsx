"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadarItem } from "../types";
import { DESIGN_THEMES } from "../data/theme-map";
import {
  computeDistrictLayout,
  isoBuildingPaths,
  isoRectPath,
  isoToScreen,
  DISTRICT_PALETTES,
  GHOST_PALETTE,
  TILE_W,
  TILE_H,
  type CityDistrict,
  type DistrictLayout,
  type BuildingLayout,
} from "../utils/isoLayout";

/* ─── Props ──────────────────────────────────────────────────────── */

interface IsometricCityMapProps {
  items: RadarItem[];
  visibleItemIds: Set<string>;
  selectedItem: RadarItem | null;
  onItemClick: (item: RadarItem) => void;
  onExpandTheme: (themeId: string | null) => void;
  expandedThemeId: string | null;
}

/* ─── Constants ──────────────────────────────────────────────────── */

const OUTLINE = "#2D2926";
const OUTLINE_OPACITY = 0.65;
const WINDOW_FILL = "rgba(255, 243, 185, 0.85)";
const WINDOW_W = 7;
const WINDOW_H = 9;

/* ─── Component ──────────────────────────────────────────────────── */

export default function IsometricCityMap({
  items,
  visibleItemIds,
  onItemClick,
  onExpandTheme,
  expandedThemeId,
}: IsometricCityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 680 });
  const [hoveredDistrict, setHoveredDistrict] = useState<CityDistrict | null>(null);
  const [expandedDistrict, setExpandedDistrict] = useState<CityDistrict | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    description: string;
  } | null>(null);

  /* ── Responsive sizing ─────────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { width: W, height: H } = dimensions;

  /* ── Layout computation ────────────────────────────────────────── */
  const overviewLayout = useMemo(
    () =>
      computeDistrictLayout(DESIGN_THEMES, items, visibleItemIds, W, H, 1),
    [items, visibleItemIds, W, H]
  );

  const detailLayout = useMemo(() => {
    if (!expandedDistrict) return null;
    return computeDistrictLayout(DESIGN_THEMES, items, visibleItemIds, W, H, 2.8);
  }, [expandedDistrict, items, visibleItemIds, W, H]);

  /* ── Handlers ─────────────────────────────────────────────────── */
  const handleDistrictClick = useCallback((districtId: CityDistrict) => {
    setExpandedDistrict(districtId);
    setHoveredDistrict(null);
  }, []);

  const handleBack = useCallback(() => {
    setExpandedDistrict(null);
    setHoveredDistrict(null);
    setHoveredItemId(null);
    setTooltip(null);
  }, []);

  const handleWindowHover = useCallback(
    (itemId: string | null, e: React.MouseEvent | null) => {
      setHoveredItemId(itemId);
      if (!itemId || !e) {
        setTooltip(null);
        return;
      }
      const item = items.find((it) => it.id === itemId);
      const rect = containerRef.current?.getBoundingClientRect();
      if (item && rect) {
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          title: item.title,
          description: item.summary?.slice(0, 120) + "…",
        });
      }
    },
    [items]
  );

  const handleWindowClick = useCallback(
    (itemId: string) => {
      const item = items.find((it) => it.id === itemId);
      if (item) {
        onItemClick(item);
        const theme = DESIGN_THEMES.find((t) => t.itemIds.includes(itemId));
        if (theme) onExpandTheme(theme.id);
      }
    },
    [items, onItemClick, onExpandTheme]
  );

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "var(--canvas-bg, #f8f6f2)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Back button */}
      <AnimatePresence>
        {expandedDistrict && (
          <motion.button
            key="back"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            onClick={handleBack}
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px 6px 10px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(45,41,38,0.18)",
              color: OUTLINE,
              fontSize: 12,
              letterSpacing: "0.06em",
              fontWeight: 600,
              cursor: "pointer",
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            ← Overview
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overview mode */}
      <AnimatePresence mode="wait">
        {!expandedDistrict ? (
          <motion.svg
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            width={W}
            height={H}
            style={{ display: "block" }}
          >
            <defs>
              <filter id="window-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="district-lift" x="-10%" y="-30%" width="120%" height="160%">
                <feDropShadow dx="2" dy="-4" stdDeviation="4" floodOpacity="0.12" />
              </filter>
            </defs>

            {overviewLayout.map((district) => (
              <DistrictOverview
                key={district.districtId}
                district={district}
                W={W}
                H={H}
                isHovered={hoveredDistrict === district.districtId}
                isOtherHovered={!!hoveredDistrict && hoveredDistrict !== district.districtId}
                onHoverStart={() => setHoveredDistrict(district.districtId)}
                onHoverEnd={() => setHoveredDistrict(null)}
                onClick={() => handleDistrictClick(district.districtId)}
              />
            ))}
          </motion.svg>
        ) : (
          <motion.div
            key={`detail-${expandedDistrict}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: "100%", height: "100%" }}
          >
            {detailLayout && (
              <DistrictDetailView
                district={
                  detailLayout.find((d) => d.districtId === expandedDistrict)!
                }
                allItems={items}
                hoveredItemId={hoveredItemId}
                onWindowHover={handleWindowHover}
                onWindowClick={handleWindowClick}
                W={W}
                H={H}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: Math.min(tooltip.x + 16, W - 280),
            top: Math.max(tooltip.y - 60, 10),
            maxWidth: 260,
            background: "rgba(255,252,248,0.97)",
            border: "1.5px solid rgba(45,41,38,0.14)",
            borderRadius: 10,
            padding: "10px 14px",
            pointerEvents: "none",
            zIndex: 30,
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: OUTLINE,
              margin: 0,
              marginBottom: 4,
              letterSpacing: "0.02em",
              lineHeight: 1.3,
            }}
          >
            {tooltip.title}
          </p>
          <p
            style={{
              fontSize: 10,
              color: "rgba(45,41,38,0.6)",
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {tooltip.description}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── District overview component ───────────────────────────────── */

interface DistrictOverviewProps {
  district: DistrictLayout;
  W: number;
  H: number;
  isHovered: boolean;
  isOtherHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
}

function DistrictOverview({
  district,
  W,
  H,
  isHovered,
  isOtherHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
}: DistrictOverviewProps) {
  const { isoCol, isoRow } = district;
  const originX = computeOriginX(W);
  const originY = computeOriginY(H);

  const groundPath = isoRectPath(isoCol, isoRow, 5, 5, originX, originY);

  const labelLines = district.label.split("\n");

  return (
    <motion.g
      animate={{
        opacity: isOtherHovered ? 0.5 : 1,
        y: isHovered ? -6 : 0,
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{ cursor: "pointer" }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
      filter={isHovered ? "url(#district-lift)" : undefined}
    >
      {/* Ground platform */}
      <path
        d={groundPath}
        fill={district.palette.ground}
        fillOpacity={0.6}
        stroke={OUTLINE}
        strokeWidth={0.5}
        strokeOpacity={OUTLINE_OPACITY * 0.5}
      />

      {/* Buildings */}
      {district.buildings.map((b) => (
        <IsoBuilding key={b.themeId} building={b} showWindows={false} />
      ))}

      {/* District label */}
      <DistrictLabel
        lines={labelLines}
        sx={district.sx}
        sy={district.sy + district.buildings.reduce((max, b) => Math.max(max, b.bHeight), 0) + TILE_H}
        isHovered={isHovered}
      />

      {/* Hover "click to explore" hint */}
      {isHovered && (
        <text
          x={district.sx}
          y={district.sy + district.buildings.reduce((max, b) => Math.max(max, b.bHeight), 0) + TILE_H + 26}
          textAnchor="middle"
          fontSize={9}
          fill={OUTLINE}
          opacity={0.45}
          style={{ pointerEvents: "none" }}
        >
          click to explore
        </text>
      )}
    </motion.g>
  );
}

/* ─── District detail view ───────────────────────────────────────── */

interface DistrictDetailViewProps {
  district: DistrictLayout;
  allItems: RadarItem[];
  hoveredItemId: string | null;
  onWindowHover: (itemId: string | null, e: React.MouseEvent | null) => void;
  onWindowClick: (itemId: string) => void;
  W: number;
  H: number;
}

function DistrictDetailView({
  district,
  allItems,
  hoveredItemId,
  onWindowHover,
  onWindowClick,
  W,
  H,
}: DistrictDetailViewProps) {
  const { isoCol, isoRow } = district;
  const TW = district.buildings[0]?.tileW ?? TILE_W * 2.8;
  const TH = district.buildings[0]?.tileH ?? TILE_H * 2.8;

  // For detail view, recompute origin to center the single district
  const originX = computeOriginX(W);
  const originY = computeOriginY(H);

  const groundPath = isoRectPath(isoCol, isoRow, 5, 5, originX, originY, TW, TH);
  const labelLines = district.label.split("\n");

  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <defs>
        <filter id="window-glow-detail" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ground platform */}
      <path
        d={groundPath}
        fill={district.palette.ground}
        fillOpacity={0.55}
        stroke={OUTLINE}
        strokeWidth={0.6}
        strokeOpacity={OUTLINE_OPACITY * 0.5}
      />

      {/* Buildings with interactive windows */}
      {district.buildings.map((b) => (
        <g key={b.themeId}>
          <IsoBuilding
            building={b}
            showWindows={true}
            hoveredItemId={hoveredItemId}
            onWindowHover={onWindowHover}
            onWindowClick={onWindowClick}
          />
          {/* Theme label above building */}
          <text
            x={b.sx}
            y={b.sy - b.bHeight - b.tileH * 0.3}
            textAnchor="middle"
            fontSize={Math.max(9, b.tileW * 0.15)}
            fontWeight={600}
            fill={OUTLINE}
            opacity={0.7}
            style={{ pointerEvents: "none" }}
            fontFamily="var(--font-dm-serif), Georgia, serif"
          >
            {b.themeLabel}
          </text>
          <text
            x={b.sx}
            y={b.sy - b.bHeight - b.tileH * 0.3 + 14}
            textAnchor="middle"
            fontSize={Math.max(7.5, b.tileW * 0.11)}
            fill={OUTLINE}
            opacity={0.45}
            style={{ pointerEvents: "none" }}
          >
            {b.paperCount} papers
          </text>
        </g>
      ))}

      {/* District name top-left */}
      <text
        x={W / 2}
        y={28}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        letterSpacing="0.12em"
        fill={OUTLINE}
        opacity={0.55}
        style={{ pointerEvents: "none" }}
      >
        {district.label.replace("\n", " ").toUpperCase()}
      </text>
    </svg>
  );
}

/* ─── Isometric building ─────────────────────────────────────────── */

interface IsoBuildingProps {
  building: BuildingLayout;
  showWindows: boolean;
  hoveredItemId?: string | null;
  onWindowHover?: (itemId: string | null, e: React.MouseEvent | null) => void;
  onWindowClick?: (itemId: string) => void;
}

function IsoBuilding({
  building,
  showWindows,
  hoveredItemId,
  onWindowHover,
  onWindowClick,
}: IsoBuildingProps) {
  const { sx, sy, bHeight, tileW, tileH, colorTop, colorLeft, colorRight, isGhost, windows } =
    building;
  const { top, left, right } = isoBuildingPaths(sx, sy, bHeight, tileW, tileH);

  const opacity = isGhost ? 0.35 : 1;
  const strokeW = tileW <= TILE_W ? 0.8 : 1.2;

  return (
    <g opacity={opacity}>
      {/* Left face */}
      <path
        d={left}
        fill={colorLeft}
        stroke={OUTLINE}
        strokeWidth={strokeW}
        strokeOpacity={OUTLINE_OPACITY}
        strokeLinejoin="round"
      />
      {/* Right face */}
      <path
        d={right}
        fill={colorRight}
        stroke={OUTLINE}
        strokeWidth={strokeW}
        strokeOpacity={OUTLINE_OPACITY}
        strokeLinejoin="round"
      />
      {/* Top face (rendered last = on top) */}
      <path
        d={top}
        fill={colorTop}
        stroke={OUTLINE}
        strokeWidth={strokeW}
        strokeOpacity={OUTLINE_OPACITY}
        strokeLinejoin="round"
      />

      {/* Windows */}
      {showWindows &&
        windows.map((win, i) => {
          const isWinHovered = hoveredItemId === win.itemId;
          const wW = tileW <= TILE_W ? WINDOW_W : WINDOW_W * 2.2;
          const wH = tileH <= TILE_H ? WINDOW_H : WINDOW_H * 2.2;
          return (
            <g
              key={`win-${i}`}
              transform={`translate(${sx + win.wx}, ${sy + win.wy})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => onWindowHover?.(win.itemId, e)}
              onMouseLeave={() => onWindowHover?.(null, null)}
              onClick={() => onWindowClick?.(win.itemId)}
            >
              <rect
                x={-wW / 2}
                y={-wH / 2}
                width={wW}
                height={wH}
                fill={isWinHovered ? "#FFE566" : WINDOW_FILL}
                stroke={OUTLINE}
                strokeWidth={0.6}
                strokeOpacity={0.55}
                rx={0.5}
                filter={isWinHovered ? "url(#window-glow-detail)" : undefined}
              />
            </g>
          );
        })}
    </g>
  );
}

/* ─── District label ─────────────────────────────────────────────── */

function DistrictLabel({
  lines,
  sx,
  sy,
  isHovered,
}: {
  lines: string[];
  sx: number;
  sy: number;
  isHovered: boolean;
}) {
  return (
    <text
      x={sx}
      y={sy}
      textAnchor="middle"
      fontFamily="var(--font-inter), system-ui, sans-serif"
      fontSize={10}
      fontWeight={700}
      letterSpacing="0.09em"
      fill={OUTLINE}
      opacity={isHovered ? 0.85 : 0.55}
      style={{ pointerEvents: "none" }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={sx} dy={i === 0 ? 0 : 13}>
          {line.toUpperCase()}
        </tspan>
      ))}
    </text>
  );
}

/* ─── Origin helpers ─────────────────────────────────────────────── */

/**
 * Compute the svg origin X so the 3×2 iso grid of 5-tile districts is
 * roughly centered horizontally. Grid spans iso cols 0..17.
 */
function computeOriginX(W: number): number {
  // At scale=1: rightmost screen point = isoToScreen(18,0).x = originX + 18 * TILE_W/2
  // leftmost  = isoToScreen(0,18).x = originX - 18 * TILE_W/2
  // Total screen span = 18 * TILE_W → center = W/2
  return W / 2;
}

function computeOriginY(H: number): number {
  // Top = isoToScreen(0,0).y = originY
  // Bottom = isoToScreen(18,18).y = originY + 18 * TILE_H
  // Center roughly at originY + 9 * TILE_H = H/2 → originY = H/2 - 9*TILE_H
  return Math.max(H / 2 - 9 * TILE_H, 40);
}
