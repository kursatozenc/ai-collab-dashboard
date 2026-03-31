"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RadarItem, AtlasState, CompareMode } from "../types";
import AtlasMap from "../components/AtlasMap";
import AtlasPanel from "../components/AtlasPanel";
import StarCanvas from "../components/StarCanvas";
import {
  TERRITORY_MAP,
  NEIGHBORHOOD_MAP,
  ROUTES,
} from "../data/atlas-data";
import graphData from "../data/research-graph.json";

// ─── Panel variant builder ────────────────────────────────────────────────────

function buildPanelVariant(
  state: AtlasState,
  selectedTerritoryId: string | null,
  selectedNeighborhoodId: string | null,
  selectedSourceItem: RadarItem | null,
  routeId: string | null,
  routeStopIndex: number
) {
  switch (state) {
    case "territory": {
      const territory = selectedTerritoryId
        ? TERRITORY_MAP.get(selectedTerritoryId)
        : null;
      if (territory) return { type: "territory" as const, territory };
      break;
    }
    case "neighborhood": {
      const neighborhood = selectedNeighborhoodId
        ? NEIGHBORHOOD_MAP.get(selectedNeighborhoodId)
        : null;
      if (neighborhood) return { type: "neighborhood" as const, neighborhood };
      break;
    }
    case "source": {
      if (selectedSourceItem)
        return { type: "source" as const, item: selectedSourceItem };
      break;
    }
    case "route": {
      const route = routeId ? ROUTES.find((r) => r.id === routeId) : null;
      if (route)
        return { type: "route" as const, route, stopIndex: routeStopIndex };
      break;
    }
    case "atlas":
    default:
      return { type: "welcome" as const };
  }
  return { type: "welcome" as const };
}

// ─── Entry Overlay ────────────────────────────────────────────────────────────

function EntryOverlay({
  onExplore,
  onRoute,
}: {
  onExplore: () => void;
  onRoute: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(247, 243, 237, 0.88)",
        backdropFilter: "blur(2px)",
        zIndex: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          maxWidth: 480,
          textAlign: "center",
          padding: "0 32px",
        }}
      >
        {/* Ornamental rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
            justifyContent: "center",
          }}
        >
          <div style={{ height: 1, width: 40, background: "#b8a898" }} />
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "#9e8a7a",
              fontFamily: "var(--font-inter), system-ui",
              textTransform: "uppercase",
            }}
          >
            A Scholarly Atlas
          </span>
          <div style={{ height: 1, width: 40, background: "#b8a898" }} />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-dm-serif), Georgia, serif",
            fontSize: 34,
            color: "#2d2926",
            lineHeight: 1.2,
            marginBottom: 16,
            fontWeight: 400,
          }}
        >
          Atlas of Human-AI
          <br />
          Collaboration
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "#6b6560",
            lineHeight: 1.7,
            marginBottom: 32,
            fontFamily: "var(--font-inter), system-ui",
          }}
        >
          A navigable landscape of research and industry knowledge.
          <br />
          Six territories. Emergent neighborhoods. Real sources.
        </p>

        <div
          style={{ display: "flex", gap: 10, justifyContent: "center" }}
        >
          <button
            onClick={onExplore}
            style={{
              padding: "11px 24px",
              borderRadius: 7,
              border: "1px solid #2d2926",
              background: "#2d2926",
              color: "#f7f3ed",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "var(--font-inter), system-ui",
              fontWeight: 500,
              letterSpacing: "0.03em",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#3d3530";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#2d2926";
            }}
          >
            Explore the Atlas
          </button>
          <button
            onClick={onRoute}
            style={{
              padding: "11px 24px",
              borderRadius: 7,
              border: "1px solid #8b6d6d",
              background: "transparent",
              color: "#8b6d6d",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "var(--font-inter), system-ui",
              letterSpacing: "0.03em",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f9f1f1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            Take a Guided Route
          </button>
        </div>

        {/* Source count legend */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            gap: 16,
            justifyContent: "center",
            opacity: 0.55,
          }}
        >
          {[
            { label: "territories", value: "6" },
            { label: "research papers", value: "58" },
            { label: "neighborhoods", value: "25" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 18,
                  fontFamily: "var(--font-dm-serif), Georgia, serif",
                  color: "#2d2926",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: "#9e8a7a",
                  fontFamily: "var(--font-inter), system-ui",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const items = graphData.nodes as RadarItem[];

  // ── Atlas state ────────────────────────────────────────────────────────────
  const [atlasState, setAtlasState] = useState<AtlasState>("entry");
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string | null>(null);
  const [selectedSourceItem, setSelectedSourceItem] = useState<RadarItem | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [routeStopIndex, setRouteStopIndex] = useState(0);
  const [compareMode, setCompareMode] = useState<CompareMode>("both");
  // Remembers which state to return to when a source panel is closed
  const sourceReturnStateRef = useRef<AtlasState | null>(null);

  // ── Derived: which territory the map camera focuses on ────────────────────
  // Also works when atlasState is "source" opened from within a route
  const activeRouteFocusId = useMemo(() => {
    const isInRoute =
      atlasState === "route" ||
      (atlasState === "source" && sourceReturnStateRef.current === "route");
    if (!isInRoute || !activeRouteId) return null;
    const route = ROUTES.find((r) => r.id === activeRouteId);
    if (!route) return null;
    return route.stops[routeStopIndex]?.focus_id ?? null;
  }, [atlasState, activeRouteId, routeStopIndex]);

  // ── Panel variant ─────────────────────────────────────────────────────────
  const panelVariant = useMemo(
    () =>
      buildPanelVariant(
        atlasState,
        selectedTerritoryId,
        selectedNeighborhoodId,
        selectedSourceItem,
        activeRouteId,
        routeStopIndex
      ),
    [
      atlasState,
      selectedTerritoryId,
      selectedNeighborhoodId,
      selectedSourceItem,
      activeRouteId,
      routeStopIndex,
    ]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEnterAtlas = useCallback(() => {
    setAtlasState("atlas");
  }, []);

  const handleStartRoute = useCallback((routeId: string) => {
    setActiveRouteId(routeId);
    setRouteStopIndex(0);
    setSelectedTerritoryId(null);
    setSelectedNeighborhoodId(null);
    setSelectedSourceItem(null);
    setAtlasState("route");
  }, []);

  const handleEntryRoute = useCallback(() => {
    handleStartRoute(ROUTES[0].id);
    setAtlasState("route");
  }, [handleStartRoute]);

  const handleTerritoryClick = useCallback((id: string) => {
    setSelectedTerritoryId(id);
    setSelectedNeighborhoodId(null);
    setSelectedSourceItem(null);
    setAtlasState("territory");
  }, []);

  const handleNeighborhoodClick = useCallback((id: string) => {
    setSelectedNeighborhoodId(id);
    setSelectedSourceItem(null);
    setAtlasState("neighborhood");
  }, []);

  const handleSourceClick = useCallback((item: RadarItem) => {
    sourceReturnStateRef.current = atlasState; // remember where we came from
    setSelectedSourceItem(item);
    setAtlasState("source");
  }, [atlasState]);

  const handleMapBackgroundClick = useCallback(() => {
    if (atlasState === "entry") return;
    if (atlasState === "route") return; // don't dismiss route on bg click
    if (selectedSourceItem) {
      const returnState = sourceReturnStateRef.current;
      sourceReturnStateRef.current = null;
      setSelectedSourceItem(null);
      if (returnState === "route") {
        setAtlasState("route");
      } else {
        setAtlasState(selectedNeighborhoodId ? "neighborhood" : selectedTerritoryId ? "territory" : "atlas");
      }
      return;
    }
    if (selectedNeighborhoodId) {
      setSelectedNeighborhoodId(null);
      setAtlasState(selectedTerritoryId ? "territory" : "atlas");
      return;
    }
    if (selectedTerritoryId) {
      setSelectedTerritoryId(null);
      setAtlasState("atlas");
      return;
    }
  }, [atlasState, selectedTerritoryId, selectedNeighborhoodId, selectedSourceItem]);

  const handlePanelClose = useCallback(() => {
    if (atlasState === "source") {
      const returnState = sourceReturnStateRef.current;
      sourceReturnStateRef.current = null;
      setSelectedSourceItem(null);
      if (returnState === "route") {
        setAtlasState("route"); // restore route — activeRouteId & routeStopIndex unchanged
      } else {
        setAtlasState(selectedNeighborhoodId ? "neighborhood" : selectedTerritoryId ? "territory" : "atlas");
      }
    } else if (atlasState === "neighborhood") {
      setSelectedNeighborhoodId(null);
      setAtlasState(selectedTerritoryId ? "territory" : "atlas");
    } else if (atlasState === "territory") {
      setSelectedTerritoryId(null);
      setAtlasState("atlas");
    } else if (atlasState === "route") {
      setAtlasState("atlas");
      setActiveRouteId(null);
    } else {
      setAtlasState("atlas");
    }
  }, [atlasState, selectedTerritoryId, selectedNeighborhoodId]);

  const handleRouteNext = useCallback(() => {
    const route = ROUTES.find((r) => r.id === activeRouteId);
    if (!route) return;
    if (routeStopIndex < route.stops.length - 1) {
      setRouteStopIndex((i) => i + 1);
    }
  }, [activeRouteId, routeStopIndex]);

  const handleRoutePrev = useCallback(() => {
    if (routeStopIndex > 0) {
      setRouteStopIndex((i) => i - 1);
    }
  }, [routeStopIndex]);

  const showPanel =
    atlasState !== "entry" &&
    atlasState !== "atlas" &&
    panelVariant !== null;

  const showEntryOverlay = atlasState === "entry";

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        style={{
          flexShrink: 0,
          padding: "12px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface)",
        }}
      >
        <div>
          <button
            onClick={handleEnterAtlas}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: atlasState !== "entry" ? "pointer" : "default",
              textAlign: "left",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-dm-serif), Georgia, serif",
                fontSize: 17,
                color: "var(--foreground)",
                fontWeight: 400,
                letterSpacing: "0.01em",
                margin: 0,
              }}
            >
              Atlas of Human-AI Collaboration
            </h1>
          </button>
          <p
            style={{
              fontSize: 10.5,
              color: "var(--text-secondary)",
              marginTop: 2,
              fontFamily: "var(--font-inter), system-ui",
            }}
          >
            A navigable scholarly landscape · 6 territories · 58 research sources
          </p>
        </div>

        {/* Breadcrumb */}
        {atlasState !== "entry" && atlasState !== "atlas" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-inter), system-ui",
            }}
          >
            <button
              onClick={handleEnterAtlas}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: 11,
                padding: 0,
                fontFamily: "var(--font-inter), system-ui",
              }}
            >
              Atlas
            </button>
            {atlasState === "route" ? (
              <>
                <span>›</span>
                <span style={{ color: "#8b6d6d" }}>
                  {ROUTES.find((r) => r.id === activeRouteId)?.name}
                </span>
              </>
            ) : (
              <>
                {selectedTerritoryId && (
                  <>
                    <span>›</span>
                    <button
                      onClick={() => {
                        setAtlasState("territory");
                        setSelectedNeighborhoodId(null);
                        setSelectedSourceItem(null);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color:
                          atlasState === "territory"
                            ? "var(--foreground)"
                            : "var(--text-secondary)",
                        fontSize: 11,
                        padding: 0,
                        fontFamily: "var(--font-inter), system-ui",
                      }}
                    >
                      {TERRITORY_MAP.get(selectedTerritoryId)?.name}
                    </button>
                  </>
                )}
                {selectedNeighborhoodId && (
                  <>
                    <span>›</span>
                    <span style={{ color: "var(--foreground)" }}>
                      {NEIGHBORHOOD_MAP.get(selectedNeighborhoodId)?.name}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Route entry point (from atlas default state) */}
        {atlasState === "atlas" && (
          <button
            onClick={() => handleStartRoute(ROUTES[0].id)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #8b6d6d",
              background: "transparent",
              color: "#8b6d6d",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "var(--font-inter), system-ui",
              letterSpacing: "0.03em",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f9f1f1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            Take a Guided Route ›
          </button>
        )}
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Map */}
        <main
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: "#f0e6cc",
            transition: "flex 0.3s ease",
          }}
        >
          <StarCanvas />
          <AtlasMap
            items={items}
            selectedTerritoryId={selectedTerritoryId}
            selectedNeighborhoodId={selectedNeighborhoodId}
            selectedSourceId={selectedSourceItem?.id ?? null}
            activeRouteStopFocusId={activeRouteFocusId}
            compareMode={compareMode}
            onTerritoryClick={handleTerritoryClick}
            onNeighborhoodClick={handleNeighborhoodClick}
            onSourceClick={handleSourceClick}
            onMapBackgroundClick={handleMapBackgroundClick}
          />

          {/* Entry overlay */}
          <AnimatePresence>
            {showEntryOverlay && (
              <EntryOverlay
                onExplore={handleEnterAtlas}
                onRoute={handleEntryRoute}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Panel */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                display: "flex",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <AtlasPanel
                variant={panelVariant}
                onClose={handlePanelClose}
                onTerritoryClick={handleTerritoryClick}
                onNeighborhoodClick={handleNeighborhoodClick}
                onSourceClick={handleSourceClick}
                onRouteStepNext={handleRouteNext}
                onRouteStepPrev={handleRoutePrev}
                onStartRoute={handleStartRoute}
                allItems={items}
                compareMode={compareMode}
                onCompareModeChange={setCompareMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
