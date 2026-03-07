"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { RadarItem } from "../types";
import { DESIGN_THEMES, LEVER_META, getAnnotatedItemIds } from "../data/theme-map";
import { computeThemeBlobLayout, ThemeBlobLayout } from "../utils/circlePacking";

/* ─── Props ─────────────────────────────────────────────────────────── */

interface ThemeBubbleMapProps {
  items: RadarItem[];
  visibleItemIds: Set<string>;
  selectedItem: RadarItem | null;
  onItemClick: (item: RadarItem) => void;
  onExpandTheme: (themeId: string | null) => void;
  expandedThemeId: string | null;
}

/* ─── Constants ─────────────────────────────────────────────────────── */

const INDUSTRY_BUBBLE_R = 16;

/* ─── Color helpers for volumetric gradients ─────────────────────── */
function lightenHex(hex: string, t: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`;
}
function darkenHex(hex: string, t: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * (1 - t))},${Math.round(g * (1 - t))},${Math.round(b * (1 - t))})`;
}

/* ─── Component ─────────────────────────────────────────────────────── */

export default function ThemeBubbleMap({
  items,
  visibleItemIds,
  onExpandTheme,
  expandedThemeId,
}: ThemeBubbleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 680 });
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  /* ── Physics refs (mutated every frame, never trigger re-renders) ─── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobGroupRefs = useRef(new Map<string, SVGGElement>());
  const physicsRef = useRef(new Map<string, { x: number; y: number; vx: number; vy: number }>());
  const rafRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredThemeRef = useRef<string | null>(null);

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

  /* ── Mouse tracking for repulsion ──────────────────────────────────── */
  const handleContainerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleContainerMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const annotatedIds = useMemo(() => getAnnotatedItemIds(), []);
  const industryItems = useMemo(
    () => items.filter((i) => !annotatedIds.has(i.id)),
    [items, annotatedIds]
  );

  const industryGroups = useMemo(() => {
    const groups = new Map<string, RadarItem[]>();
    for (const item of industryItems) {
      const tag = item.tags?.[0] || "other";
      if (!groups.has(tag)) groups.set(tag, []);
      groups.get(tag)!.push(item);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8);
  }, [industryItems]);

  const isFiltering = visibleItemIds.size > 0;

  const themeMatchCounts = useMemo(() => {
    if (!isFiltering) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const theme of DESIGN_THEMES) {
      const matching = theme.itemIds.filter((id) => visibleItemIds.has(id)).length;
      counts.set(theme.id, matching);
    }
    return counts;
  }, [isFiltering, visibleItemIds]);

  const { blobs, zones } = useMemo(
    () => computeThemeBlobLayout(DESIGN_THEMES, dimensions.width, dimensions.height),
    [dimensions.width, dimensions.height]
  );

  /* ── Physics init + RAF animation loop ─────────────────────────────── */
  useEffect(() => {
    // Seed physics from current home positions (preserve velocity if already running)
    const physics = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    for (const blob of blobs) {
      const existing = physicsRef.current.get(blob.themeId);
      physics.set(blob.themeId, existing ?? { x: blob.cx, y: blob.cy, vx: 0, vy: 0 });
    }
    physicsRef.current = physics;

    const SPRING_K    = 0.014;  // pull toward home position
    const FRICTION    = 0.86;   // velocity damping each frame
    const REPULSION   = 2200;   // blob-blob push force
    const REPULSION_D = 140;    // distance at which repulsion kicks in
    const MOUSE_R     = 90;     // mouse repulsion radius (keep tight so blobs don't flee before cursor arrives)
    const MOUSE_F     = 2.5;    // mouse repulsion strength (gentle nudge)
    const WALK        = 0.10;   // random organic drift

    function tick() {
      const phys = physicsRef.current;
      const entries = Array.from(phys.entries());
      const mouse = mouseRef.current;

      /* ── update velocities & positions ── */
      for (const [id, p] of entries) {
        const blob = blobs.find((b) => b.themeId === id);
        if (!blob) continue;

        // Spring toward home
        p.vx += (blob.cx - p.x) * SPRING_K;
        p.vy += (blob.cy - p.y) * SPRING_K;

        // Organic random walk
        p.vx += (Math.random() - 0.5) * WALK;
        p.vy += (Math.random() - 0.5) * WALK;

        // Blob-blob repulsion
        for (const [id2, p2] of entries) {
          if (id === id2) continue;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < REPULSION_D) {
            const f = REPULSION / (dist * dist + 1);
            p.vx += (dx / dist) * f;
            p.vy += (dy / dist) * f;
          }
        }

        // Mouse repulsion — skip for the blob currently being hovered so it stays clickable
        if (mouse && id !== hoveredThemeRef.current) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < MOUSE_R) {
            const strength = (1 - dist / MOUSE_R) * MOUSE_F;
            p.vx += (dx / dist) * strength;
            p.vy += (dy / dist) * strength;
          }
        }

        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;
      }

      /* ── apply transforms directly to SVG groups (no React re-render) ── */
      for (const [id, p] of entries) {
        const blob = blobs.find((b) => b.themeId === id);
        if (!blob) continue;
        const el = blobGroupRefs.current.get(id);
        if (el) {
          el.style.transform = `translate(${(p.x - blob.cx).toFixed(2)}px, ${(p.y - blob.cy).toFixed(2)}px)`;
        }
      }

      /* ── draw connection lines on canvas ── */
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
              const [id1, p1] = entries[i];
              const [id2, p2] = entries[j];
              const b1 = blobs.find((b) => b.themeId === id1);
              const b2 = blobs.find((b) => b.themeId === id2);
              if (!b1 || !b2) continue;

              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              const sameLever = b1.leverCategory === b2.leverCategory;
              const maxDist = sameLever ? 310 : 165;

              if (dist < maxDist) {
                const t = 1 - dist / maxDist;
                const alpha = t * (sameLever ? 0.28 : 0.10);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(180, 190, 220, ${alpha.toFixed(3)})`;
                ctx.lineWidth = sameLever ? 1.0 : 0.6;
                ctx.stroke();
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [blobs]);

  const mainHeight = dimensions.height - 70;
  const industryLayout = useMemo(() => {
    if (industryGroups.length === 0) return [];
    const y = mainHeight + 40;
    const totalWidth = industryGroups.length * (INDUSTRY_BUBBLE_R * 2 + 14);
    const startX = (dimensions.width - totalWidth) / 2 + INDUSTRY_BUBBLE_R;
    return industryGroups.map(([tag, groupItems], i) => ({
      tag,
      count: groupItems.length,
      x: startX + i * (INDUSTRY_BUBBLE_R * 2 + 14),
      y,
      r: INDUSTRY_BUBBLE_R,
    }));
  }, [industryGroups, dimensions.width, mainHeight]);

  const handleBlobClick = useCallback(
    (themeId: string) => {
      onExpandTheme(expandedThemeId === themeId ? null : themeId);
    },
    [onExpandTheme, expandedThemeId]
  );

  const handleMouseEnter = useCallback(
    (themeId: string, e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setHoveredTheme(themeId);
        hoveredThemeRef.current = themeId;
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredTheme(null);
    hoveredThemeRef.current = null;
    setTooltipPos(null);
  }, []);

  const hoveredThemeData = hoveredTheme
    ? DESIGN_THEMES.find((t) => t.id === hoveredTheme)
    : null;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "clip",
        background: "#090909",
      }}
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={handleContainerMouseLeave}
    >
      {/* Canvas layer — draws connection lines at 60fps behind the SVG */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      />
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {/* Ambient glow filter for blobs and satellites */}
          <filter id="blob-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur" />
          </filter>

          {/* Tighter glow for hover ring */}
          <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Per-blob 3D radial gradients — light focal point top-left, deep dark bottom-right */}
          {blobs.map((blob) => (
            <radialGradient
              key={blob.themeId}
              id={`grad-${blob.themeId}`}
              cx="35%"
              cy="30%"
              r="68%"
              fx="28%"
              fy="22%"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%"   stopColor={lightenHex(blob.color, 0.82)} stopOpacity="1" />
              <stop offset="22%"  stopColor={lightenHex(blob.color, 0.40)} stopOpacity="0.97" />
              <stop offset="58%"  stopColor={blob.color}                   stopOpacity="0.92" />
              <stop offset="100%" stopColor={darkenHex(blob.color, 0.78)}  stopOpacity="0.98" />
            </radialGradient>
          ))}
        </defs>

        {/* Background: deep dark space */}
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill="#090909"
        />

        {/* Zone labels — subtle, visible on dark */}
        {zones.map((zone) => {
          const labelY = zone.cy - (dimensions.height - 70) / 4 - 12;
          return (
            <g key={zone.lever} style={{ pointerEvents: "none" }}>
              <text
                x={zone.cx}
                y={labelY}
                textAnchor="middle"
                fontFamily="var(--font-caveat), cursive"
                fontSize={14}
                fontWeight={700}
                fill={zone.color}
                opacity={0.40}
                letterSpacing="0.08em"
              >
                {zone.label.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Theme blobs */}
        {blobs.map((blob) => {
          const theme = DESIGN_THEMES.find((t) => t.id === blob.themeId);
          if (!theme) return null;
          const matchCount = themeMatchCounts.get(blob.themeId);
          const isDimmed =
            isFiltering && matchCount !== undefined && matchCount === 0;
          const isExpanded = expandedThemeId === blob.themeId;
          const isHovered = hoveredTheme === blob.themeId;
          return (
            <VolumetricBlob
              key={blob.themeId}
              blob={blob}
              theme={theme}
              isDimmed={isDimmed}
              isExpanded={isExpanded}
              isHovered={isHovered}
              matchCount={isFiltering ? matchCount ?? 0 : undefined}
              groupRef={(el) => {
                if (el) blobGroupRefs.current.set(blob.themeId, el);
                else blobGroupRefs.current.delete(blob.themeId);
              }}
              onClick={handleBlobClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}

        {/* Industry signals row — minimal dark style */}
        {industryLayout.length > 0 && (
          <>
            <line
              x1={60}
              y1={mainHeight + 6}
              x2={dimensions.width - 60}
              y2={mainHeight + 6}
              stroke="rgba(120,130,160,0.25)"
              strokeDasharray="6 5"
              strokeWidth={1}
            />
            <text
              x={dimensions.width / 2}
              y={mainHeight + 22}
              textAnchor="middle"
              fontFamily="var(--font-caveat), cursive"
              fill="rgba(180,190,220,0.45)"
              fontSize={12}
              fontWeight={600}
            >
              Industry Signals ({industryItems.length} posts)
            </text>
            {industryLayout.map(({ tag, count, x, y, r }, i) => (
              <g key={tag}>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="#f59e0b"
                  fillOpacity={0.12}
                  stroke="#f59e0b"
                  strokeWidth={1}
                  strokeOpacity={0.35}
                />
                <text
                  x={x}
                  y={y - 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={7}
                  fontWeight={600}
                  fill="rgba(251,191,36,0.7)"
                >
                  {tag.length > 8 ? tag.slice(0, 7) + "\u2026" : tag}
                </text>
                <text
                  x={x}
                  y={y + 8}
                  textAnchor="middle"
                  fontSize={7}
                  fill="rgba(251,191,36,0.45)"
                >
                  {count}
                </text>
              </g>
            ))}
          </>
        )}
      </svg>

      {/* Tooltip — dark glass card */}
      {hoveredThemeData && tooltipPos && (
        <div
          className="landscape-tooltip"
          style={{
            position: "absolute",
            left: Math.min(tooltipPos.x + 18, dimensions.width - 290),
            top: Math.max(tooltipPos.y - 10, 10),
            maxWidth: 270,
            background: "rgba(18, 18, 28, 0.92)",
            border: "1px solid rgba(180,190,220,0.15)",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: LEVER_META[hoveredThemeData.leverCategory].color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${LEVER_META[hoveredThemeData.leverCategory].color}`,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-dm-serif), Georgia, serif",
                fontSize: "0.92rem",
                color: "rgba(240,242,255,0.95)",
              }}
            >
              {hoveredThemeData.label}
            </span>
          </div>
          <p
            style={{
              fontSize: "0.74rem",
              color: "rgba(180,190,220,0.75)",
              lineHeight: 1.55,
              marginBottom: 10,
            }}
          >
            {hoveredThemeData.description}
          </p>
          <p
            style={{
              fontSize: "0.7rem",
              fontStyle: "italic",
              color: "rgba(200,210,240,0.6)",
              lineHeight: 1.55,
              borderTop: "1px solid rgba(180,190,220,0.12)",
              paddingTop: 10,
            }}
          >
            &ldquo;
            {hoveredThemeData.sampleQuestion.length > 140
              ? hoveredThemeData.sampleQuestion.slice(0, 140) + "\u2026"
              : hoveredThemeData.sampleQuestion}
            &rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Volumetric Blob component ───────────────────────────────────── */

interface VolumetricBlobProps {
  blob: ThemeBlobLayout;
  theme: { id: string; label: string; itemIds: string[] };
  isDimmed: boolean;
  isExpanded: boolean;
  isHovered: boolean;
  matchCount: number | undefined;
  groupRef: (el: SVGGElement | null) => void;
  onClick: (themeId: string) => void;
  onMouseEnter: (themeId: string, e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

function VolumetricBlob({
  blob,
  theme,
  isDimmed,
  isExpanded,
  isHovered,
  matchCount,
  groupRef,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: VolumetricBlobProps) {
  const lines = wrapText(theme.label, blob.radius * 1.5);
  const lineHeight = 14;
  const textStartY = -((lines.length - 1) * lineHeight) / 2;
  const totalCount = theme.itemIds.length;

  const classNames = [
    "theme-blob",
    isDimmed ? "theme-blob--dimmed" : "",
    isHovered ? "theme-blob--hovered" : "",
    isExpanded ? "theme-blob--expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Organelle nucleus — slightly offset from center for organic feel
  const orgR = blob.radius * 0.26;
  const orgX = blob.cx + blob.radius * 0.07;
  const orgY = blob.cy + blob.radius * 0.08;

  // Specular highlight — small bright ellipse top-left
  const specX = blob.cx - blob.radius * 0.27;
  const specY = blob.cy - blob.radius * 0.28;

  return (
    <g
      ref={(el) => groupRef(el as SVGGElement | null)}
      className={classNames}
      onClick={() => onClick(blob.themeId)}
      onMouseEnter={(e) => onMouseEnter(blob.themeId, e)}
      onMouseLeave={onMouseLeave}
      cursor="pointer"
    >
      {/* 1. Ambient outer glow — halo path blurred behind the blob */}
      {!isDimmed && (
        <path
          d={blob.haloPath}
          fill={blob.color}
          fillOpacity={isHovered ? 0.26 : 0.14}
          filter="url(#blob-glow)"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* 2. Satellite glowing spheres */}
      {!isDimmed &&
        blob.satellites.map((sat, i) => (
          <circle
            key={`sat-${i}`}
            cx={blob.cx + sat.dx}
            cy={blob.cy + sat.dy}
            r={sat.r}
            fill={blob.color}
            fillOpacity={isHovered ? 0.80 : 0.55}
            filter="url(#blob-glow)"
            style={{ pointerEvents: "none" }}
          />
        ))}

      {/* 3. Main blob body — 3D volumetric radial gradient */}
      <path
        className={isDimmed ? "" : "theme-blob-body"}
        d={blob.blobPath}
        fill={isDimmed ? blob.color : `url(#grad-${blob.themeId})`}
        fillOpacity={isDimmed ? 0.08 : 1}
      />

      {/* 4. Inner organelle — dark nucleus for cell-like depth */}
      {!isDimmed && (
        <circle
          cx={orgX}
          cy={orgY}
          r={orgR}
          fill={darkenHex(blob.color, 0.80)}
          fillOpacity={0.60}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* 5. Organelle inner ring — subtle membrane */}
      {!isDimmed && (
        <circle
          cx={orgX}
          cy={orgY}
          r={orgR * 0.72}
          fill="none"
          stroke={darkenHex(blob.color, 0.55)}
          strokeWidth={1}
          strokeOpacity={0.35}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* 6. Specular highlight — glossy reflection top-left */}
      {!isDimmed && (
        <ellipse
          cx={specX}
          cy={specY}
          rx={blob.radius * 0.20}
          ry={blob.radius * 0.11}
          fill="white"
          fillOpacity={isHovered ? 0.60 : 0.38}
          style={{ pointerEvents: "none" }}
          transform={`rotate(-28, ${specX}, ${specY})`}
        />
      )}

      {/* 7. Secondary soft specular (bottom edge rim light) */}
      {!isDimmed && (
        <ellipse
          cx={blob.cx + blob.radius * 0.18}
          cy={blob.cy + blob.radius * 0.48}
          rx={blob.radius * 0.30}
          ry={blob.radius * 0.07}
          fill={lightenHex(blob.color, 0.55)}
          fillOpacity={0.25}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* 8. Expanded selection ring */}
      {isExpanded && (
        <path
          d={blob.blobPath}
          fill="none"
          stroke={blob.color}
          strokeWidth={2}
          strokeOpacity={0.70}
          strokeDasharray="7 5"
          filter="url(#ring-glow)"
          style={{
            transform: "scale(1.08)",
            transformOrigin: `${blob.cx}px ${blob.cy}px`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* 9. Label text — crisp white on dark blob */}
      <text
        x={blob.cx}
        y={blob.cy - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-dm-serif), Georgia, serif"
        fontSize={Math.max(9.5, Math.min(13, blob.radius * 0.2))}
        fill="white"
        opacity={isDimmed ? 0.08 : 0.90}
        style={{ pointerEvents: "none" }}
        fontWeight={400}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={blob.cx} dy={i === 0 ? textStartY : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>

      {/* 10. Count badge — white semi-transparent */}
      <text
        x={blob.cx}
        y={blob.cy + (lines.length > 1 ? 18 : 14)}
        textAnchor="middle"
        fontSize={8.5}
        fill="white"
        opacity={isDimmed ? 0.05 : 0.42}
        style={{ pointerEvents: "none" }}
      >
        {matchCount !== undefined
          ? `${matchCount} of ${totalCount}`
          : `${totalCount} items`}
      </text>
    </g>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  if (words.length === 1) return [text];

  const charWidth = 6.5;
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (test.length * charWidth > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length > 2 ? [lines[0], lines.slice(1).join(" ")] : lines;
}
