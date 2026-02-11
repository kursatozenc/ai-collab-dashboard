"use client";

import { useCallback, useEffect, useState } from "react";
import { RadarItem, DesignLever, Cluster } from "../types";
import { DESIGN_THEMES, LEVER_META } from "../data/theme-map";

const DESIGN_LEVERS: { lever: DesignLever; label: string; description: string }[] = [
  { lever: "workflow", label: "Workflow", description: "How tasks flow between humans and AI" },
  { lever: "role", label: "Roles", description: "Who does what on the team" },
  { lever: "ritual", label: "Rituals", description: "Recurring practices that build trust" },
  { lever: "capability_boundary", label: "Boundaries", description: "Where AI stops and humans start" },
  { lever: "interface", label: "Interface", description: "How humans and AI communicate" },
  { lever: "governance", label: "Governance", description: "Rules, oversight, and accountability" },
];

interface DiscoveryOverlayProps {
  items: RadarItem[];
  clusters: Cluster[];
  onSelectLever: (lever: DesignLever) => void;
  onSelectTheme: (themeId: string) => void;
  onExploreAll: () => void;
}

export default function DiscoveryOverlay({
  items,
  onSelectLever,
  onSelectTheme,
  onExploreAll,
}: DiscoveryOverlayProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const dismiss = useCallback(
    (action: () => void) => {
      setIsExiting(true);
      setTimeout(() => action(), 280);
    },
    []
  );

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss(onExploreAll);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dismiss, onExploreAll]);

  // Compute lever stats
  const leverStats = DESIGN_LEVERS.map(({ lever, label, description }) => {
    const matching = items.filter(
      (item) => item.designLevers && item.designLevers.includes(lever)
    );
    const sampleQuestion = matching.find((i) => i.designQuestion)?.designQuestion || null;
    return { lever, label, description, count: matching.length, sampleQuestion };
  });

  return (
    <div
      className={`discovery-overlay ${mounted ? "discovery-overlay--visible" : ""} ${isExiting ? "discovery-overlay--exiting" : ""}`}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      {/* Backdrop — light paper blur */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(248, 246, 242, 0.92)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={() => dismiss(onExploreAll)}
      />

      {/* Content */}
      <div
        className="discovery-content"
        style={{
          position: "relative",
          maxWidth: 820,
          width: "100%",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
        }}
      >
        {/* Header */}
        <div className="discovery-card-stagger" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              color: "var(--ink-black)",
              fontSize: "1.75rem",
              fontWeight: 400,
              marginBottom: "0.5rem",
              letterSpacing: "0.01em",
            }}
          >
            What are you designing?
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Choose a design concern to explore relevant research
          </p>

          {/* Decorative SVG doodle — colored dots on a wavy line */}
          <svg
            width="120"
            height="12"
            viewBox="0 0 120 12"
            style={{ margin: "0.75rem auto 0", display: "block" }}
          >
            <path
              d="M 10 6 Q 30 2 60 6 T 110 6"
              fill="none"
              stroke="var(--pencil-grey)"
              strokeWidth="1"
              opacity="0.3"
              strokeLinecap="round"
            />
            <circle cx="25" cy="5" r="2.5" fill="#0d9488" opacity="0.6" />
            <circle cx="50" cy="6" r="2.5" fill="#2563eb" opacity="0.6" />
            <circle cx="75" cy="5" r="2.5" fill="#8b5cf6" opacity="0.6" />
            <circle cx="95" cy="6" r="2.5" fill="#f59e0b" opacity="0.6" />
          </svg>
        </div>

        {/* Design Concern Cards — light paper style */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.75rem",
            marginBottom: "2rem",
          }}
        >
          {leverStats.map(({ lever, label, description, count, sampleQuestion }, i) => (
            <button
              key={lever}
              className="discovery-card discovery-card-stagger"
              style={{
                "--stagger-index": i + 1,
                background: "#ffffff",
                border: "2px solid var(--ink-black)",
                borderRadius: "12px",
                padding: "1.25rem 1rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                boxShadow: "3px 3px 0 rgba(0,0,0,0.06)",
              } as React.CSSProperties}
              onClick={() => dismiss(() => onSelectLever(lever))}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-dm-serif), Georgia, serif",
                    color: "var(--ink-black)",
                    fontSize: "1rem",
                    fontWeight: 400,
                  }}
                >
                  {label}
                </span>
                <span style={{ color: "#9ca3af", fontSize: "0.7rem" }}>
                  {count} {count === 1 ? "resource" : "resources"}
                </span>
              </div>
              <p style={{ color: "#6b7280", fontSize: "0.75rem", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                {description}
              </p>
              {sampleQuestion && (
                <p
                  style={{
                    color: "#374151",
                    fontSize: "0.7rem",
                    lineHeight: 1.55,
                    fontStyle: "italic",
                    borderTop: "1.5px dashed var(--pencil-grey)",
                    paddingTop: "0.6rem",
                  }}
                >
                  &ldquo;{sampleQuestion.length > 120 ? sampleQuestion.slice(0, 120) + "..." : sampleQuestion}&rdquo;
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div
          className="discovery-card-stagger"
          style={{
            "--stagger-index": 7,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          } as React.CSSProperties}
        >
          <div style={{ flex: 1, height: 1, borderTop: "1.5px dashed var(--pencil-grey)", opacity: 0.3 }} />
          <span style={{ color: "#9ca3af", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            or browse by theme
          </span>
          <div style={{ flex: 1, height: 1, borderTop: "1.5px dashed var(--pencil-grey)", opacity: 0.3 }} />
        </div>

        {/* Theme Chips — light bg with bold border */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "2rem",
          }}
        >
          {DESIGN_THEMES.map((theme, i) => {
            const meta = LEVER_META[theme.leverCategory];
            return (
              <button
                key={theme.id}
                className="discovery-cluster-chip discovery-card-stagger"
                style={{
                  "--stagger-index": 8 + i,
                  background: "#ffffff",
                  border: "1.5px solid var(--ink-black)",
                  borderRadius: "999px",
                  padding: "0.4rem 0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  boxShadow: "2px 2px 0 rgba(0,0,0,0.04)",
                } as React.CSSProperties}
                onClick={() => dismiss(() => onSelectTheme(theme.id))}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: meta.color,
                    flexShrink: 0,
                    border: "1px solid var(--ink-black)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-dm-serif), Georgia, serif",
                    color: "var(--ink-black)",
                    fontSize: "0.75rem",
                  }}
                >
                  {theme.label}
                </span>
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.6rem",
                  }}
                >
                  {theme.itemIds.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explore All */}
        <div
          className="discovery-card-stagger"
          style={{ "--stagger-index": 26, textAlign: "center" } as React.CSSProperties}
        >
          <button
            className="discovery-explore-btn"
            style={{
              background: "none",
              border: "2px solid var(--ink-black)",
              borderRadius: "999px",
              padding: "0.6rem 2rem",
              color: "var(--ink-black)",
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.06)",
            }}
            onClick={() => dismiss(onExploreAll)}
          >
            Explore the full landscape &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
