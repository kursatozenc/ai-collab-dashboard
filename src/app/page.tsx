"use client";

import { useState, useMemo, useCallback } from "react";
import ForceGraph, { ResearchNode } from "../components/ForceGraph";
import NodeDetail from "../components/NodeDetail";
import ClusterLegend from "../components/ClusterLegend";
import SearchBar from "../components/SearchBar";
import graphData from "../data/research-graph.json";

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<ResearchNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCluster, setActiveCluster] = useState<string | null>(null);

  const nodes = graphData.nodes as ResearchNode[];
  const links = graphData.links;
  const clusters = graphData.clusters;

  // Search filtering
  const highlightedNodes = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const matched = nodes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.authors.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.cluster.toLowerCase().includes(q)
    );
    return new Set(matched.map((n) => n.id));
  }, [searchQuery, nodes]);

  const searchResultCount = highlightedNodes.size || nodes.length;

  // Cluster node counts
  const nodeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((n) => {
      counts[n.cluster] = (counts[n.cluster] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  const handleNodeClick = useCallback((node: ResearchNode) => {
    setSelectedNode(node);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClusterClick = useCallback((clusterId: string | null) => {
    setActiveCluster(clusterId);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pb-3">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">🔬</span>
              Human-AI Collaboration Research
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {nodes.length} papers across {clusters.length} research clusters
            </p>
          </div>
          <div className="w-[340px] flex-shrink-0">
            <SearchBar
              onSearch={handleSearch}
              resultCount={searchResultCount}
              totalCount={nodes.length}
            />
          </div>
        </div>

        {/* Cluster legend */}
        <ClusterLegend
          clusters={clusters}
          activeCluster={activeCluster}
          onClusterClick={handleClusterClick}
          nodeCounts={nodeCounts}
        />
      </div>

      {/* Graph */}
      <div
        className="w-full h-full"
        style={{ paddingRight: selectedNode ? 380 : 0, transition: "padding-right 0.25s ease" }}
      >
        <ForceGraph
          nodes={nodes}
          links={links}
          clusters={clusters}
          highlightedNodes={highlightedNodes}
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          activeCluster={activeCluster}
        />
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <NodeDetail
          node={selectedNode}
          clusters={clusters}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Footer */}
      <div className="absolute bottom-3 left-4 text-xs text-gray-600">
        Click a node to explore | Scroll to zoom | Drag to pan
      </div>

      {/* Author credit */}
      <div className="absolute bottom-3 right-4 text-xs text-gray-600">
        Curated by Kursat Ozenc
      </div>
    </div>
  );
}
