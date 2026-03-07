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

/* ─── Hand-drawn wobbly line helper ─────────────────────────────────── */

/** Generate a slightly curved Q-path between two points for a hand-drawn connector */
function generateWobblyLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  // Perpendicular offset — small wobble
  const nx = -dy / (len || 1);
  const ny = dx / (len || 1);
  const wobble = (((seed * 7919) % 100) / 100 - 0.5) * len * 0.15;
  const qx = mx + nx * wobble;
  const qy = my + ny * wobble;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
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
                const alpha = t * (sameLever ? 0.30 : 0.12);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(40, 30, 20, ${alpha.toFixed(3)})`;
                ctx.lineWidth = sameLever ? 1.2 : 0.8;
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
          {/* Hand-drawn wobble displacement filter */}
          <filter id="hand-drawn" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03"
              numOctaves={3}
              seed={42}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={1.2}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Subtle paper grain texture */}
          <filter id="paper-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves={4}
              seed={7}
              result="grain"
            />
            <feColorMatrix
              type="saturate"
              values="0"
              in="grain"
              result="grainGrey"
            />
            <feBlend
              in="SourceGraphic"
              in2="grainGrey"
              mode="multiply"
              result="grained"
            />
          </filter>

          {/* Grid dot pattern for paper background */}
          <pattern
            id="grid-dots"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="0.8" fill="var(--pencil-grey)" opacity="0.15" />
          </pattern>
        </defs>

        {/* Background: warm paper canvas */}
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill="var(--canvas-bg)"
        />

        {/* Subtle grid dots */}
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill="url(#grid-dots)"
        />

        {/* Zone labels — handwritten Caveat font */}
        {zones.map((zone) => {
          const labelY = zone.cy - (dimensions.height - 70) / 4 - 12;
          return (
            <g key={zone.lever} style={{ pointerEvents: "none" }}>
              <text
                x={zone.cx}
                y={labelY}
                textAnchor="middle"
                fontFamily="var(--font-caveat), cursive"
                fontSize={15}
                fontWeight={700}
                fill={zone.color}
                opacity={0.55}
                letterSpacing="0.02em"
              >
                {zone.label}
              </text>
              {/* Small decorative squiggle under the label */}
              <path
                d={`M ${zone.cx - 18} ${labelY + 6} Q ${zone.cx - 6} ${labelY + 3} ${zone.cx} ${labelY + 7} T ${zone.cx + 18} ${labelY + 5}`}
                fill="none"
                stroke={zone.color}
                strokeWidth={1}
                opacity={0.25}
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Theme blobs */}
        {blobs.map((blob, idx) => {
          const theme = DESIGN_THEMES.find((t) => t.id === blob.themeId);
          if (!theme) return null;
          const matchCount = themeMatchCounts.get(blob.themeId);
          const isDimmed =
            isFiltering && matchCount !== undefined && matchCount === 0;
          const isExpanded = expandedThemeId === blob.themeId;
          const isHovered = hoveredTheme === blob.themeId;
          return (
            <SketchBlob
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

        {/* Industry signals row — pencil sketch style */}
        {industryLayout.length > 0 && (
          <>
            <line
              x1={60}
              y1={mainHeight + 6}
              x2={dimensions.width - 60}
              y2={mainHeight + 6}
              stroke="var(--pencil-grey)"
              strokeOpacity={0.3}
              strokeDasharray="8 6"
              strokeWidth={1.5}
            />
            <text
              x={dimensions.width / 2}
              y={mainHeight + 22}
              textAnchor="middle"
              fontFamily="var(--font-caveat), cursive"
              fill="var(--pencil-grey)"
              fontSize={12}
              fontWeight={700}
              opacity={0.5}
            >
              Industry Signals ({industryItems.length} posts)
            </text>
            {industryLayout.map(({ tag, count, x, y, r }, i) => (
              <g
                key={tag}
                className="industry-bob"
                style={{ "--bob-delay": `${i * 0.6}s` } as React.CSSProperties}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="#fbbf24"
                  fillOpacity={0.15}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                />
                <text
                  x={x}
                  y={y - 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={7}
                  fontWeight={600}
                  fill="#92400e"
                  opacity={0.65}
                >
                  {tag.length > 8 ? tag.slice(0, 7) + "\u2026" : tag}
                </text>
                <text
                  x={x}
                  y={y + 8}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#b45309"
                  opacity={0.45}
                >
                  {count}
                </text>
              </g>
            ))}
          </>
        )}
      </svg>

      {/* Tooltip — paper card with tilt */}
      {hoveredThemeData && tooltipPos && (
        <div
          className="landscape-tooltip"
          style={{
            position: "absolute",
            left: Math.min(tooltipPos.x + 18, dimensions.width - 290),
            top: Math.max(tooltipPos.y - 10, 10),
            maxWidth: 270,
            background: "#fffbf7",
            border: "2.5px solid var(--ink-black)",
            borderRadius: 10,
            padding: "14px 16px",
            boxShadow: "4px 4px 0 rgba(0,0,0,0.08)",
            transform: "rotate(-0.5deg)",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: LEVER_META[hoveredThemeData.leverCategory].color,
                flexShrink: 0,
                border: "1.5px solid var(--ink-black)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-dm-serif), Georgia, serif",
                fontSize: "0.95rem",
                color: "var(--ink-black)",
              }}
            >
              {hoveredThemeData.label}
            </span>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
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
              color: "#374151",
              lineHeight: 1.55,
              borderTop: "1.5px dashed var(--pencil-grey)",
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

/* ─── Sketch Blob component — flat fill + hand-drawn outline ──────── */

interface SketchBlobProps {
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

function SketchBlob({
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
}: SketchBlobProps) {
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

  return (
    <g
      ref={(el) => groupRef(el as SVGGElement | null)}
      className={classNames}
      onClick={() => onClick(blob.themeId)}
      onMouseEnter={(e) => onMouseEnter(blob.themeId, e)}
      onMouseLeave={onMouseLeave}
      cursor="pointer"
    >
      {/* 1. Satellite connector lines — hand-drawn wobbly curves with dash crawl */}
      {!isDimmed &&
        blob.satellites.map((sat, i) => (
          <path
            key={`line-${i}`}
            className="connector-crawl"
            d={generateWobblyLine(
              blob.cx,
              blob.cy,
              blob.cx + sat.dx,
              blob.cy + sat.dy,
              blob.seed + i
            )}
            fill="none"
            stroke="var(--ink-black)"
            strokeWidth={1}
            strokeOpacity={isHovered ? 0.3 : 0.12}
            strokeLinecap="round"
            strokeDasharray="4 3"
            style={{ pointerEvents: "none" }}
          />
        ))}

      {/* 2. Satellite dots — slowly orbiting around parent blob */}
      {!isDimmed &&
        blob.satellites.map((sat, i) => {
          const orbitDur = 18 + i * 7; // stagger: 18s, 25s, 32s
          return (
            <circle
              key={`sat-${i}`}
              className="sat-orbit"
              cx={blob.cx + sat.dx}
              cy={blob.cy + sat.dy}
              r={sat.r}
              fill={blob.color}
              fillOpacity={isHovered ? 0.7 : 0.45}
              stroke="var(--ink-black)"
              strokeWidth={1}
              strokeOpacity={isHovered ? 0.35 : 0.15}
              style={{
                pointerEvents: "none",
                "--orbit-cx": `${blob.cx + sat.dx}px`,
                "--orbit-cy": `${blob.cy + sat.dy}px`,
                "--orbit-r": `${sat.r * 0.8}px`,
                "--orbit-dur": `${orbitDur}s`,
              } as React.CSSProperties}
            />
          );
        })}

      {/* 3. Main blob body — FLAT color fill with gentle breathing */}
      <path
        className={isDimmed ? "" : "theme-blob-body"}
        d={blob.blobPath}
        fill={blob.color}
        fillOpacity={isDimmed ? 0.08 : 0.82}
      />

      {/* 4. Hand-drawn dark outline with wobble filter */}
      <path
        d={blob.blobPath}
        fill="none"
        stroke="var(--ink-black)"
        strokeWidth={isHovered || isExpanded ? 2.5 : 2}
        strokeOpacity={isDimmed ? 0.06 : isHovered ? 0.7 : 0.45}
        strokeLinejoin="round"
        filter="url(#hand-drawn)"
        style={{ pointerEvents: "none" }}
      />

      {/* 5. Hover highlight — white overlay */}
      {isHovered && !isDimmed && (
        <path
          d={blob.blobPath}
          fill="#ffffff"
          fillOpacity={0.18}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* 6. Expanded selection ring */}
      {isExpanded && (
        <path
          d={blob.blobPath}
          fill="none"
          stroke="var(--ink-black)"
          strokeWidth={3}
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          style={{
            transform: "scale(1.06)",
            transformOrigin: `${blob.cx}px ${blob.cy}px`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* 7. Label text — dark on colored blob */}
      <text
        x={blob.cx}
        y={blob.cy - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-dm-serif), Georgia, serif"
        fontSize={Math.max(9.5, Math.min(13, blob.radius * 0.2))}
        fill="var(--ink-black)"
        opacity={isDimmed ? 0.06 : 0.92}
        style={{ pointerEvents: "none" }}
        fontWeight={400}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={blob.cx} dy={i === 0 ? textStartY : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>

      {/* 8. Count badge — grey text */}
      <text
        x={blob.cx}
        y={blob.cy + (lines.length > 1 ? 18 : 14)}
        textAnchor="middle"
        fontSize={8.5}
        fill="#6b7280"
        opacity={isDimmed ? 0.04 : 0.5}
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
