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
}

export interface Cluster {
  id: string;
  label: string;
  /** Top TF-IDF terms explaining why this cluster groups these items */
  topTerms?: string[];
  /** Up to 2 sample design questions from items in this cluster */
  sampleDesignQuestions?: string[];
  /** Most common design lever in this cluster (if any) */
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
