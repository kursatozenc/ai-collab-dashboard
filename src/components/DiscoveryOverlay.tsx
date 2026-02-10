"use client";

import { useCallback, useEffect, useState } from "react";
import { RadarItem, DesignLever, Cluster } from "../types";

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
  onSelectCluster: (clusterId: string) => void;
  onExploreAll: () => void;
}

export default function DiscoveryOverlay({
  items,
  clusters,
  onSelectLever,
  onSelectCluster,
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
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(12, 12, 22, 0.88)",
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
              color: "#ffffff",
              fontSize: "1.75rem",
              fontWeight: 400,
              marginBottom: "0.5rem",
              letterSpacing: "0.01em",
            }}
          >
            What are you designing?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
            Choose a design concern to explore relevant research
          </p>
        </div>

        {/* Design Concern Cards */}
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
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "1.25rem 1rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              } as React.CSSProperties}
              onClick={() => dismiss(() => onSelectLever(lever))}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-dm-serif), Georgia, serif",
                    color: "#ffffff",
                    fontSize: "1rem",
                    fontWeight: 400,
                  }}
                >
                  {label}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>
                  {count} {count === 1 ? "resource" : "resources"}
                </span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                {description}
              </p>
              {sampleQuestion && (
                <p
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.7rem",
                    lineHeight: 1.55,
                    fontStyle: "italic",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
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
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            or browse by topic
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Topic Cluster Cards */}
        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "2rem",
          }}
        >
          {clusters.map((cluster, i) => {
            const count = items.filter((item) => item.cluster === cluster.id).length;
            return (
              <button
                key={cluster.id}
                className="discovery-cluster-chip discovery-card-stagger"
                style={{
                  "--stagger-index": 8 + i,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "999px",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                } as React.CSSProperties}
                onClick={() => dismiss(() => onSelectCluster(cluster.id))}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-serif), Georgia, serif",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: "0.8rem",
                  }}
                >
                  {cluster.label}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: "0.65rem",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explore All */}
        <div
          className="discovery-card-stagger"
          style={{ "--stagger-index": 13, textAlign: "center" } as React.CSSProperties}
        >
          <button
            className="discovery-explore-btn"
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "999px",
              padding: "0.6rem 2rem",
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "var(--font-dm-serif), Georgia, serif",
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
