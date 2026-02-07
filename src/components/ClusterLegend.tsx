"use client";

import { Cluster } from "./ForceGraph";

interface ClusterLegendProps {
  clusters: Cluster[];
  activeCluster: string | null;
  onClusterClick: (clusterId: string | null) => void;
  nodeCounts: Record<string, number>;
}

export default function ClusterLegend({
  clusters,
  activeCluster,
  onClusterClick,
  nodeCounts,
}: ClusterLegendProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onClusterClick(null)}
        className={`cluster-tag inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border ${
          activeCluster === null
            ? "border-white/30 bg-white/10 text-white"
            : "border-transparent bg-white/5 text-gray-400 hover:bg-white/10"
        }`}
      >
        All ({Object.values(nodeCounts).reduce((a, b) => a + b, 0)})
      </button>
      {clusters.map((cluster) => (
        <button
          key={cluster.id}
          onClick={() =>
            onClusterClick(activeCluster === cluster.id ? null : cluster.id)
          }
          className={`cluster-tag inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border ${
            activeCluster === cluster.id
              ? "border-current"
              : "border-transparent hover:border-current/30"
          }`}
          style={{
            backgroundColor: `${cluster.color}${activeCluster === cluster.id ? "30" : "15"}`,
            color: cluster.color,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: cluster.color }}
          />
          {cluster.label} ({nodeCounts[cluster.id] || 0})
        </button>
      ))}
    </div>
  );
}
