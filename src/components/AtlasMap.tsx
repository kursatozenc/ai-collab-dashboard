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

// ─── Landmark icons ───────────────────────────────────────────────────────────

function LandmarkIcon({ id, cx, cy, stroke }: { id: string; cx: number; cy: number; stroke: string }) {
  const s = { stroke, fill: "none", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const x = cx - 16;
  const y = cy + 14;
  switch (id) {
    case "governance":
      // Domed building: base, steps, columns, dome
      return <g style={{ pointerEvents: "none" }}>
        <line x1={x} y1={y+10} x2={x+20} y2={y+10} {...s} />
        <line x1={x+2} y1={y+8} x2={x+18} y2={y+8} {...s} />
        <line x1={x+4} y1={y+6} x2={x+16} y2={y+6} {...s} />
        <line x1={x+7} y1={y+6} x2={x+7} y2={y+1} {...s} />
        <line x1={x+13} y1={y+6} x2={x+13} y2={y+1} {...s} />
        <path d={`M ${x+4} ${y+1} Q ${x+10} ${y-5} ${x+16} ${y+1}`} {...s} />
      </g>;
    case "trust-accountability":
      // Lighthouse: tower + 3 light rays
      return <g style={{ pointerEvents: "none" }}>
        <rect x={x+7} y={y} width={6} height={12} {...s} />
        <line x1={x+10} y1={y} x2={x+10} y2={y-2} {...s} />
        <line x1={x+10} y1={y-2} x2={x+18} y2={y-6} {...s} />
        <line x1={x+10} y1={y-2} x2={x+18} y2={y-2} {...s} />
        <line x1={x+10} y1={y-2} x2={x+18} y2={y+2} {...s} />
        <line x1={x} y1={y+12} x2={x+20} y2={y+12} {...s} />
      </g>;
    case "roles-boundaries":
      // Cairn: 3 stacked irregular ovals
      return <g style={{ pointerEvents: "none" }}>
        <ellipse cx={x+10} cy={y+10} rx={7} ry={3} {...s} />
        <ellipse cx={x+10} cy={y+5} rx={5} ry={2.5} {...s} />
        <ellipse cx={x+10} cy={y+1} rx={3} ry={2} {...s} />
      </g>;
    case "interactions-modality":
      // Two overlapping speech bubbles
      return <g style={{ pointerEvents: "none" }}>
        <path d={`M ${x+2} ${y} Q ${x+2} ${y-8} ${x+10} ${y-8} Q ${x+18} ${y-8} ${x+18} ${y} Q ${x+18} ${y+5} ${x+12} ${y+5} L ${x+10} ${y+9} L ${x+9} ${y+5} Q ${x+2} ${y+5} ${x+2} ${y}`} {...s} />
      </g>;
    case "workflow":
      // Winding path with arrow
      return <g style={{ pointerEvents: "none" }}>
        <path d={`M ${x} ${y+8} Q ${x+5} ${y} ${x+10} ${y+4} Q ${x+15} ${y+8} ${x+20} ${y}`} {...s} />
        <polyline points={`${x+17},${y-4} ${x+20},${y} ${x+17},${y+2}`} {...s} />
      </g>;
    case "rituals-norms":
      // Bonfire: two crossed log lines, three flame curves
      return <g style={{ pointerEvents: "none" }}>
        <line x1={x+4} y1={y+10} x2={x+16} y2={y+4} {...s} />
        <line x1={x+4} y1={y+4} x2={x+16} y2={y+10} {...s} />
        <path d={`M ${x+10} ${y+4} Q ${x+7} ${y} ${x+10} ${y-4}`} {...s} />
        <path d={`M ${x+10} ${y+4} Q ${x+13} ${y} ${x+10} ${y-4}`} {...s} />
        <path d={`M ${x+10} ${y+4} Q ${x+10} ${y-2} ${x+10} ${y-6}`} {...s} />
      </g>;
    default:
      return null;
  }
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

  // Escape key → deselect everything
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onMapBackgroundClick();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onMapBackgroundClick]);

  // Scroll wheel zoom
  const containerRef = useRef<HTMLDivElement>(null);
  const wZoom = useRef({ scale: 1, tx: 0, ty: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.93;
      const newScale = Math.min(3.5, Math.max(0.8, wZoom.current.scale * factor));
      const rect = el!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      wZoom.current.tx = mx - (mx - wZoom.current.tx) * (newScale / wZoom.current.scale);
      wZoom.current.ty = my - (my - wZoom.current.ty) * (newScale / wZoom.current.scale);
      wZoom.current.scale = newScale;
      el!.style.transform = `translate(${wZoom.current.tx}px, ${wZoom.current.ty}px) scale(${wZoom.current.scale})`;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
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
    const scale = 2.4;
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
    <div ref={containerRef} style={{ width: "100%", height: "100%", transformOrigin: "0 0" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid slice"
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
          {/* Parchment hatching pattern */}
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#c9b99a" strokeWidth="0.3" />
          </pattern>

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
            <stop offset="0%" stopColor="#4a7a9b" stopOpacity="1" />
            <stop offset="100%" stopColor="#2a5a7b" stopOpacity="1" />
          </radialGradient>

          {/* Industry pin gradient */}
          <radialGradient id="industryPin" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#c87941" stopOpacity="1" />
            <stop offset="100%" stopColor="#a85921" stopOpacity="1" />
          </radialGradient>

          {/* Territory radial gradient fills — lighter center, warmer tints */}
          <radialGradient id="grad-interactions-modality" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#d0dce8" />
            <stop offset="100%" stopColor="#b8c8d8" />
          </radialGradient>
          <radialGradient id="grad-workflow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#e8daa8" />
            <stop offset="100%" stopColor="#d8c890" />
          </radialGradient>
          <radialGradient id="grad-roles-boundaries" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f0d8b4" />
            <stop offset="100%" stopColor="#e8c9a0" />
          </radialGradient>
          <radialGradient id="grad-governance" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#d4dde8" />
            <stop offset="100%" stopColor="#c4cdd8" />
          </radialGradient>
          <radialGradient id="grad-trust-accountability" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#e0c8d0" />
            <stop offset="100%" stopColor="#d4b8c4" />
          </radialGradient>
          <radialGradient id="grad-rituals-norms" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#d8e4cc" />
            <stop offset="100%" stopColor="#c8d5b9" />
          </radialGradient>

          {/* Terrain displacement — organic landmass edges */}
          <filter id="terrainDisplace" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.010"
              numOctaves="4"
              seed="42"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="22"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="terrainDisplaceSelected" x="-22%" y="-22%" width="144%" height="144%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.010"
              numOctaves="4"
              seed="42"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="22"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="7"
              floodColor="#2d2926"
              floodOpacity="0.14"
              in="displaced"
            />
          </filter>
        </defs>

        {/* Parchment background — solid base */}
        <rect
          width={SVG_W}
          height={SVG_H}
          fill="#f0e6cc"
          onClick={onMapBackgroundClick}
        />
        {/* Parchment hatching overlay */}
        <rect
          width={SVG_W}
          height={SVG_H}
          fill="url(#hatch)"
          fillOpacity={0.35}
          style={{ pointerEvents: "none" }}
        />

        {/* Sea wave marks — hand-drawn water texture in open sea areas */}
        <g style={{ pointerEvents: "none" }} opacity={0.28}>
          {[
            // bottom-right sea
            [650,520],[690,535],[730,520],[770,535],[810,520],
            [660,548],[700,562],[740,548],[780,562],[820,548],
            [670,576],[710,590],[750,576],[790,590],
            // upper-center sea
            [310,40],[350,52],[390,40],[430,52],[470,40],[510,52],
            [320,65],[360,78],[400,65],[440,78],[480,65],
            // left-edge sea
            [28,280],[28,300],[28,320],[28,340],
            // between trust and governance (upper-right gap)
            [600,190],[640,205],[680,190],
            [610,218],[650,232],
          ].map(([wx, wy], i) => (
            <path
              key={`wave-${i}`}
              d={`M ${wx} ${wy} Q ${wx+6} ${wy-3} ${wx+12} ${wy} Q ${wx+18} ${wy+3} ${wx+24} ${wy}`}
              fill="none"
              stroke="#7a6a50"
              strokeWidth={0.7}
            />
          ))}
        </g>

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
          style={{ transformOrigin: "0px 0px" }}
        >
          {/* ── Territory connection lines (curved bezier network) ────────── */}
          {(() => {
            const CONN_DIST = 360;
            const lines: React.ReactElement[] = [];
            for (let i = 0; i < TERRITORIES.length; i++) {
              for (let j = i + 1; j < TERRITORIES.length; j++) {
                const a = TERRITORIES[i];
                const b = TERRITORIES[j];
                const dx = b.center.x - a.center.x;
                const dy = b.center.y - a.center.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < CONN_DIST) {
                  const opacity = (1 - d / CONN_DIST) * 0.2;
                  const mx = (a.center.x + b.center.x) / 2;
                  const my = (a.center.y + b.center.y) / 2;
                  const len = d;
                  const perp = 50;
                  const cpx = mx + (-dy / len) * perp;
                  const cpy = my + (dx / len) * perp;
                  lines.push(
                    <path
                      key={`conn-${a.id}-${b.id}`}
                      d={`M ${a.center.x} ${a.center.y} Q ${cpx} ${cpy} ${b.center.x} ${b.center.y}`}
                      fill="none"
                      stroke="#9a8870"
                      strokeWidth={1.5}
                      strokeOpacity={opacity * 1.4}
                      strokeDasharray="7 4"
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

              // Freeze drift when any territory is selected
              const driftAnimate = effectiveFocusId
                ? { x: 0, y: 0 }
                : { x: [0, 3, 1, -3, 1, 0], y: [0, -2, 3, 1, -1, 0] };

              const driftTransition = effectiveFocusId
                ? { duration: 0.5 }
                : { duration: 14 + index * 1.8, repeat: Infinity, ease: "easeInOut" as const, delay: index * 2.3 };

              return (
                <motion.g
                  key={territory.id}
                  animate={cursorOffset}
                  transition={{ type: "spring", stiffness: 75, damping: 22 }}
                >
                <motion.g
                  animate={driftAnimate}
                  transition={driftTransition}
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
                    strokeOpacity={isDimmed ? 0 : isTrustRidge ? 0.10 : 0.07}
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
                    strokeOpacity={isDimmed ? 0 : isTrustRidge ? 0.18 : 0.13}
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
                    strokeOpacity={isDimmed ? 0 : isTrustRidge ? 0.28 : 0.20}
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
                    strokeWidth={1.25}
                    strokeOpacity={isDimmed ? 0 : isTrustRidge ? 0.40 : 0.32}
                    filter="url(#terrainDisplace)"
                    style={{
                      transform: `scale(1.04)`,
                      transformOrigin: `${territory.center.x}px ${territory.center.y}px`,
                    }}
                  />
                  {/* Parchment-colored edge separator (replaces white halo) */}
                  <path
                    d={territory.svgPath}
                    fill="none"
                    stroke="#f0e6cc"
                    strokeWidth={isDimmed ? 0 : 2}
                    strokeOpacity={isDimmed ? 0 : 0.7}
                    style={{ pointerEvents: "none" }}
                  />
                  {/* Territory fill */}
                  <motion.path
                    d={territory.svgPath}
                    fill={`url(#grad-${territory.id})`}
                    fillOpacity={
                      isDimmed
                        ? 0.10
                        : isTrustRidge
                        ? isSelected || isHovered
                          ? 0.60
                          : 0.42
                        : isSelected || isHovered
                        ? 0.72
                        : 0.55
                    }
                    stroke={territory.strokeColor}
                    strokeWidth={isSelected ? 3 : 2.5}
                    strokeOpacity={isDimmed ? 0.12 : isSelected ? 0.90 : 0.70}
                    animate={{
                      fillOpacity: isDimmed
                        ? 0.10
                        : isTrustRidge
                        ? isSelected || isHovered ? 0.60 : 0.42
                        : isSelected || isHovered ? 0.72 : 0.55,
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    filter={isSelected ? "url(#terrainDisplaceSelected)" : "url(#terrainDisplace)"}
                  />
                  {/* Inner coastline — double-line island effect from map references */}
                  <path
                    d={territory.svgPath}
                    fill="none"
                    stroke={territory.strokeColor}
                    strokeWidth={0.75}
                    strokeOpacity={isDimmed ? 0 : 0.45}
                    filter="url(#terrainDisplace)"
                    style={{
                      transform: `scale(0.91)`,
                      transformOrigin: `${territory.center.x}px ${territory.center.y}px`,
                      pointerEvents: "none",
                    }}
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
                  {/* Landmark icon */}
                  <g style={{ pointerEvents: "none", opacity: isDimmed ? 0 : 0.55 }}>
                    <LandmarkIcon
                      id={territory.id}
                      cx={territory.center.x}
                      cy={territory.center.y}
                      stroke={territory.strokeColor}
                    />
                  </g>
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
                    stroke={isResearch ? "#4a7a9b" : "#c87941"}
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
                    stroke="#f0e6cc"
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
                  stroke="#f0e6cc"
                  strokeWidth={4}
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
    </div>
  );
}
