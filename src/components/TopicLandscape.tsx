"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RadarItem, Cluster } from "../types";

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Track mouse for tooltip
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
        {/* Cluster region labels (background) */}
        {clusters.map((cluster) => {
          const anchor = clusterAnchors[cluster.id];
          if (!anchor) return null;
          return (
            <text
              key={`label-${cluster.id}`}
              x={anchor[0]}
              y={anchor[1] - 65}
              textAnchor="middle"
              fill="var(--foreground)"
              opacity={0.07}
              fontSize={28}
              fontFamily="var(--font-dm-serif), Georgia, serif"
              fontWeight={400}
            >
              {cluster.label}
            </text>
          );
        })}

        {/* Links (very subtle) */}

        {/* Nodes */}
        {items.map((item) => {
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
                  cx={item.embedding[0]}
                  cy={item.embedding[1]}
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
                  cx={item.embedding[0]}
                  cy={item.embedding[1]}
                  r={10}
                  fill={color}
                  opacity={0.1}
                />
              )}

              {/* Node dot */}
              <circle
                cx={item.embedding[0]}
                cy={item.embedding[1]}
                r={isSelected ? 6 : isHovered ? 5.5 : 4.5}
                fill={color}
                opacity={0.85}
              />

              {/* Label (on hover or selected) */}
              {(isHovered || isSelected) && (
                <text
                  className="landscape-label"
                  x={item.embedding[0]}
                  y={item.embedding[1] + 14}
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
