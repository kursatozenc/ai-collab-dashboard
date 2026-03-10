"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RadarItem, AtlasState, CompareMode } from "../types";
import type { Territory, Neighborhood, Route } from "../types";
import {
  TERRITORY_MAP,
  NEIGHBORHOOD_MAP,
  getNeighborhoodsForTerritory,
  ROUTES,
} from "../data/atlas-data";

// ─── Panel variants ───────────────────────────────────────────────────────────

type PanelVariant =
  | { type: "welcome" }
  | { type: "territory"; territory: Territory }
  | { type: "neighborhood"; neighborhood: Neighborhood }
  | { type: "source"; item: RadarItem }
  | { type: "route"; route: Route; stopIndex: number };

interface Props {
  variant: PanelVariant | null;
  onClose: () => void;
  onTerritoryClick: (id: string) => void;
  onNeighborhoodClick: (id: string) => void;
  onSourceClick: (item: RadarItem) => void;
  onRouteStepNext: () => void;
  onRouteStepPrev: () => void;
  onStartRoute: (routeId: string) => void;
  allItems: RadarItem[];
  compareMode: CompareMode;
  onCompareModeChange: (mode: CompareMode) => void;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 9,
        fontFamily: "var(--font-inter), system-ui",
        letterSpacing: "0.12em",
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        marginBottom: 6,
        marginTop: 16,
        fontWeight: 500,
      }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--border)",
        margin: "14px 0",
        opacity: 0.6,
      }}
    />
  );
}

function Tag({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 9.5,
        padding: "2px 7px",
        borderRadius: 99,
        border: `1px solid ${color ?? "var(--border)"}`,
        color: color ?? "var(--text-secondary)",
        fontFamily: "var(--font-inter), system-ui",
        marginRight: 4,
        marginBottom: 4,
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </span>
  );
}

function SourceCard({
  item,
  onClick,
}: {
  item: RadarItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        marginBottom: 6,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--surface-hover)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "#b8a898";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--surface)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border)";
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "flex-start",
          marginBottom: 3,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: item.source === "research" ? "50%" : 1,
            background:
              item.source === "research"
                ? "var(--research-color)"
                : "var(--industry-color)",
            marginTop: 2,
            flexShrink: 0,
            transform:
              item.source === "industry" ? "rotate(45deg)" : undefined,
          }}
        />
        <span
          style={{
            fontSize: 11,
            color: "var(--foreground)",
            fontFamily: "var(--font-inter), system-ui",
            lineHeight: 1.4,
            fontWeight: 500,
          }}
        >
          {item.title}
        </span>
      </div>
      <div
        style={{
          fontSize: 9.5,
          color: "var(--text-secondary)",
          fontFamily: "var(--font-inter), system-ui",
          marginLeft: 13,
        }}
      >
        {item.authors} · {item.year}
      </div>
    </button>
  );
}

// ─── Panel variants ───────────────────────────────────────────────────────────

function WelcomePanel({
  onStartRoute,
  onTerritoryClick,
}: {
  onStartRoute: (id: string) => void;
  onTerritoryClick: (id: string) => void;
}) {
  const territories = Array.from(TERRITORY_MAP.values());

  return (
    <div style={{ padding: "24px 20px" }}>
      <h2
        style={{
          fontFamily: "var(--font-dm-serif), Georgia, serif",
          fontSize: 20,
          color: "var(--foreground)",
          marginBottom: 6,
          lineHeight: 1.25,
        }}
      >
        Atlas of Human-AI Collaboration
      </h2>
      <p
        style={{
          fontSize: 12.5,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          marginBottom: 20,
          fontFamily: "var(--font-inter), system-ui",
        }}
      >
        A navigable scholarly landscape of the field. Click any territory to
        explore its research, tensions, and design implications.
      </p>

      {/* Guided route CTA */}
      <button
        onClick={() => onStartRoute(ROUTES[0].id)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #8b6d6d",
          background: "#f9f1f1",
          cursor: "pointer",
          textAlign: "left",
          marginBottom: 20,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#f2e8e8";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#f9f1f1";
        }}
      >
        <p
          style={{
            fontSize: 9,
            letterSpacing: "0.12em",
            color: "#8b6d6d",
            textTransform: "uppercase",
            marginBottom: 3,
            fontFamily: "var(--font-inter), system-ui",
          }}
        >
          Guided Route
        </p>
        <p
          style={{
            fontSize: 12.5,
            color: "var(--foreground)",
            fontWeight: 500,
            fontFamily: "var(--font-dm-serif), Georgia, serif",
          }}
        >
          {ROUTES[0].name}
        </p>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-secondary)",
            marginTop: 3,
            fontFamily: "var(--font-inter), system-ui",
          }}
        >
          {ROUTES[0].stops.length} stops through the field
        </p>
      </button>

      <SectionLabel>Territories</SectionLabel>
      {territories.map((t) => (
        <button
          key={t.id}
          onClick={() => onTerritoryClick(t.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            textAlign: "left",
            padding: "7px 8px",
            borderRadius: 5,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            marginBottom: 2,
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--surface-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: t.color,
              flexShrink: 0,
              opacity: 0.7,
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: "var(--foreground)",
              fontFamily: "var(--font-dm-serif), Georgia, serif",
            }}
          >
            {t.name}
          </span>
        </button>
      ))}

      <Divider />
      <p
        style={{
          fontSize: 10.5,
          color: "var(--text-secondary)",
          fontStyle: "italic",
          lineHeight: 1.55,
          fontFamily: "var(--font-dm-serif), Georgia, serif",
        }}
      >
        "The atlas provides the frame; the research provides the living terrain
        inside it."
      </p>
    </div>
  );
}

function TerritoryPanel({
  territory,
  allItems,
  onNeighborhoodClick,
  onSourceClick,
  onClose,
}: {
  territory: Territory;
  allItems: RadarItem[];
  onNeighborhoodClick: (id: string) => void;
  onSourceClick: (item: RadarItem) => void;
  onClose: () => void;
}) {
  const neighborhoods = getNeighborhoodsForTerritory(territory.id);
  const adjacentTerritories = territory.adjacency
    .map((id) => TERRITORY_MAP.get(id))
    .filter(Boolean) as Territory[];

  // Get a few representative sources from this territory's neighborhoods
  const sourceIds = new Set<string>();
  for (const nh of neighborhoods) {
    for (const sid of nh.representative_source_ids.slice(0, 2)) {
      sourceIds.add(sid);
    }
  }
  const repSources = allItems
    .filter((i) => sourceIds.has(i.id))
    .slice(0, 5);

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: territory.color,
              opacity: 0.75,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              fontFamily: "var(--font-inter), system-ui",
            }}
          >
            Territory
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 16,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-dm-serif), Georgia, serif",
          fontSize: 19,
          color: "var(--foreground)",
          lineHeight: 1.25,
          marginBottom: 10,
        }}
      >
        {territory.name}
      </h2>

      <p
        style={{
          fontSize: 12.5,
          color: "var(--foreground)",
          fontStyle: "italic",
          lineHeight: 1.6,
          marginBottom: 14,
          fontFamily: "var(--font-dm-serif), Georgia, serif",
        }}
      >
        {territory.thesis}
      </p>

      <SectionLabel>Why it matters</SectionLabel>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          fontFamily: "var(--font-inter), system-ui",
        }}
      >
        {territory.why_it_matters}
      </p>

      <SectionLabel>Key tensions</SectionLabel>
      <ul style={{ margin: 0, paddingLeft: 14 }}>
        {territory.key_tensions.map((t, i) => (
          <li
            key={i}
            style={{
              fontSize: 11.5,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 3,
              fontFamily: "var(--font-inter), system-ui",
            }}
          >
            {t}
          </li>
        ))}
      </ul>

      <SectionLabel>Design implications</SectionLabel>
      <ul style={{ margin: 0, paddingLeft: 14 }}>
        {territory.design_implications.map((d, i) => (
          <li
            key={i}
            style={{
              fontSize: 11.5,
              color: "var(--foreground)",
              lineHeight: 1.6,
              marginBottom: 3,
              fontFamily: "var(--font-inter), system-ui",
            }}
          >
            {d}
          </li>
        ))}
      </ul>

      {neighborhoods.length > 0 && (
        <>
          <SectionLabel>Neighborhoods</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {neighborhoods.map((nh) => (
              <button
                key={nh.id}
                onClick={() => onNeighborhoodClick(nh.id)}
                style={{
                  padding: "4px 9px",
                  borderRadius: 99,
                  border: `1px solid ${territory.strokeColor}`,
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 10.5,
                  color: territory.strokeColor,
                  fontFamily: "var(--font-inter), system-ui",
                  fontStyle: "italic",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    territory.color + "25";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                {nh.name}
              </button>
            ))}
          </div>
        </>
      )}

      {repSources.length > 0 && (
        <>
          <SectionLabel>Representative sources</SectionLabel>
          {repSources.map((item) => (
            <SourceCard
              key={item.id}
              item={item}
              onClick={() => onSourceClick(item)}
            />
          ))}
        </>
      )}

      {adjacentTerritories.length > 0 && (
        <>
          <Divider />
          <SectionLabel>Adjacent territories</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {adjacentTerritories.map((t) => (
              <Tag key={t.id} color={t.strokeColor}>
                {t.name}
              </Tag>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NeighborhoodPanel({
  neighborhood,
  allItems,
  onSourceClick,
  onTerritoryClick,
  onNeighborhoodClick,
  onClose,
}: {
  neighborhood: Neighborhood;
  allItems: RadarItem[];
  onSourceClick: (item: RadarItem) => void;
  onTerritoryClick: (id: string) => void;
  onNeighborhoodClick: (id: string) => void;
  onClose: () => void;
}) {
  const parentTerritories = neighborhood.territory_ids
    .map((id) => TERRITORY_MAP.get(id))
    .filter(Boolean) as Territory[];

  const repSources = allItems.filter((i) =>
    neighborhood.representative_source_ids.includes(i.id)
  );

  const relatedNeighborhoods = neighborhood.related_neighborhood_ids
    .map((id) => NEIGHBORHOOD_MAP.get(id))
    .filter(Boolean);

  const primaryTerritory = parentTerritories[0];

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {parentTerritories.map((t) => (
            <button
              key={t.id}
              onClick={() => onTerritoryClick(t.id)}
              style={{
                padding: "2px 8px",
                borderRadius: 99,
                border: `1px solid ${t.strokeColor}`,
                background: "transparent",
                cursor: "pointer",
                fontSize: 9,
                color: t.strokeColor,
                fontFamily: "var(--font-inter), system-ui",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 16,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-dm-serif), Georgia, serif",
          fontSize: 17,
          color: "var(--foreground)",
          lineHeight: 1.25,
          marginBottom: 8,
          marginTop: 6,
        }}
      >
        {neighborhood.name}
      </h2>

      <p
        style={{
          fontSize: 12.5,
          color: "var(--foreground)",
          fontStyle: "italic",
          lineHeight: 1.6,
          marginBottom: 12,
          fontFamily: "var(--font-dm-serif), Georgia, serif",
        }}
      >
        {neighborhood.thesis}
      </p>

      <SectionLabel>Why it matters</SectionLabel>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          fontFamily: "var(--font-inter), system-ui",
        }}
      >
        {neighborhood.why_it_matters}
      </p>

      <SectionLabel>Key tensions</SectionLabel>
      <ul style={{ margin: 0, paddingLeft: 14 }}>
        {neighborhood.key_tensions.map((t, i) => (
          <li
            key={i}
            style={{
              fontSize: 11.5,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 3,
              fontFamily: "var(--font-inter), system-ui",
            }}
          >
            {t}
          </li>
        ))}
      </ul>

      <SectionLabel>Design moves</SectionLabel>
      <ul style={{ margin: 0, paddingLeft: 14 }}>
        {neighborhood.design_moves.map((m, i) => (
          <li
            key={i}
            style={{
              fontSize: 11.5,
              color: "var(--foreground)",
              lineHeight: 1.6,
              marginBottom: 4,
              fontFamily: "var(--font-inter), system-ui",
            }}
          >
            {m}
          </li>
        ))}
      </ul>

      {repSources.length > 0 && (
        <>
          <SectionLabel>Sources</SectionLabel>
          {repSources.map((item) => (
            <SourceCard
              key={item.id}
              item={item}
              onClick={() => onSourceClick(item)}
            />
          ))}
        </>
      )}

      {relatedNeighborhoods.length > 0 && (
        <>
          <Divider />
          <SectionLabel>Related neighborhoods</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {relatedNeighborhoods.map((nh) => (
              <button
                key={nh!.id}
                onClick={() => onNeighborhoodClick(nh!.id)}
                style={{
                  padding: "3px 9px",
                  borderRadius: 99,
                  border: `1px solid ${primaryTerritory?.strokeColor ?? "var(--border)"}`,
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 10,
                  fontStyle: "italic",
                  color: primaryTerritory?.strokeColor ?? "var(--text-secondary)",
                  fontFamily: "var(--font-dm-serif), Georgia, serif",
                  transition: "all 0.12s",
                }}
              >
                {nh!.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SourcePanel({
  item,
  onClose,
  onTerritoryClick,
  onNeighborhoodClick,
}: {
  item: RadarItem;
  onClose: () => void;
  onTerritoryClick: (id: string) => void;
  onNeighborhoodClick: (id: string) => void;
}) {
  const isResearch = item.source === "research";

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: isResearch ? "50%" : 2,
              background: isResearch
                ? "var(--research-color)"
                : "var(--industry-color)",
              transform: !isResearch ? "rotate(45deg)" : undefined,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.12em",
              color: isResearch ? "var(--research-color)" : "var(--industry-color)",
              textTransform: "uppercase",
              fontFamily: "var(--font-inter), system-ui",
              fontWeight: 500,
            }}
          >
            {item.source} · {item.year}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 16,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-dm-serif), Georgia, serif",
          fontSize: 15,
          color: "var(--foreground)",
          lineHeight: 1.35,
          marginBottom: 4,
        }}
      >
        {item.title}
      </h2>

      <p
        style={{
          fontSize: 11,
          color: "var(--text-secondary)",
          marginBottom: 12,
          fontFamily: "var(--font-inter), system-ui",
        }}
      >
        {item.authors}
      </p>

      <SectionLabel>Summary</SectionLabel>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          lineHeight: 1.65,
          fontFamily: "var(--font-inter), system-ui",
        }}
      >
        {item.summary}
      </p>

      {item.designQuestion && (
        <>
          <SectionLabel>Design question</SectionLabel>
          <p
            style={{
              fontSize: 12,
              color: "var(--foreground)",
              fontStyle: "italic",
              lineHeight: 1.6,
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              borderLeft: "2px solid var(--border)",
              paddingLeft: 10,
            }}
          >
            {item.designQuestion}
          </p>
        </>
      )}

      {item.tags && item.tags.length > 0 && (
        <>
          <SectionLabel>Tags</SectionLabel>
          <div>
            {item.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </>
      )}

      {item.url && (
        <>
          <Divider />
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              color: "var(--accent)",
              fontFamily: "var(--font-inter), system-ui",
              textDecoration: "none",
              padding: "6px 0",
            }}
          >
            Open source ↗
          </a>
        </>
      )}

      {item.citation && (
        <p
          style={{
            fontSize: 9.5,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            fontFamily: "var(--font-inter), system-ui",
            marginTop: 8,
            fontStyle: "italic",
          }}
        >
          {item.citation}
        </p>
      )}
    </div>
  );
}

function RoutePanel({
  route,
  stopIndex,
  allItems,
  onNext,
  onPrev,
  onSourceClick,
  onClose,
}: {
  route: Route;
  stopIndex: number;
  allItems: RadarItem[];
  onNext: () => void;
  onPrev: () => void;
  onSourceClick: (item: RadarItem) => void;
  onClose: () => void;
}) {
  const stop = route.stops[stopIndex];
  const isFirst = stopIndex === 0;
  const isLast = stopIndex === route.stops.length - 1;
  const territory =
    stop.focus_type === "territory"
      ? TERRITORY_MAP.get(stop.focus_id)
      : undefined;
  const stopSources = allItems.filter((i) =>
    stop.source_ids.includes(i.id)
  );

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.12em",
            color: "#8b6d6d",
            textTransform: "uppercase",
            fontFamily: "var(--font-inter), system-ui",
            fontWeight: 500,
          }}
        >
          Guided Route
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 16,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <h3
        style={{
          fontFamily: "var(--font-dm-serif), Georgia, serif",
          fontSize: 15,
          color: "var(--foreground)",
          marginBottom: 4,
        }}
      >
        {route.name}
      </h3>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, marginTop: 4 }}>
        {route.stops.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === stopIndex ? 18 : 7,
              height: 7,
              borderRadius: 99,
              background: i === stopIndex ? "#8b6d6d" : i < stopIndex ? "#c4a090" : "var(--border)",
              transition: "all 0.25s",
            }}
          />
        ))}
      </div>

      {/* Stop label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {territory && (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: territory.color,
              opacity: 0.8,
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            fontSize: 13.5,
            fontFamily: "var(--font-dm-serif), Georgia, serif",
            color: "var(--foreground)",
            fontWeight: 500,
          }}
        >
          Stop {stopIndex + 1} of {route.stops.length}:{" "}
          {territory?.name ?? stop.focus_id}
        </span>
      </div>

      <p
        style={{
          fontSize: 12.5,
          color: "var(--text-secondary)",
          lineHeight: 1.65,
          fontFamily: "var(--font-inter), system-ui",
          marginBottom: 16,
        }}
      >
        {stop.narrative}
      </p>

      {stopSources.length > 0 && (
        <>
          <SectionLabel>At this stop</SectionLabel>
          {stopSources.map((item) => (
            <SourceCard
              key={item.id}
              item={item}
              onClick={() => onSourceClick(item)}
            />
          ))}
        </>
      )}

      {/* Navigation */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 20,
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <button
          onClick={onPrev}
          disabled={isFirst}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            cursor: isFirst ? "not-allowed" : "pointer",
            fontSize: 12,
            color: isFirst ? "var(--border)" : "var(--text-secondary)",
            fontFamily: "var(--font-inter), system-ui",
            transition: "all 0.12s",
          }}
        >
          ← Previous
        </button>
        <button
          onClick={isLast ? onClose : onNext}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #8b6d6d",
            background: isLast ? "#8b6d6d" : "#f9f1f1",
            cursor: "pointer",
            fontSize: 12,
            color: isLast ? "#fff" : "#8b6d6d",
            fontFamily: "var(--font-inter), system-ui",
            fontWeight: 500,
            transition: "all 0.12s",
          }}
        >
          {isLast ? "Finish" : "Next →"}
        </button>
      </div>
    </div>
  );
}

// ─── Main panel component ─────────────────────────────────────────────────────

export default function AtlasPanel({
  variant,
  onClose,
  onTerritoryClick,
  onNeighborhoodClick,
  onSourceClick,
  onRouteStepNext,
  onRouteStepPrev,
  onStartRoute,
  allItems,
  compareMode,
  onCompareModeChange,
}: Props) {
  if (!variant) return null;

  const panelContent = () => {
    switch (variant.type) {
      case "welcome":
        return (
          <WelcomePanel
            onStartRoute={onStartRoute}
            onTerritoryClick={onTerritoryClick}
          />
        );
      case "territory":
        return (
          <TerritoryPanel
            territory={variant.territory}
            allItems={allItems}
            onNeighborhoodClick={onNeighborhoodClick}
            onSourceClick={onSourceClick}
            onClose={onClose}
          />
        );
      case "neighborhood":
        return (
          <NeighborhoodPanel
            neighborhood={variant.neighborhood}
            allItems={allItems}
            onSourceClick={onSourceClick}
            onTerritoryClick={onTerritoryClick}
            onNeighborhoodClick={onNeighborhoodClick}
            onClose={onClose}
          />
        );
      case "source":
        return (
          <SourcePanel
            item={variant.item}
            onClose={onClose}
            onTerritoryClick={onTerritoryClick}
            onNeighborhoodClick={onNeighborhoodClick}
          />
        );
      case "route":
        return (
          <RoutePanel
            route={variant.route}
            stopIndex={variant.stopIndex}
            allItems={allItems}
            onNext={onRouteStepNext}
            onPrev={onRouteStepPrev}
            onSourceClick={onSourceClick}
            onClose={onClose}
          />
        );
    }
  };

  const isWelcome = variant.type === "welcome";

  return (
    <aside
      style={{
        width: 340,
        flexShrink: 0,
        borderLeft: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Compare mode toggle (top of panel, only in non-welcome states) */}
      {!isWelcome && (
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            padding: "8px 16px",
            display: "flex",
            gap: 4,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              fontFamily: "var(--font-inter), system-ui",
              marginRight: 6,
            }}
          >
            Show
          </span>
          {(["both", "research", "industry"] as CompareMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onCompareModeChange(mode)}
              style={{
                padding: "3px 9px",
                borderRadius: 99,
                border: "1px solid",
                borderColor:
                  compareMode === mode ? "var(--foreground)" : "var(--border)",
                background:
                  compareMode === mode
                    ? "var(--foreground)"
                    : "transparent",
                color:
                  compareMode === mode
                    ? "var(--surface)"
                    : "var(--text-secondary)",
                fontSize: 9.5,
                cursor: "pointer",
                fontFamily: "var(--font-inter), system-ui",
                letterSpacing: "0.06em",
                transition: "all 0.12s",
                textTransform: "capitalize",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={
              variant.type === "route"
                ? `route-${variant.stopIndex}`
                : variant.type === "territory"
                ? `territory-${variant.territory.id}`
                : variant.type === "neighborhood"
                ? `neighborhood-${variant.neighborhood.id}`
                : variant.type === "source"
                ? `source-${variant.item.id}`
                : "welcome"
            }
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
          >
            {panelContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}
