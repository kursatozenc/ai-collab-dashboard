"use client";

import { DesignLever, DesignerIntent } from "../types";

const DESIGN_LEVERS: { id: DesignLever; label: string }[] = [
  { id: "workflow", label: "Workflow" },
  { id: "role", label: "Role" },
  { id: "ritual", label: "Ritual" },
  { id: "capability_boundary", label: "Capability Boundary" },
  { id: "interface", label: "Interface" },
  { id: "governance", label: "Governance" },
];

const DESIGNER_INTENTS: { id: DesignerIntent; label: string }[] = [
  { id: "team_structure", label: "Team Structure" },
  { id: "workflow_redesign", label: "Workflow Redesign" },
  { id: "role_definition", label: "Role Definition" },
  { id: "ritual_design", label: "Ritual Design" },
  { id: "tooling_selection", label: "Tooling Selection" },
  { id: "governance_policy", label: "Governance & Policy" },
  { id: "learning_upskilling", label: "Learning & Upskilling" },
];

interface FilterPanelProps {
  sourceFilter: "all" | "research" | "industry";
  onSourceFilterChange: (source: "all" | "research" | "industry") => void;
  activeLeverFilters: Set<DesignLever>;
  onLeverToggle: (lever: DesignLever) => void;
  activeIntentFilters: Set<DesignerIntent>;
  onIntentToggle: (intent: DesignerIntent) => void;
  researchCount: number;
  industryCount: number;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export default function FilterPanel({
  sourceFilter,
  onSourceFilterChange,
  activeLeverFilters,
  onLeverToggle,
  activeIntentFilters,
  onIntentToggle,
  researchCount,
  industryCount,
  onClearAll,
  hasActiveFilters,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {/* Source toggle (Gap Lens) */}
      <div>
        <h4
          className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Source
        </h4>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          {(["all", "research", "industry"] as const).map((source) => (
            <button
              key={source}
              onClick={() => onSourceFilterChange(source)}
              className="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: sourceFilter === source ? "var(--surface)" : "transparent",
                color: sourceFilter === source ? "var(--foreground)" : "var(--text-secondary)",
                borderRight: source !== "industry" ? "1px solid var(--border)" : "none",
              }}
            >
              {source === "all" ? "All" : source === "research" ? "Research" : "Industry"}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--text-secondary)" }}>
          <span>
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: "var(--research-color)" }} />
            Research: {researchCount}
          </span>
          <span>
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: "var(--industry-color)" }} />
            Industry: {industryCount}
          </span>
        </div>
      </div>

      {/* Design Levers */}
      <div>
        <h4
          className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Design Levers
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {DESIGN_LEVERS.map(({ id, label }) => {
            const isActive = activeLeverFilters.has(id);
            return (
              <button
                key={id}
                onClick={() => onLeverToggle(id)}
                className="filter-pill px-2.5 py-1 text-[11px] rounded-full border"
                style={{
                  backgroundColor: isActive ? "#dbeafe" : "transparent",
                  borderColor: isActive ? "#93c5fd" : "var(--border)",
                  color: isActive ? "#1d4ed8" : "var(--text-secondary)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Designer Intents */}
      <div>
        <h4
          className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Designer Intents
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {DESIGNER_INTENTS.map(({ id, label }) => {
            const isActive = activeIntentFilters.has(id);
            return (
              <button
                key={id}
                onClick={() => onIntentToggle(id)}
                className="filter-pill px-2.5 py-1 text-[11px] rounded-full border"
                style={{
                  backgroundColor: isActive ? "#fef3c7" : "transparent",
                  borderColor: isActive ? "#fcd34d" : "var(--border)",
                  color: isActive ? "#92400e" : "var(--text-secondary)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="w-full text-xs py-1.5 rounded-lg border transition-colors"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
