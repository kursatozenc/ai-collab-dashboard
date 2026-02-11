import { DesignLever, DesignTheme } from "../types";

/**
 * Hand-curated mapping of the 48 design-annotated items into ~18 themes
 * grouped under 6 design lever categories.
 *
 * Each theme bundles 2-4 related papers/resources around a shared design concern.
 * The sampleQuestion is the most evocative design question from the group.
 */

export const DESIGN_THEMES: DesignTheme[] = [
  // ─── Interface ───────────────────────────────────────────────────────
  {
    id: "trust-calibration",
    label: "Trust Calibration",
    leverCategory: "interface",
    description: "Designing transparency mechanisms that help teams calibrate trust appropriately",
    itemIds: [
      "trust-digital-teams",
      "impacts-trust-model",
      "ai-explaining",
    ],
    sampleQuestion:
      "How might we design transparency mechanisms that help teams calibrate trust appropriately rather than defaulting to over- or under-trust?",
  },
  {
    id: "communication-design",
    label: "Communication Design",
    leverCategory: "interface",
    description: "Structuring how AI and humans exchange information and adapt to urgency",
    itemIds: [
      "structuring-ai-comm",
      "investigating-comm",
      "collective-attention",
    ],
    sampleQuestion:
      "What communication cadence and format should your AI teammate use to keep the team informed without creating noise?",
  },
  {
    id: "social-emotional-ai",
    label: "Social & Emotional AI",
    leverCategory: "interface",
    description: "Whether AI should express emotions and how to frame its social presence",
    itemIds: [
      "pursuit-happiness",
      "purposeful-presentation",
      "ideal-human",
    ],
    sampleQuestion:
      "Should your AI teammate express emotions, and how do you prevent emotional displays from feeling manipulative?",
  },
  {
    id: "ai-behavioral-patterns",
    label: "AI Behavioral Patterns",
    leverCategory: "interface",
    description: "Designing interaction guidelines and behavioral norms for AI teammates",
    itemIds: [
      "amershi-guidelines",
      "improving-collab",
      "how-make-agents",
    ],
    sampleQuestion:
      "Which AI behavioral patterns most improve collaboration in your specific work context?",
  },
  {
    id: "shared-understanding",
    label: "Shared Understanding",
    leverCategory: "interface",
    description: "Building mutual mental models between human and AI team members",
    itemIds: [
      "mutual-tom",
      "shared-mental-models",
      "leveraging-team-cognition",
    ],
    sampleQuestion:
      "How well does your AI understand what you know and don't know, and how well do you understand what your AI can and can't do?",
  },

  // ─── Workflow ────────────────────────────────────────────────────────
  {
    id: "task-delegation",
    label: "Task Delegation",
    leverCategory: "workflow",
    description: "How to divide tasks between humans and AI based on complexity and context",
    itemIds: [
      "survey-hat-lpm",
      "hat-empirical",
      "genai-task-performance",
    ],
    sampleQuestion:
      "How should task division patterns change now that LLMs can handle increasingly complex knowledge work?",
  },
  {
    id: "co-creative-workflows",
    label: "Co-Creative Workflows",
    leverCategory: "workflow",
    description: "Designing iterative collaboration cycles between human ideation and AI elaboration",
    itemIds: [
      "human-ai-cocreation",
      "human-ai-cocreativity",
      "collective-intelligence",
    ],
    sampleQuestion:
      "What does a truly co-creative workflow between humans and AI look like, beyond just 'human prompts, AI generates'?",
  },
  {
    id: "team-effectiveness",
    label: "Team Effectiveness",
    leverCategory: "workflow",
    description: "Organizational support structures and conditions for effective human-AI teaming",
    itemIds: [
      "team-challenges-ai",
      "antecedents-hat",
      "state-ai-work-anthropic",
    ],
    sampleQuestion:
      "Which organizational support structures are prerequisites for effective human-AI teaming?",
  },
  {
    id: "human-in-the-loop",
    label: "Human-in-the-Loop",
    leverCategory: "workflow",
    description: "Where to place the human oversight boundary and how to manage AI autonomy",
    itemIds: [
      "human-loop-orgs",
      "algorithmic-management",
    ],
    sampleQuestion:
      "Where should the human-in-the-loop boundary sit in your organization's AI deployment, and who decides when to move it?",
  },

  // ─── Role ────────────────────────────────────────────────────────────
  {
    id: "tool-vs-teammate",
    label: "Tool vs. Teammate",
    leverCategory: "role",
    description: "Where AI sits on the spectrum from passive tool to active team member",
    itemIds: [
      "tools-to-teammates",
      "beyond-tool-teammate",
      "defining-hat",
    ],
    sampleQuestion:
      "Where on the tool-to-teammate spectrum should AI sit in your organization, and what changes as you move along that spectrum?",
  },
  {
    id: "team-composition",
    label: "Team Composition",
    leverCategory: "role",
    description: "How adding AI changes optimal team size, structure, and role distribution",
    itemIds: [
      "who-what-teammate",
      "superteams",
      "genai-colleague",
    ],
    sampleQuestion:
      "How does adding an AI agent change the optimal size and composition of your team?",
  },
  {
    id: "identity-meaning",
    label: "Identity & Meaning",
    leverCategory: "role",
    description: "What makes work meaningful when AI can perform tasks that once defined professional identity",
    itemIds: [
      "soul-of-work",
      "when-should-i-lead",
      "synthetic-authority",
    ],
    sampleQuestion:
      "What makes work meaningful when AI can do many of the tasks that once defined your professional identity?",
  },

  // ─── Ritual ──────────────────────────────────────────────────────────
  {
    id: "onboarding-rituals",
    label: "Onboarding Rituals",
    leverCategory: "ritual",
    description: "How to introduce and integrate an AI teammate into an established team",
    itemIds: [
      "trust-ai-team-member",
      "hello-mate",
      "when-ai-joins",
    ],
    sampleQuestion:
      "How should onboarding rituals differ when a new AI teammate joins versus a new human teammate?",
  },
  {
    id: "trust-repair",
    label: "Trust Repair",
    leverCategory: "ritual",
    description: "Rituals and practices for rebuilding trust after AI errors or failures",
    itemIds: [
      "shaping-trust",
      "ai-culture",
    ],
    sampleQuestion:
      "What rituals could help teams repair trust after an AI teammate makes a significant error?",
  },
  {
    id: "training-upskilling",
    label: "Training & Upskilling",
    leverCategory: "ritual",
    description: "Building human skills and shared norms for effective human-AI collaboration",
    itemIds: [
      "we-train-ai",
      "skills-humans-need",
      "politeness-llms",
    ],
    sampleQuestion:
      "What does a training program for human-AI teaming look like, and who designs the curriculum?",
  },

  // ─── Governance ──────────────────────────────────────────────────────
  {
    id: "accountability-harm",
    label: "Accountability & Harm",
    leverCategory: "governance",
    description: "Establishing responsibility chains when AI teammates cause harm or make errors",
    itemIds: [
      "ethics-hat",
      "towards-ethical-ai",
      "hcai-hat",
    ],
    sampleQuestion:
      "Who is accountable when an AI teammate's action causes harm, and how do you establish that chain of responsibility?",
  },
  {
    id: "power-fairness",
    label: "Power & Fairness",
    leverCategory: "governance",
    description: "How AI redistributes power in organizations and ensuring equitable outcomes",
    itemIds: [
      "synthetic-authority",
      "when-should-i-lead",
    ],
    sampleQuestion:
      "How does AI redistribute power in your organization, and who gains or loses authority?",
  },

  // ─── Capability Boundary ─────────────────────────────────────────────
  {
    id: "teaming-vs-interaction",
    label: "Teaming vs. Interaction",
    leverCategory: "capability_boundary",
    description: "What distinguishes true human-AI teaming from basic AI interaction",
    itemIds: [
      "requirements-ai-teammates",
      "focus-modality-design",
    ],
    sampleQuestion:
      "Which capability requirements should be non-negotiable before deploying an AI teammate in your context?",
  },
];

/** Lever display metadata */
export const LEVER_META: Record<
  DesignLever,
  { label: string; color: string; colorLight: string }
> = {
  interface: { label: "Interface", color: "#0d9488", colorLight: "#ccfbf1" },
  workflow: { label: "Workflow", color: "#2563eb", colorLight: "#dbeafe" },
  role: { label: "Role", color: "#8b5cf6", colorLight: "#ede9fe" },
  ritual: { label: "Ritual", color: "#f59e0b", colorLight: "#fef3c7" },
  governance: { label: "Governance", color: "#ef4444", colorLight: "#fee2e2" },
  capability_boundary: { label: "Boundary", color: "#06b6d4", colorLight: "#cffafe" },
};

/** Get all unique item IDs across all themes */
export function getAnnotatedItemIds(): Set<string> {
  const ids = new Set<string>();
  for (const theme of DESIGN_THEMES) {
    for (const id of theme.itemIds) {
      ids.add(id);
    }
  }
  return ids;
}
