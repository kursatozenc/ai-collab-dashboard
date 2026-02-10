"use client";

import { useState, useMemo, useCallback } from "react";
import { RadarItem, DesignLever, DesignerIntent } from "../types";
import TopicLandscape from "../components/TopicLandscape";
import ItemDetail from "../components/ItemDetail";
import FilterPanel from "../components/FilterPanel";
import SearchBar from "../components/SearchBar";
import ThemeCandidates from "../components/ThemeCandidates";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import graphData from "../data/research-graph.json";

const FILTER_DEBOUNCE_MS = 180;

const CLUSTER_ANCHORS: Record<string, [number, number]> = {
  trust: [200, 150],
  teamwork: [500, 300],
  delegation: [800, 150],
  communication: [200, 500],
  learning: [500, 550],
  ethics: [800, 500],
  creativity: [350, 120],
};

/** Stable empty set: when no filters are active we pass this so TopicLandscape doesn't re-run effects every parent render. */
const EMPTY_VISIBLE_IDS = new Set<string>();

export default function Home() {
  const [selectedItem, setSelectedItem] = useState<RadarItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [designQuestionFilter, setDesignQuestionFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "research" | "industry">("all");
  const [activeLeverFilters, setActiveLeverFilters] = useState<Set<DesignLever>>(new Set());
  const [activeIntentFilters, setActiveIntentFilters] = useState<Set<DesignerIntent>>(new Set());

  const items = graphData.nodes as RadarItem[];
  const clusters = graphData.clusters;

  // Debounce text filters so landscape/filter logic doesn't run on every keystroke
  const debouncedSearchQuery = useDebouncedValue(searchQuery, FILTER_DEBOUNCE_MS);
  const debouncedDesignQuestionFilter = useDebouncedValue(designQuestionFilter, FILTER_DEBOUNCE_MS);

  // Source counts
  const researchCount = useMemo(() => items.filter((i) => i.source === "research").length, [items]);
  const industryCount = useMemo(() => items.filter((i) => i.source === "industry").length, [items]);

  // Combined filtering (uses debounced text so typing doesn't thrash the landscape)
  const visibleItemIds = useMemo(() => {
    const filtered = items.filter((item) => {
      // Search
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
        if (
          !item.title.toLowerCase().includes(q) &&
          !item.authors.toLowerCase().includes(q) &&
          !item.summary.toLowerCase().includes(q) &&
          !item.designQuestion?.toLowerCase().includes(q) &&
          !item.tags?.some((t) => t.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      // Design question contains
      if (debouncedDesignQuestionFilter.trim()) {
        const q = debouncedDesignQuestionFilter.toLowerCase().trim();
        if (!item.designQuestion?.toLowerCase().includes(q)) return false;
      }
      // Source
      if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
      // Design levers (OR)
      if (
        activeLeverFilters.size > 0 &&
        !item.designLevers?.some((l) => activeLeverFilters.has(l))
      )
        return false;
      // Designer intents (OR)
      if (
        activeIntentFilters.size > 0 &&
        !item.designerIntents?.some((i) => activeIntentFilters.has(i))
      )
        return false;
      return true;
    });
    return new Set(filtered.map((i) => i.id));
  }, [items, debouncedSearchQuery, debouncedDesignQuestionFilter, sourceFilter, activeLeverFilters, activeIntentFilters]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    designQuestionFilter.trim() !== "" ||
    sourceFilter !== "all" ||
    activeLeverFilters.size > 0 ||
    activeIntentFilters.size > 0;

  const handleItemClick = useCallback((item: RadarItem) => {
    setSelectedItem(item);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleLeverToggle = useCallback((lever: DesignLever) => {
    setActiveLeverFilters((prev) => {
      const next = new Set(prev);
      if (next.has(lever)) next.delete(lever);
      else next.add(lever);
      return next;
    });
  }, []);

  const handleIntentToggle = useCallback((intent: DesignerIntent) => {
    setActiveIntentFilters((prev) => {
      const next = new Set(prev);
      if (next.has(intent)) next.delete(intent);
      else next.add(intent);
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchQuery("");
    setDesignQuestionFilter("");
    setSourceFilter("all");
    setActiveLeverFilters(new Set());
    setActiveIntentFilters(new Set());
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="flex-shrink-0 px-6 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h1
          className="text-xl"
          style={{
            fontFamily: "var(--font-dm-serif), Georgia, serif",
            color: "var(--foreground)",
          }}
        >
          Human-AI Collaboration Radar
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          A sensemaking instrument for designing AI-supported teams
        </p>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: filters */}
        <aside
          className="flex-shrink-0 w-56 p-5 border-r overflow-y-auto"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Search */}
          <div className="mb-6">
            <SearchBar
              onSearch={handleSearch}
              resultCount={visibleItemIds.size}
              totalCount={items.length}
            />
          </div>

          {/* Filters */}
          <FilterPanel
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            designQuestionFilter={designQuestionFilter}
            onDesignQuestionFilterChange={setDesignQuestionFilter}
            activeLeverFilters={activeLeverFilters}
            onLeverToggle={handleLeverToggle}
            activeIntentFilters={activeIntentFilters}
            onIntentToggle={handleIntentToggle}
            researchCount={researchCount}
            industryCount={industryCount}
            onClearAll={handleClearAll}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Divider */}
          <div className="h-px my-6" style={{ backgroundColor: "var(--border)" }} />

          {/* Emerging Themes */}
          <ThemeCandidates items={items} onItemClick={handleItemClick} />

          {/* Footer credit */}
          <div className="mt-8 text-[10px]" style={{ color: "var(--text-secondary)" }}>
            Curated by Kursat Ozenc
          </div>
        </aside>

        {/* Center: Topic landscape */}
        <main className="flex-1 relative overflow-hidden" style={{ backgroundColor: "#12121f" }}>
          <TopicLandscape
            items={items}
            clusters={clusters}
            visibleItemIds={hasActiveFilters ? visibleItemIds : EMPTY_VISIBLE_IDS}
            selectedItem={selectedItem}
            onItemClick={handleItemClick}
            clusterAnchors={CLUSTER_ANCHORS}
          />
        </main>

        {/* Right: Detail panel */}
        {selectedItem && (
          <aside
            className="flex-shrink-0 w-[360px] border-l overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <ItemDetail
              item={selectedItem}
              cluster={clusters.find((c) => c.id === selectedItem.cluster)}
              onClose={() => setSelectedItem(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
