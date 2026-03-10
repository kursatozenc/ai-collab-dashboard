// ─── Legacy types (kept for data compatibility) ──────────────────────────────

export type DesignLever =
  | "workflow"
  | "role"
  | "ritual"
  | "capability_boundary"
  | "interface"
  | "governance";

export type DesignerIntent =
  | "team_structure"
  | "workflow_redesign"
  | "role_definition"
  | "ritual_design"
  | "tooling_selection"
  | "governance_policy"
  | "learning_upskilling";

export interface FieldGuide {
  landmarkName: string;
  fieldNote: string;
  ritualRecipe: string;
  figmaSnippet: string;
}

export interface RadarItem {
  id: string;
  title: string;
  authors: string;
  year: number;
  url: string;
  citation?: string;
  summary: string;
  cluster: string;
  source: "research" | "industry";
  designLevers: DesignLever[];
  designerIntents: DesignerIntent[];
  designQuestion: string;
  tags: string[];
  embedding: [number, number];
  fieldGuide?: FieldGuide;
}

export interface Cluster {
  id: string;
  label: string;
  topTerms?: string[];
  sampleDesignQuestions?: string[];
  designFocus?: string;
}

export interface RadarLink {
  source: string;
  target: string;
}

export interface DesignTheme {
  id: string;
  label: string;
  leverCategory: DesignLever;
  description: string;
  itemIds: string[];
  sampleQuestion: string;
}

// ─── Atlas types ──────────────────────────────────────────────────────────────

/** The 4 nested layers of human-AI collaboration (vertical scaffold) */
export type AtlasLayer = "task" | "workflow" | "team" | "organization";

/** Primary atlas application state */
export type AtlasState =
  | "entry"
  | "atlas"
  | "territory"
  | "neighborhood"
  | "source"
  | "route";

/** Compare mode filter */
export type CompareMode = "both" | "research" | "industry";

/** A major stable territory on the atlas map */
export interface Territory {
  id: string;
  name: string;
  /** One-sentence thesis about this territory */
  thesis: string;
  /** Why this territory matters for designers */
  why_it_matters: string;
  /** Concrete design implications */
  design_implications: string[];
  /** Adjacent territory IDs */
  adjacency: string[];
  /** Optional evocative landmark name within this territory */
  landmark_name?: string;
  /** Muted fill color for the territory region */
  color: string;
  /** Stroke/border color */
  strokeColor: string;
  /** SVG path for the territory shape */
  svgPath: string;
  /** Approximate center point for zoom targeting */
  center: { x: number; y: number };
  /** Label anchor position (may differ from center) */
  labelPos: { x: number; y: number };
  /** Key tensions in this territory */
  key_tensions: string[];
}

/** An emergent theme cluster within (or across) territories */
export interface Neighborhood {
  id: string;
  name: string;
  /** Short thesis for this cluster */
  thesis: string;
  why_it_matters: string;
  key_tensions: string[];
  /** Actionable design moves */
  design_moves: string[];
  /** IDs of representative sources */
  representative_source_ids: string[];
  /** IDs of territories this neighborhood belongs to (can span multiple) */
  territory_ids: string[];
  /** Related neighborhood IDs */
  related_neighborhood_ids: string[];
  /** SVG label position */
  labelPos: { x: number; y: number };
  /** Relative prominence 0–1 (influences label size) */
  prominence: number;
}

/** A single stop in a guided route */
export interface RouteStop {
  id: string;
  /** Territory or neighborhood to focus */
  focus_id: string;
  focus_type: "territory" | "neighborhood";
  /** Panel narrative for this stop */
  narrative: string;
  /** Source IDs to highlight at this stop */
  source_ids: string[];
}

/** A curated guided route through the atlas */
export interface Route {
  id: string;
  name: string;
  description: string;
  stops: RouteStop[];
}

/** Maps a source item to its atlas placement */
export interface SourceAssignment {
  item_id: string;
  primary_territory: string;
  secondary_territory?: string;
  neighborhood_ids: string[];
  /** Primary collaboration layer this item speaks to */
  primary_layer: AtlasLayer;
}
