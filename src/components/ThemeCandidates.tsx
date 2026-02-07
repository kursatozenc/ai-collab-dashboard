"use client";

import { useState } from "react";
import { RadarItem } from "../types";

interface ThemeCandidatesProps {
  items: RadarItem[];
  onItemClick: (item: RadarItem) => void;
}

export default function ThemeCandidates({ items, onItemClick }: ThemeCandidatesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const emergingItems = items
    .filter((item) => item.tags.includes("emerging"))
    .sort((a, b) => b.year - a.year);

  if (emergingItems.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h4
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-secondary)" }}
        >
          Emerging Themes
        </h4>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
          >
            {emergingItems.length}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              color: "var(--text-secondary)",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2.5">
          {emergingItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="w-full text-left p-2.5 rounded-lg border transition-colors"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      item.source === "research"
                        ? "var(--research-color)"
                        : "var(--industry-color)",
                  }}
                />
                <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  {item.year}
                </span>
              </div>
              <p
                className="text-xs leading-snug"
                style={{
                  fontFamily: "var(--font-dm-serif), Georgia, serif",
                  color: "var(--foreground)",
                }}
              >
                {item.title.length > 60 ? item.title.slice(0, 57) + "..." : item.title}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
