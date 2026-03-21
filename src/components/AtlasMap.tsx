"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect, useReducer } from "react";
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
  const [svgMouse, setSvgMouse] = useState({ x: -2000, y: -2000 });

  // Ghost cursor — lags behind real cursor with inertia for physical weight feel
  const svgMouseRef = useRef({ x: -2000, y: -2000 });
  const smoothedMouse = useRef({ x: -2000, y: -2000 });
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const LERP = 0.10;
    let rafId: number;
    function lerp() {
      const s = smoothedMouse.current;
      s.x += (svgMouseRef.current.x - s.x) * LERP;
      s.y += (svgMouseRef.current.y - s.y) * LERP;
      forceRender();
      rafId = requestAnimationFrame(lerp);
    }
    rafId = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const CURSOR_R = 200;
  const MAX_PUSH = 18;

  function getCursorOffset(cx: number, cy: number) {
    const dx = cx - smoothedMouse.current.x;
    const dy = cy - smoothedMouse.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= CURSOR_R || dist === 0) return { x: 0, y: 0 };
    const f = (1 - dist / CURSOR_R) * MAX_PUSH;
    return { x: (dx / dist) * f, y: (dy / dist) * f };
  }

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
      onMouseMove={(e) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const pos = {
          x: (e.clientX - rect.left) * (SVG_W / rect.width),
          y: (e.clientY - rect.top) * (SVG_H / rect.height),
        };
        setSvgMouse(pos);
        svgMouseRef.current = pos;
      }}
      onMouseLeave={() => {
        setSvgMouse({ x: -2000, y: -2000 });
        svgMouseRef.current = { x: -2000, y: -2000 };
      }}
    >
      <defs>
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

        {/* Pin glow for hover/select */}
        <filter id="pinGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
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

        {/* Territory radial gradient fills — lighter center, deeper edge */}
        <radialGradient id="grad-interactions-modality" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#9bbf9e" />
          <stop offset="100%" stopColor="#7a9e7e" />
        </radialGradient>
        <radialGradient id="grad-workflow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#d4b48a" />
          <stop offset="100%" stopColor="#b8956a" />
        </radialGradient>
        <radialGradient id="grad-roles-boundaries" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#8db0cc" />
          <stop offset="100%" stopColor="#6d8fad" />
        </radialGradient>
        <radialGradient id="grad-governance" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ac8e8e" />
          <stop offset="100%" stopColor="#8b6d6d" />
        </radialGradient>
        <radialGradient id="grad-trust-accountability" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#bfab7e" />
          <stop offset="100%" stopColor="#9e8a5c" />
        </radialGradient>
        <radialGradient id="grad-rituals-norms" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#af9fc8" />
          <stop offset="100%" stopColor="#8e7ea8" />
        </radialGradient>

        {/* Terrain displacement — makes smooth ellipses look like organic landmasses */}
        <filter id="terrainDisplace" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.008"
            numOctaves="3"
            seed="42"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="terrainDisplaceSelected" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.008"
            numOctaves="3"
            seed="42"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="6"
            floodColor="#2d2926"
            floodOpacity="0.12"
            in="displaced"
          />
        </filter>
      </defs>

      {/* Background */}
      <rect
        width={SVG_W}
        height={SVG_H}
        fill="transparent"
        onClick={onMapBackgroundClick}
      />


      {/* Compass rose — clean 4-point cross */}
      <g transform="translate(852, 630)" opacity={0.55} style={{ pointerEvents: "none" }}>
        <line x1={0} y1={-18} x2={0} y2={18} stroke="#9e8a7a" strokeWidth={0.75} />
        <line x1={-18} y1={0} x2={18} y2={0} stroke="#9e8a7a" strokeWidth={0.75} />
        <polygon points="0,-16 3,-8 -3,-8" fill="#9e8a7a" />
        <circle cx={0} cy={0} r={2.5} fill="#f5f0eb" stroke="#9e8a7a" strokeWidth={0.75} />
        <text x={0} y={-22} textAnchor="middle" fontSize={7} fill="#9e8a7a"
          fontFamily="var(--font-inter), system-ui" letterSpacing="0.1em">N</text>
      </g>



      {/* Main zoomable content group */}
      <motion.g
        animate={{
          scale: zoomTransform.scale,
          x: zoomTransform.tx,
          y: zoomTransform.ty,
        }}
        transition={{ type: "spring", stiffness: 65, damping: 26, mass: 1.2 }}
        style={{ transformOrigin: "center center" }}
      >
        {/* ── Territory connection lines (particle-style network) ────────── */}
        {(() => {
          const CONN_DIST = 360;
          const lines: React.ReactElement[] = [];
          for (let i = 0; i < TERRITORIES.length; i++) {
            for (let j = i + 1; j < TERRITORIES.length; j++) {
              const a = TERRITORIES[i];
              const b = TERRITORIES[j];
              const dx = a.center.x - b.center.x;
              const dy = a.center.y - b.center.y;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < CONN_DIST) {
                const opacity = (1 - d / CONN_DIST) * 0.2;
                lines.push(
                  <line
                    key={`conn-${a.id}-${b.id}`}
                    x1={a.center.x}
                    y1={a.center.y}
                    x2={b.center.x}
                    y2={b.center.y}
                    stroke="#b4a090"
                    strokeWidth={0.75}
                    strokeOpacity={opacity}
                    style={{ pointerEvents: "none" }}
                  />
                );
              }
            }
          }
          return lines;
        })()}

        {/* ── Territory layers (back to front) ─────────────────────────── */}
        {/* Render T&A last so it visually overlaps others as a ridge */}
        {[...TERRITORIES]
          .sort((a, b) => (a.id === "trust-accountability" ? 1 : b.id === "trust-accountability" ? -1 : 0))
          .map((territory, index) => {
            const isSelected = selectedTerritoryId === territory.id;
            const isHovered = hoveredTerritory === territory.id;
            const isDimmed =
              emphasizedTerritories !== null &&
              !emphasizedTerritories.has(territory.id);
            const isTrustRidge = territory.id === "trust-accountability";

            const cursorOffset = getCursorOffset(territory.center.x, territory.center.y);
            return (
              <motion.g
                key={territory.id}
                animate={cursorOffset}
                transition={{ type: "spring", stiffness: 75, damping: 22 }}
              >
              <motion.g
                animate={{
                  x: [0, 3, 1, -3, 1, 0],
                  y: [0, -2, 3, 1, -1, 0],
                }}
                transition={{
                  duration: 14 + index * 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 2.3,
                }}
                style={{ cursor: "pointer" }}
                onClick={(e) => handleTerritoryClick(e, territory.id)}
                onMouseEnter={() => setHoveredTerritory(territory.id)}
                onMouseLeave={() => setHoveredTerritory(null)}
              >
                {/* Contour ring 4 (outermost) */}
                <path
                  d={territory.svgPath}
                  fill="none"
                  stroke={territory.strokeColor}
                  strokeWidth={1}
                  strokeOpacity={isDimmed ? 0 : isTrustRidge ? 0.07 : 0.04}
                  filter="url(#terrainDisplace)"
                  style={{
                    transform: `scale(1.19)`,
                    transformOrigin: `${territory.center.x}px ${territory.center.y}px`,
                  }}
                />
                {/* Contour ring 3 */}
                <path
                  d={territory.svgPath}
                  fill="none"
                  stroke={territory.strokeColor}
                  strokeWidth={1}
                  strokeOpacity={isDimmed ? 0 : isTrustRidge ? 0.13 : 0.08}
                  filter="url(#terrainDisplace)"
                  style={{
                    transform: `scale(1.13)`,
                    transformOrigin: `${territory.center.x}px ${territory.center.y}px`,
                  }}
                />
                {/* Contour ring 2 */}
                <path
                  d={territory.svgPath}
                  fill="none"
                  stroke={territory.strokeColor}
                  strokeWidth={1}
                  strokeOpacity={isDimmed ? 0 : isTrustRidge ? 0.20 : 0.14}
                  filter="url(#terrainDisplace)"
                  style={{
                    transform: `scale(1.08)`,
                    transformOrigin: `${territory.center.x}px ${territory.center.y}px`,
                  }}
                />
                {/* Contour ring 1 (innermost) */}
                <path
                  d={territory.svgPath}
                  fill="none"
                  stroke={territory.strokeColor}
                  strokeWidth={1}
                  strokeOpacity={isDimmed ? 0 : isTrustRidge ? 0.30 : 0.22}
                  filter="url(#terrainDisplace)"
                  style={{
                    transform: `scale(1.04)`,
                    transformOrigin: `${territory.center.x}px ${territory.center.y}px`,
                  }}
                />
                {/* White halo behind border (for legibility over any bg) */}
                <path
                  d={territory.svgPath}
                  fill="none"
                  stroke="#f5f0eb"
                  strokeWidth={isDimmed ? 0 : 4}
                  strokeOpacity={isDimmed ? 0 : 0.7}
                  style={{ pointerEvents: "none" }}
                />
                {/* Territory fill */}
                <motion.path
                  d={territory.svgPath}
                  fill={`url(#grad-${territory.id})`}
                  fillOpacity={
                    isDimmed
                      ? 0.12
                      : isTrustRidge
                      ? isSelected || isHovered
                        ? 0.70
                        : 0.55
                      : isSelected || isHovered
                      ? 0.88
                      : 0.72
                  }
                  stroke={territory.strokeColor}
                  strokeWidth={isSelected ? 2.25 : 1.5}
                  strokeOpacity={isDimmed ? 0.12 : isSelected ? 0.85 : 0.55}
                  animate={{
                    fillOpacity: isDimmed
                      ? 0.12
                      : isTrustRidge
                      ? isSelected || isHovered ? 0.70 : 0.55
                      : isSelected || isHovered ? 0.88 : 0.72,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  filter={isSelected ? "url(#terrainDisplaceSelected)" : "url(#terrainDisplace)"}
                />
                {/* Selected ring highlight */}
                {isSelected && (
                  <path
                    d={territory.svgPath}
                    fill="none"
                    stroke={territory.strokeColor}
                    strokeWidth={2.5}
                    strokeOpacity={0.6}
                    strokeDasharray="5,3"
                  />
                )}
                {/* Center node dot */}
                <circle
                  cx={territory.center.x}
                  cy={territory.center.y}
                  r={isDimmed ? 2 : isSelected || isHovered ? 5 : 3.5}
                  fill={territory.color}
                  fillOpacity={isDimmed ? 0.3 : 0.95}
                  stroke="#f5f0eb"
                  strokeWidth={1.5}
                  strokeOpacity={isDimmed ? 0 : 0.8}
                  style={{ pointerEvents: "none" }}
                />
              </motion.g>
              </motion.g>
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
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
                  filter="url(#pinGlow)"
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

        {/* ── Guided route path (always visible) ───────────────────── */}
        {/* Workflow → Roles+Boundaries → Interactions → Trust → Governance */}
        <polyline
          points="400,555 420,278 155,462 690,370 778,118"
          fill="none"
          stroke="#a4783a"
          strokeWidth={1.25}
          strokeDasharray="5,4"
          strokeOpacity={0.45}
          strokeLinejoin="round"
          style={{ pointerEvents: "none" }}
        />

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
