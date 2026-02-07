"use client";

import { RadarItem } from "../types";

interface ItemDetailProps {
  item: RadarItem;
  onClose: () => void;
}

export default function ItemDetail({ item, onClose }: ItemDetailProps) {
  const sourceColor =
    item.source === "research" ? "var(--research-color)" : "var(--industry-color)";
  const sourceLabel = item.source === "research" ? "Research" : "Industry";

  return (
    <div className="detail-panel h-full overflow-y-auto" style={{ backgroundColor: "var(--surface)" }}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: `${item.source === "research" ? "#2563eb" : "#d97706"}15`,
              color: sourceColor,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: sourceColor }}
            />
            {sourceLabel} · {item.year}
          </div>
          <button
            onClick={onClose}
            className="p-1 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <h2
          className="text-lg leading-snug mb-2"
          style={{ fontFamily: "var(--font-dm-serif), Georgia, serif", color: "var(--foreground)" }}
        >
          {item.title}
        </h2>

        {/* Authors */}
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          {item.authors}
        </p>

        {/* Divider */}
        <div className="h-px mb-5" style={{ backgroundColor: "var(--border)" }} />

        {/* Summary */}
        <div className="mb-5">
          <h3
            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Summary
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {item.summary}
          </p>
        </div>

        {/* Design Question */}
        {item.designQuestion && (
          <div
            className="mb-5 p-4 rounded-r-lg border-l-2"
            style={{
              backgroundColor: "var(--background)",
              borderLeftColor: sourceColor,
            }}
          >
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Design Question
            </h3>
            <p
              className="text-[15px] italic leading-relaxed"
              style={{
                fontFamily: "var(--font-dm-serif), Georgia, serif",
                color: "var(--foreground)",
              }}
            >
              {item.designQuestion}
            </p>
          </div>
        )}

        {/* Design Levers */}
        {item.designLevers.length > 0 && (
          <div className="mb-4">
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Design Levers
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.designLevers.map((lever) => (
                <span
                  key={lever}
                  className="px-2 py-0.5 text-[11px] rounded-full border"
                  style={{
                    backgroundColor: "#dbeafe",
                    borderColor: "#bfdbfe",
                    color: "#1e40af",
                  }}
                >
                  {lever.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Designer Intents */}
        {item.designerIntents.length > 0 && (
          <div className="mb-4">
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Designer Intents
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.designerIntents.map((intent) => (
                <span
                  key={intent}
                  className="px-2 py-0.5 text-[11px] rounded-full border"
                  style={{
                    backgroundColor: "#fef3c7",
                    borderColor: "#fde68a",
                    color: "#92400e",
                  }}
                >
                  {intent.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="mb-5">
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[11px] rounded-full"
                  style={{
                    backgroundColor: tag === "emerging" ? "#fef3c7" : "var(--background)",
                    color: tag === "emerging" ? "#92400e" : "var(--text-secondary)",
                    border: tag === "emerging" ? "1px solid #fde68a" : "1px solid var(--border)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Link */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--accent)",
              color: "white",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            Read Paper
          </a>
        )}
      </div>
    </div>
  );
}
