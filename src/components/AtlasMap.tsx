"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RadarItem, CompareMode } from "../types";
import {
  TERRITORIES,
  NEIGHBORHOODS,
  SOURCE_ASSIGNMENT_MAP,
  TERRITORY_MAP,
} from "../data/atlas-data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourcePin {
  itemId: string;
  x: number;
  y: number;
  source: "research" | "industry";
  title: string;
  territoryId: string;
}

interface Props {
  items: RadarItem[];
  selectedTerritoryId: string | null;
  selectedNeighborhoodId: string | null;
  selectedSourceId: string | null;
  activeRouteStopFocusId: string | null;
  compareMode: CompareMode;
  onTerritoryClick: (id: string) => void;
  onNeighborhoodClick: (id: string) => void;
  onSourceClick: (item: RadarItem) => void;
  onMapBackgroundClick: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SVG_W = 900;
const SVG_H = 680;

// Deterministic position scatter within territory bounds
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Half-height of the elliptical label exclusion zone (SVG units)
const LABEL_CLEAR_H = 18;

function getSourcePin(
  itemId: string,
  territory: (typeof TERRITORIES)[0]
): { x: number; y: number } {
  const h = hashStr(itemId);
  const angle = ((h % 628) / 100); // 0 … ~6.28
  const radius = (h % 52) + 18;   // 18–70 px from center

  let x = territory.center.x + Math.cos(angle) * radius;
  let y = territory.center.y + Math.sin(angle) * radius;

  // ── Label exclusion zone ─────────────────────────────────────────────────
  // Keep pins clear of the territory name label. The exclusion zone is an
  // ellipse whose horizontal semi-axis is proportional to the text length and
  // whose vertical semi-axis is fixed at LABEL_CLEAR_H.
  const lx = territory.labelPos.x;
  const ly = territory.labelPos.y - 7; // vertical center of the rendered text
  const labelW = territory.name.length * 4.5 + 14; // approx half-width in SVG units

  const nx = (x - lx) / labelW;
  const ny = (y - ly) / LABEL_CLEAR_H;

  if (nx * nx + ny * ny < 1) {
    // Pin falls inside the ellipse — push it just outside along the same direction
    const pushAngle = Math.atan2(y - ly, x - lx);
    const cos = Math.cos(pushAngle);
    const sin = Math.sin(pushAngle);
    // Ellipse radius at this angle: r = ab / sqrt(b²cos² + a²sin²)
    const ellipseR =
      (labelW * LABEL_CLEAR_H) /
      Math.sqrt(
        LABEL_CLEAR_H * LABEL_CLEAR_H * cos * cos +
          labelW * labelW * sin * sin
      );
    x = lx + Math.cos(pushAngle) * (ellipseR + 8);
    y = ly + Math.sin(pushAngle) * (ellipseR + 8);
  }

  return { x, y };
}

// ─── Contour helpers ──────────────────────────────────────────────────────────

/** Expand/contract an SVG path very roughly by offsetting the scale around center */
function scalePath(
  path: string,
  cx: number,
  cy: number,
  scale: number
): string {
  return path.replace(/-?\d+\.?\d*/g, (match, offset, str) => {
    // Identify if this number is an X or Y coordinate by counting preceding numbers
    // Simple heuristic: all numbers in the path are coordinates
    return match; // We use SVG transform instead
  });
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function PinTooltip({
  title,
  x,
  y,
}: {
  title: string;
  x: number;
  y: number;
}) {
  const lines: string[] = [];
  let word = "";
  const maxChars = 28;
  for (const w of title.split(" ")) {
    if ((word + " " + w).trim().length > maxChars) {
      if (word) lines.push(word);
      word = w;
    } else {
      word = word ? word + " " + w : w;
    }
  }
  if (word) lines.push(word);
  const tipW = 160;
  const tipH = lines.length * 14 + 12;
  const tx = Math.min(x - tipW / 2, SVG_W - tipW - 8);
  const ty = y - tipH - 10;

  return (
    <g style={{ pointerEvents: "none" }}>
      <rect
        x={tx}
        y={Math.max(ty, 4)}
        width={tipW}
        height={tipH}
        rx={4}
        fill="#2d2926"
        fillOpacity={0.92}
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={tx + 8}
          y={Math.max(ty, 4) + 14 + i * 14}
          fontSize={10}
          fill="#f7f4ee"
          fontFamily="var(--font-inter), system-ui, sans-serif"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AtlasMap({
  items,
  selectedTerritoryId,
  selectedNeighborhoodId,
  selectedSourceId,
  activeRouteStopFocusId,
  compareMode,
  onTerritoryClick,
  onNeighborhoodClick,
  onSourceClick,
  onMapBackgroundClick,
}: Props) {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [hoveredTerritory, setHoveredTerritory] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build source pins from items + source assignments
  const sourcePins = useMemo<SourcePin[]>(() => {
    const pins: SourcePin[] = [];
    for (const item of items) {
      const assignment = SOURCE_ASSIGNMENT_MAP.get(item.id);
      if (!assignment) continue;
      if (compareMode === "research" && item.source !== "research") continue;
      if (compareMode === "industry" && item.source !== "industry") continue;
      const territory = TERRITORY_MAP.get(assignment.primary_territory);
      if (!territory) continue;
      const pos = getSourcePin(item.id, territory);
      pins.push({
        itemId: item.id,
        x: pos.x,
        y: pos.y,
        source: item.source,
        title: item.title,
        territoryId: assignment.primary_territory,
      });
    }
    return pins;
  }, [items, compareMode]);

  // Compute zoom transform for selected territory or route stop
  const focusId = activeRouteStopFocusId ?? selectedTerritoryId;
  const focusedTerritory = focusId ? TERRITORY_MAP.get(focusId) : null;

  const zoomTransform = useMemo(() => {
    if (!focusedTerritory) return { scale: 1, tx: 0, ty: 0 };
    const scale = 1.65;
    const tx = SVG_W / 2 - focusedTerritory.center.x * scale;
    const ty = SVG_H / 2 - focusedTerritory.center.y * scale;
    return { scale, tx, ty };
  }, [focusedTerritory]);

  const handleTerritoryClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onTerritoryClick(id);
    },
    [onTerritoryClick]
  );

  const handlePinClick = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      const item = items.find((i) => i.id === itemId);
      if (item) onSourceClick(item);
    },
    [items, onSourceClick]
  );

  const handleNeighborhoodLabelClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onNeighborhoodClick(id);
    },
    [onNeighborhoodClick]
  );

  // Route focus takes priority over manual territory selection
  const effectiveFocusId = activeRouteStopFocusId ?? selectedTerritoryId;

  // Which territories to visually emphasize
  const emphasizedTerritories = useMemo(() => {
    if (effectiveFocusId) return new Set([effectiveFocusId]);
    return null; // null = all equal
  }, [effectiveFocusId]);

  // Neighborhoods to show labels for
  const visibleNeighborhoods = useMemo(() => {
    if (effectiveFocusId) {
      return NEIGHBORHOODS.filter((n) =>
        n.territory_ids.includes(effectiveFocusId)
      );
    }
    return [];
  }, [effectiveFocusId]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width="100%"
      height="100%"
      style={{ display: "block", cursor: "default" }}
      onClick={onMapBackgroundClick}
    >
      <defs>
        {/* Parchment texture filter */}
        <filter id="parchment" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="grayNoise"
          />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>

        {/* Soft drop shadow for territories */}
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="6"
            floodColor="#2d2926"
            floodOpacity="0.08"
          />
        </filter>

        {/* Glow for selected territory */}
        <filter id="glow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Research pin gradient */}
        <radialGradient id="researchPin" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#6d8fad" stopOpacity="1" />
          <stop offset="100%" stopColor="#3d5f7d" stopOpacity="1" />
        </radialGradient>

        {/* Industry pin gradient */}
        <radialGradient id="industryPin" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#d4a85a" stopOpacity="1" />
          <stop offset="100%" stopColor="#a4783a" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect
        width={SVG_W}
        height={SVG_H}
        fill="#f7f3ed"
        onClick={onMapBackgroundClick}
      />

      {/* Very subtle background grid lines for map feel */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={`hg-${i}`}
          x1={0}
          y1={(SVG_H / 12) * i}
          x2={SVG_W}
          y2={(SVG_H / 12) * i}
          stroke="#e8e2d8"
          strokeWidth={0.5}
          strokeOpacity={0.5}
        />
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <line
          key={`vg-${i}`}
          x1={(SVG_W / 16) * i}
          y1={0}
          x2={(SVG_W / 16) * i}
          y2={SVG_H}
          stroke="#e8e2d8"
          strokeWidth={0.5}
          strokeOpacity={0.5}
        />
      ))}

      {/* Subtle compass rose / orientation mark */}
      <g transform="translate(856, 636)" opacity={0.3}>
        <circle cx={0} cy={0} r={16} fill="none" stroke="#9e8a7a" strokeWidth={0.75} />
        <text x={0} y={-20} textAnchor="middle" fontSize={7} fill="#9e8a7a" fontFamily="var(--font-inter), system-ui">N</text>
        <line x1={0} y1={-14} x2={0} y2={14} stroke="#9e8a7a" strokeWidth={0.75} />
        <line x1={-14} y1={0} x2={14} y2={0} stroke="#9e8a7a" strokeWidth={0.75} />
        <polygon points="0,-12 3,-4 0,-8 -3,-4" fill="#9e8a7a" />
      </g>

      {/* Layer gradient legend (subtle) */}
      <g transform="translate(20, 600)" opacity={0.35}>
        <text fontSize={7} fill="#9e8a7a" fontFamily="var(--font-inter), system-ui" letterSpacing="0.08em" textAnchor="start">
          TASK
        </text>
        <line x1={0} y1={4} x2={0} y2={-52} stroke="#9e8a7a" strokeWidth={0.75} strokeDasharray="2,3"/>
        <text fontSize={7} fill="#9e8a7a" fontFamily="var(--font-inter), system-ui" letterSpacing="0.08em" textAnchor="start" y={-58}>
          ORG
        </text>
      </g>

      {/* Main zoomable content group */}
      <motion.g
        animate={{
          scale: zoomTransform.scale,
          x: zoomTransform.tx,
          y: zoomTransform.ty,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
        style={{ transformOrigin: "center center" }}
      >
        {/* ── Territory layers (back to front) ─────────────────────────── */}
        {/* Render T&A last so it visually overlaps others as a ridge */}
        {[...TERRITORIES]
          .sort((a, b) => (a.id === "trust-accountability" ? 1 : b.id === "trust-accountability" ? -1 : 0))
          .map((territory) => {
            const isSelected = selectedTerritoryId === territory.id;
            const isHovered = hoveredTerritory === territory.id;
            const isDimmed =
              emphasizedTerritories !== null &&
              !emphasizedTerritories.has(territory.id);
            const isTrustRidge = territory.id === "trust-accountability";

            return (
              <g
                key={territory.id}
                style={{ cursor: "pointer" }}
                onClick={(e) => handleTerritoryClick(e, territory.id)}
                onMouseEnter={() => setHoveredTerritory(territory.id)}
                onMouseLeave={() => setHoveredTerritory(null)}
              >
                {/* Contour ring 2 (outermost) */}
                <path
                  d={territory.svgPath}
                  fill="none"
                  stroke={territory.strokeColor}
                  strokeWidth={isTrustRidge ? 1.5 : 1}
                  strokeOpacity={isDimmed ? 0.05 : isTrustRidge ? 0.12 : 0.08}
                  style={{
                    transform: `scale(1.06)`,
                    transformOrigin: `${territory.center.x}px ${territory.center.y}px`,
                  }}
                />
                {/* Contour ring 1 */}
                <path
                  d={territory.svgPath}
                  fill="none"
                  stroke={territory.strokeColor}
                  strokeWidth={isTrustRidge ? 1.5 : 1}
                  strokeOpacity={isDimmed ? 0.05 : isTrustRidge ? 0.18 : 0.12}
                  style={{
                    transform: `scale(1.03)`,
                    transformOrigin: `${territory.center.x}px ${territory.center.y}px`,
                  }}
                />
                {/* Territory fill */}
                <motion.path
                  d={territory.svgPath}
                  fill={territory.color}
                  fillOpacity={
                    isDimmed
                      ? 0.04
                      : isTrustRidge
                      ? isSelected || isHovered
                        ? 0.22
                        : 0.1
                      : isSelected || isHovered
                      ? 0.32
                      : 0.18
                  }
                  stroke={territory.strokeColor}
                  strokeWidth={isSelected ? 1.5 : 0.75}
                  strokeOpacity={isDimmed ? 0.06 : isSelected ? 0.6 : 0.3}
                  animate={{
                    fillOpacity: isDimmed
                      ? 0.04
                      : isTrustRidge
                      ? isSelected || isHovered ? 0.22 : 0.1
                      : isSelected || isHovered ? 0.32 : 0.18,
                  }}
                  transition={{ duration: 0.25 }}
                  filter={isSelected ? "url(#softShadow)" : undefined}
                />
                {/* Selected ring highlight */}
                {isSelected && (
                  <path
                    d={territory.svgPath}
                    fill="none"
                    stroke={territory.strokeColor}
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    strokeDasharray="4,3"
                  />
                )}
              </g>
            );
          })}

        {/* ── Neighborhood labels (shown when territory selected) ───────── */}
        <AnimatePresence>
          {visibleNeighborhoods.map((neighborhood) => {
            const isSelectedNeighborhood =
              selectedNeighborhoodId === neighborhood.id;
            return (
              <motion.g
                key={`nh-${neighborhood.id}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                style={{ cursor: "pointer" }}
                onClick={(e) =>
                  handleNeighborhoodLabelClick(e, neighborhood.id)
                }
              >
                {/* Neighborhood dot marker */}
                <circle
                  cx={neighborhood.labelPos.x}
                  cy={neighborhood.labelPos.y - 8}
                  r={2.5}
                  fill={
                    TERRITORY_MAP.get(neighborhood.territory_ids[0])?.color ??
                    "#888"
                  }
                  fillOpacity={isSelectedNeighborhood ? 0.9 : 0.5}
                />
                {/* Neighborhood label */}
                <text
                  x={neighborhood.labelPos.x + 6}
                  y={neighborhood.labelPos.y - 5}
                  fontSize={9}
                  fontStyle="italic"
                  fill="#3a3530"
                  fillOpacity={isSelectedNeighborhood ? 0.95 : 0.65}
                  fontFamily="var(--font-dm-serif), Georgia, serif"
                  fontWeight={isSelectedNeighborhood ? "600" : "400"}
                >
                  {neighborhood.name}
                </text>
                {isSelectedNeighborhood && (
                  <line
                    x1={neighborhood.labelPos.x + 6}
                    y1={neighborhood.labelPos.y - 3}
                    x2={
                      neighborhood.labelPos.x +
                      6 +
                      neighborhood.name.length * 5.2
                    }
                    y2={neighborhood.labelPos.y - 3}
                    stroke="#3a3530"
                    strokeWidth={0.75}
                    strokeOpacity={0.5}
                  />
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* ── Source pins ───────────────────────────────────────────────── */}
        {sourcePins.map((pin) => {
          const isSelected = selectedSourceId === pin.itemId;
          const isHovered = hoveredPin === pin.itemId;
          const isDimmed =
            emphasizedTerritories !== null &&
            !emphasizedTerritories.has(pin.territoryId);
          const isResearch = pin.source === "research";

          return (
            <g
              key={`pin-${pin.itemId}`}
              style={{ cursor: "pointer" }}
              onClick={(e) => handlePinClick(e, pin.itemId)}
              onMouseEnter={() => setHoveredPin(pin.itemId)}
              onMouseLeave={() => setHoveredPin(null)}
            >
              {/* Selection/hover ring */}
              {(isSelected || isHovered) && (
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r={isSelected ? 7 : 5.5}
                  fill="none"
                  stroke={isResearch ? "#6d8fad" : "#d4a85a"}
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                />
              )}
              {/* Research pin: filled circle */}
              {isResearch ? (
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r={isSelected ? 4.5 : 3.5}
                  fill="url(#researchPin)"
                  fillOpacity={isDimmed ? 0.1 : isSelected ? 1 : 0.75}
                  stroke="#fff"
                  strokeWidth={0.75}
                  strokeOpacity={isDimmed ? 0.1 : 0.6}
                />
              ) : (
                /* Industry pin: diamond */
                <g
                  transform={`translate(${pin.x}, ${pin.y}) rotate(45)`}
                  opacity={isDimmed ? 0.1 : isSelected ? 1 : 0.75}
                >
                  <rect
                    x={-3}
                    y={-3}
                    width={6}
                    height={6}
                    fill="url(#industryPin)"
                    stroke="#fff"
                    strokeWidth={0.75}
                    strokeOpacity={0.6}
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* ── Territory labels — rendered last so they always float above pins ── */}
        {TERRITORIES.map((territory) => {
          const isDimmed =
            emphasizedTerritories !== null &&
            !emphasizedTerritories.has(territory.id);
          const isSelected = selectedTerritoryId === territory.id;
          const isTrustRidge = territory.id === "trust-accountability";

          return (
            <g
              key={`label-${territory.id}`}
              style={{ pointerEvents: "none" }}
            >
              {/* Landmark name (italic, smaller) */}
              {territory.landmark_name && !isDimmed && (
                <text
                  x={territory.labelPos.x}
                  y={territory.labelPos.y - 22}
                  textAnchor="middle"
                  fontSize={9.5}
                  fontStyle="italic"
                  fill={territory.strokeColor}
                  fillOpacity={isDimmed ? 0.1 : 0.6}
                  stroke="#f5f0eb"
                  strokeWidth={3}
                  strokeOpacity={isDimmed ? 0 : 0.7}
                  paintOrder="stroke fill"
                  fontFamily="var(--font-dm-serif), Georgia, serif"
                  letterSpacing="0.02em"
                >
                  {territory.landmark_name}
                </text>
              )}
              {/* Territory name — halo stroke paints first, crisp fill on top */}
              <text
                x={territory.labelPos.x}
                y={territory.labelPos.y}
                textAnchor="middle"
                fontSize={isTrustRidge ? 13 : 14.5}
                fontWeight={isSelected ? "700" : "600"}
                fill={territory.strokeColor}
                fillOpacity={isDimmed ? 0.15 : isSelected ? 1 : 0.88}
                stroke="#f5f0eb"
                strokeWidth={5}
                strokeOpacity={isDimmed ? 0 : 0.9}
                paintOrder="stroke fill"
                fontFamily="var(--font-dm-serif), Georgia, serif"
                letterSpacing="0.04em"
                style={{ textTransform: "uppercase" }}
              >
                {territory.name.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Tooltip for hovered pin */}
        <AnimatePresence>
          {hoveredPin && (() => {
            const pin = sourcePins.find((p) => p.itemId === hoveredPin);
            if (!pin) return null;
            return (
              <motion.g
                key={`tooltip-${hoveredPin}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                style={{ pointerEvents: "none" }}
              >
                <PinTooltip title={pin.title} x={pin.x} y={pin.y} />
              </motion.g>
            );
          })()}
        </AnimatePresence>
      </motion.g>

      {/* ── Map legend ─────────────────────────────────────────────── */}
      <g transform="translate(20, 20)" style={{ pointerEvents: "none" }}>
        {/* Research pin legend */}
        <circle cx={6} cy={8} r={3.5} fill="url(#researchPin)" />
        <text
          x={14}
          y={12}
          fontSize={9}
          fill="#6b6560"
          fontFamily="var(--font-inter), system-ui, sans-serif"
        >
          Research
        </text>
        {/* Industry pin legend */}
        <g transform="translate(6, 24) rotate(45)">
          <rect x={-3} y={-3} width={6} height={6} fill="url(#industryPin)" />
        </g>
        <text
          x={14}
          y={28}
          fontSize={9}
          fill="#6b6560"
          fontFamily="var(--font-inter), system-ui, sans-serif"
        >
          Industry
        </text>
      </g>
    </svg>
  );
}
