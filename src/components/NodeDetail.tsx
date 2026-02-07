"use client";

import { ResearchNode, Cluster } from "./ForceGraph";

interface NodeDetailProps {
  node: ResearchNode;
  clusters: Cluster[];
  onClose: () => void;
}

export default function NodeDetail({ node, clusters, onClose }: NodeDetailProps) {
  const cluster = clusters.find((c) => c.id === node.cluster);

  return (
    <div className="detail-panel absolute top-0 right-0 w-[380px] h-full bg-[var(--surface)] border-l border-[var(--border)] overflow-y-auto z-20">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="cluster-tag inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${cluster?.color}20`, color: cluster?.color }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cluster?.color }}
            />
            {cluster?.label}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-white leading-snug mb-2">
          {node.title}
        </h2>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-5">
          <span>{node.authors}</span>
          <span className="text-gray-600">|</span>
          <span>{node.year}</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border)] mb-5" />

        {/* Summary */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Summary
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            {node.summary}
          </p>
        </div>

        {/* Link */}
        {node.url && (
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-light)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            Read Paper
          </a>
        )}

        {/* Connections info */}
        <div className="mt-6 pt-5 border-t border-[var(--border)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Node ID
          </h3>
          <p className="text-xs text-gray-500 font-mono">{node.id}</p>
        </div>
      </div>
    </div>
  );
}
