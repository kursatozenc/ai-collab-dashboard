"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

export interface ResearchNode {
  id: string;
  title: string;
  authors: string;
  year: number;
  cluster: string;
  summary: string;
  url: string;
  // Force graph internal properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface ResearchLink {
  source: string | ResearchNode;
  target: string | ResearchNode;
}

export interface Cluster {
  id: string;
  label: string;
  color: string;
}

interface ForceGraphProps {
  nodes: ResearchNode[];
  links: ResearchLink[];
  clusters: Cluster[];
  highlightedNodes: Set<string>;
  selectedNode: ResearchNode | null;
  onNodeClick: (node: ResearchNode) => void;
  activeCluster: string | null;
}

export default function ForceGraph({
  nodes,
  links,
  clusters,
  highlightedNodes,
  selectedNode,
  onNodeClick,
  activeCluster,
}: ForceGraphProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const clusterColorMap = clusters.reduce(
    (acc, c) => {
      acc[c.id] = c.color;
      return acc;
    },
    {} as Record<string, string>
  );

  const getNodeColor = useCallback(
    (node: ResearchNode) => {
      const color = clusterColorMap[node.cluster] || "#6B7280";
      if (activeCluster && node.cluster !== activeCluster) return "#2a2e3a";
      if (highlightedNodes.size > 0 && !highlightedNodes.has(node.id))
        return "#2a2e3a";
      return color;
    },
    [clusterColorMap, activeCluster, highlightedNodes]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCanvasObject = useCallback(
    (
      node: any,
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      const x = node.x || 0;
      const y = node.y || 0;
      const color = getNodeColor(node);
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode === node.id;
      const isDimmed =
        (activeCluster && node.cluster !== activeCluster) ||
        (highlightedNodes.size > 0 && !highlightedNodes.has(node.id));

      const baseRadius = 6;
      const radius = isSelected ? baseRadius + 3 : isHovered ? baseRadius + 2 : baseRadius;

      // Glow effect for selected/hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = `${color}30`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isDimmed ? "#2a2e3a" : color;
      ctx.fill();

      // Border for selected
      if (isSelected) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label on zoom or hover
      if (globalScale > 1.5 || isHovered || isSelected) {
        const label = node.title.length > 40 ? node.title.slice(0, 37) + "..." : node.title;
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isDimmed ? "#3a3e4a" : "#e5e7eb";
        ctx.fillText(label, x, y + radius + 3);
      }
    },
    [getNodeColor, selectedNode, hoveredNode, activeCluster, highlightedNodes]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkColor = useCallback(
    (link: any) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;

      if (highlightedNodes.size > 0) {
        if (highlightedNodes.has(sourceId) && highlightedNodes.has(targetId)) {
          return "rgba(255,255,255,0.15)";
        }
        return "rgba(255,255,255,0.03)";
      }
      if (activeCluster) {
        const sourceNode = nodes.find((n) => n.id === sourceId);
        const targetNode = nodes.find((n) => n.id === targetId);
        if (
          sourceNode?.cluster === activeCluster &&
          targetNode?.cluster === activeCluster
        ) {
          return "rgba(255,255,255,0.15)";
        }
        return "rgba(255,255,255,0.03)";
      }
      return "rgba(255,255,255,0.08)";
    },
    [activeCluster, highlightedNodes, nodes]
  );

  return (
    <div ref={containerRef} className="force-graph-container w-full h-full">
      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={graphRef}
          graphData={{ nodes, links }}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, 10, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkColor={linkColor}
          linkWidth={1}
          linkDirectionalParticles={0}
          onNodeClick={(node: any) => onNodeClick(node as ResearchNode)}
          onNodeHover={(node: any) =>
            setHoveredNode(node?.id || null)
          }
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          backgroundColor="transparent"
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      )}
    </div>
  );
}
