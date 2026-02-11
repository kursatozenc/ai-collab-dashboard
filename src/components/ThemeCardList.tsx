"use client";

import { useCallback } from "react";
import { RadarItem, DesignTheme } from "../types";
import { LEVER_META } from "../data/theme-map";

interface ThemeCardListProps {
  theme: DesignTheme;
  items: RadarItem[];
  onItemClick: (item: RadarItem) => void;
  onClose: () => void;
}

export default function ThemeCardList({
  theme,
  items,
  onItemClick,
  onClose,
}: ThemeCardListProps) {
  const leverMeta = LEVER_META[theme.leverCategory];
  const themeItems = items.filter((item) => theme.itemIds.includes(item.id));

  const handleCardClick = useCallback(
    (item: RadarItem) => {
      onItemClick(item);
    },
    [onItemClick]
  );

  return (
    <div className="theme-card-list" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {/* Close + lever pill */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: leverMeta.color,
              background: leverMeta.colorLight,
              padding: "3px 10px",
              borderRadius: 999,
            }}
          >
            {leverMeta.label}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              padding: "2px 6px",
              borderRadius: 4,
              lineHeight: 1,
            }}
            aria-label="Close theme panel"
          >
            ×
          </button>
        </div>

        {/* Theme title */}
        <h2
          style={{
            fontFamily: "var(--font-dm-serif), Georgia, serif",
            fontSize: "1.25rem",
            color: "var(--foreground)",
            marginBottom: 6,
            fontWeight: 400,
          }}
        >
          {theme.label}
        </h2>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          {theme.description}
        </p>

        {/* Design question highlight */}
        <div
          style={{
            background: leverMeta.colorLight,
            borderRadius: 8,
            padding: "10px 14px",
            borderLeft: `3px solid ${leverMeta.color}`,
          }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              fontStyle: "italic",
              color: "var(--foreground)",
              lineHeight: 1.6,
              opacity: 0.85,
            }}
          >
            &ldquo;{theme.sampleQuestion}&rdquo;
          </p>
        </div>
      </div>

      {/* Card list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-secondary)",
            marginBottom: 8,
          }}
        >
          {themeItems.length} {themeItems.length === 1 ? "resource" : "resources"}
        </div>

        {themeItems.map((item, i) => (
          <button
            key={item.id}
            className="theme-card"
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "14px 14px",
              marginBottom: 8,
              cursor: "pointer",
              transition: "all 0.15s ease",
              animationDelay: `${i * 50}ms`,
            }}
            onClick={() => handleCardClick(item)}
          >
            {/* Source badge + year */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: item.source === "research" ? "#2563eb" : "#d97706",
                  background: item.source === "research" ? "#dbeafe" : "#fef3c7",
                  padding: "2px 7px",
                  borderRadius: 999,
                }}
              >
                {item.source}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                {item.year}
              </span>
            </div>

            {/* Title */}
            <h3
              style={{
                fontFamily: "var(--font-dm-serif), Georgia, serif",
                fontSize: "0.85rem",
                color: "var(--foreground)",
                fontWeight: 400,
                marginBottom: 6,
                lineHeight: 1.4,
              }}
            >
              {item.title}
            </h3>

            {/* Summary snippet */}
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.summary}
            </p>

            {/* Design question */}
            {item.designQuestion && (
              <p
                style={{
                  fontSize: "0.68rem",
                  fontStyle: "italic",
                  color: leverMeta.color,
                  lineHeight: 1.5,
                  marginTop: 8,
                  opacity: 0.8,
                }}
              >
                {item.designQuestion.length > 120
                  ? item.designQuestion.slice(0, 120) + "…"
                  : item.designQuestion}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
