import { Territory, Neighborhood, Route, SourceAssignment } from "../types";

// ─── SVG canvas: 900 × 680 ────────────────────────────────────────────────────
// Spatial logic:
//   south = Task, mid-south = Workflow, mid-north = Team, north = Org/Culture
//   west = situated interaction/design, east = formal structure/oversight

export const TERRITORIES: Territory[] = [
  {
    id: "interactions-modality",
    name: "Interactions + Modality",
    thesis:
      "How humans and AI communicate — the channel, cadence, tone, and shared vocabulary of collaboration.",
    why_it_matters:
      "Most collaboration fails not because the AI is wrong but because the interaction is misdesigned. This territory covers the surface layer where intent becomes exchange.",
    design_implications: [
      "Design for calibrated transparency, not maximum transparency",
      "Make AI behavioral norms explicit and adjustable by teams",
      "Create communication rituals that prevent over-reliance",
      "Build shared vocabulary between human and AI teammates",
    ],
    key_tensions: [
      "Expressiveness vs. manipulation (emotional AI)",
      "Transparency vs. cognitive overload",
      "Adaptive behavior vs. predictability",
    ],
    adjacency: ["workflow", "roles-boundaries", "trust-accountability"],
    landmark_name: "The Signal Exchange",
    color: "#7a9e7e",
    strokeColor: "#5a7a5e",
    svgPath:
      "M 55 350 C 90 315 175 308 262 348 C 328 378 318 455 300 520 C 282 582 215 622 138 614 C 62 606 24 555 22 486 C 20 420 28 375 55 350 Z",
    center: { x: 175, y: 483 },
    labelPos: { x: 150, y: 450 },
  },
  {
    id: "workflow",
    name: "Workflow",
    thesis:
      "How work is structured, divided, and sequenced when AI is part of the production process.",
    why_it_matters:
      "Adding AI doesn't just speed up tasks — it changes the shape of work itself. This territory examines how delegation, sequencing, and oversight shift in human-AI workflows.",
    design_implications: [
      "Design explicit handoff moments between human and AI agency",
      "Make AI contributions legible within the overall workflow",
      "Preserve human judgment at complexity thresholds",
      "Build feedback loops that let teams learn from AI outputs",
    ],
    key_tensions: [
      "Efficiency vs. human skill development",
      "Automation vs. oversight burden",
      "Structured delegation vs. emergent collaboration",
    ],
    adjacency: [
      "interactions-modality",
      "roles-boundaries",
      "trust-accountability",
      "governance",
    ],
    landmark_name: "The Delegation Basin",
    color: "#b8956a",
    strokeColor: "#8a6e48",
    svgPath:
      "M 198 428 C 240 392 332 376 440 384 C 532 390 588 436 585 508 C 581 582 510 645 388 648 C 268 650 186 598 174 534 C 164 474 168 452 198 428 Z",
    center: { x: 390, y: 520 },
    labelPos: { x: 380, y: 490 },
  },
  {
    id: "roles-boundaries",
    name: "Roles + Boundaries",
    thesis:
      "Where AI sits on the spectrum from tool to teammate — and what that means for authority, identity, and team structure.",
    why_it_matters:
      "Role clarity is the hidden prerequisite of effective teaming. As AI capabilities expand, the question of who does what — and who is responsible — becomes both more urgent and more unstable.",
    design_implications: [
      "Make the tool-vs-teammate positioning an explicit design decision",
      "Design for role renegotiation as AI capabilities evolve",
      "Protect the work that gives people meaning and identity",
      "Define responsibility chains before something goes wrong",
    ],
    key_tensions: [
      "Flexibility vs. clarity in role definition",
      "AI as collaborator vs. AI as threat to professional identity",
      "Optimal team size vs. human need for contribution",
    ],
    adjacency: [
      "workflow",
      "interactions-modality",
      "trust-accountability",
      "governance",
      "rituals-norms",
    ],
    landmark_name: "The Boundary Cairn",
    color: "#6d8fad",
    strokeColor: "#4d6f8d",
    svgPath:
      "M 262 198 C 306 162 386 148 468 166 C 542 182 580 238 576 316 C 572 392 526 448 448 458 C 372 468 292 440 252 388 C 214 338 212 278 230 250 C 242 228 254 210 262 198 Z",
    center: { x: 418, y: 312 },
    labelPos: { x: 390, y: 280 },
  },
  {
    id: "governance",
    name: "Governance",
    thesis:
      "How organizations create accountability, manage risk, and set the rules of AI participation.",
    why_it_matters:
      "Without governance, AI integration defaults to whoever has the most leverage. This territory examines how policy, oversight, and power are structured around AI in organizations.",
    design_implications: [
      "Design accountability chains before deployment, not after incidents",
      "Create visible audit trails for AI decisions in high-stakes workflows",
      "Involve affected workers in governance design, not just leadership",
      "Build governance that can adapt as AI capabilities change",
    ],
    key_tensions: [
      "Speed of deployment vs. depth of governance",
      "Centralized control vs. local autonomy",
      "Accountability vs. innovation chilling effect",
    ],
    adjacency: ["trust-accountability", "roles-boundaries", "workflow"],
    landmark_name: "The Charter Hall",
    color: "#8b6d6d",
    strokeColor: "#6b4d4d",
    svgPath:
      "M 578 58 C 618 28 700 18 782 34 C 852 48 892 95 888 172 C 884 246 836 286 754 292 C 672 298 610 258 586 196 C 564 138 562 82 578 58 Z",
    center: { x: 735, y: 163 },
    labelPos: { x: 720, y: 135 },
  },
  {
    id: "trust-accountability",
    name: "Trust + Accountability",
    thesis:
      "A cross-cutting ridge — trust is not one territory but a condition that runs through all of them.",
    why_it_matters:
      "Trust is the infrastructure of human-AI collaboration. It cannot be designed in isolation; it must be calibrated at every layer — in the interaction, the workflow, the role, and the governance structure.",
    design_implications: [
      "Design trust as calibration, not as binary on/off",
      "Make AI errors legible and recoverable — not hidden",
      "Build trust repair rituals for after failures",
      "Distinguish swift trust (initial) from earned trust (sustained)",
    ],
    key_tensions: [
      "Over-trust (automation bias) vs. under-trust (distrust)",
      "Transparency vs. complexity of AI decision-making",
      "Team trust vs. individual accountability",
    ],
    adjacency: [
      "interactions-modality",
      "workflow",
      "roles-boundaries",
      "governance",
      "rituals-norms",
    ],
    landmark_name: "The Accountability Ridge",
    color: "#9e8a5c",
    strokeColor: "#7e6a3c",
    // Elongated diagonal belt — cross-cutting from upper-center-east to lower-center-east
    svgPath:
      "M 528 152 C 562 122 634 120 692 152 C 748 182 778 252 778 342 C 778 432 748 510 698 548 C 650 584 592 580 550 550 C 508 520 484 472 478 412 C 472 346 472 272 492 222 C 504 190 520 168 528 152 Z",
    center: { x: 630, y: 355 },
    labelPos: { x: 650, y: 310 },
  },
  {
    id: "rituals-norms",
    name: "Rituals + Norms",
    thesis:
      "The social practices and unwritten rules that make AI collaboration sustainable over time.",
    why_it_matters:
      "Tools get deployed; cultures emerge. This territory examines what teams actually do — the meetings, habits, check-ins, and shared expectations that determine whether AI integration takes root or withers.",
    design_implications: [
      "Design onboarding rituals that are different for AI vs. human teammates",
      "Create explicit norms around when to override AI recommendations",
      "Build team practices for surfacing and resolving AI-related conflicts",
      "Invest in upskilling that builds human judgment alongside AI capability",
    ],
    key_tensions: [
      "Organic vs. designed culture change",
      "Standardization vs. team autonomy in norms",
      "Speed of adoption vs. depth of internalization",
    ],
    adjacency: ["roles-boundaries", "trust-accountability", "governance"],
    landmark_name: "The Common Ground",
    color: "#8e7ea8",
    strokeColor: "#6e5e88",
    svgPath:
      "M 52 88 C 90 48 172 36 258 52 C 334 66 372 118 358 192 C 344 262 288 300 198 304 C 110 308 48 264 34 196 C 22 136 28 110 52 88 Z",
    center: { x: 202, y: 176 },
    labelPos: { x: 180, y: 148 },
  },
];

// ─── Neighborhoods ────────────────────────────────────────────────────────────

export const NEIGHBORHOODS: Neighborhood[] = [
  // ── Interactions + Modality ──────────────────────────────────────────────
  {
    id: "trust-calibration",
    name: "Trust Calibration",
    thesis:
      "Designing transparency mechanisms that help teams find the right level of trust — neither blind nor dismissive.",
    why_it_matters:
      "Miscalibrated trust is the root cause of most AI collaboration failures, whether through over-reliance or needless rejection.",
    key_tensions: ["Transparency vs. overload", "Legibility vs. complexity"],
    design_moves: [
      "Design confidence indicators that are contextual, not numerical",
      "Create audit moments that interrupt automation bias",
      "Show AI reasoning at decision points, not everywhere",
    ],
    representative_source_ids: [
      "trust-digital-teams",
      "impacts-trust-model",
      "ai-explaining",
    ],
    territory_ids: ["interactions-modality", "trust-accountability"],
    related_neighborhood_ids: ["shared-understanding", "trust-dynamics"],
    labelPos: { x: 118, y: 410 },
    prominence: 0.9,
  },
  {
    id: "communication-design",
    name: "Communication Design",
    thesis:
      "Structuring how AI and humans exchange information — the right signal at the right moment.",
    why_it_matters:
      "AI communication that is too frequent creates noise; too sparse creates blindspots. Cadence and format are design decisions.",
    key_tensions: ["Proactive vs. on-demand communication", "Signal vs. noise"],
    design_moves: [
      "Design communication cadence as a team-level norm, not a default",
      "Create urgency tiers for different types of AI output",
      "Build shared formatting conventions across human-AI workflows",
    ],
    representative_source_ids: [
      "structuring-ai-comm",
      "investigating-comm",
      "collective-attention",
    ],
    territory_ids: ["interactions-modality"],
    related_neighborhood_ids: ["shared-understanding", "ai-behavioral-patterns"],
    labelPos: { x: 210, y: 460 },
    prominence: 0.75,
  },
  {
    id: "social-emotional-ai",
    name: "Social + Emotional AI",
    thesis:
      "Whether and how AI should express social or emotional signals — and the risks of getting it wrong.",
    why_it_matters:
      "Emotional expression from AI creates parasocial effects that teams rarely anticipate. Designing this intentionally is an ethical imperative.",
    key_tensions: [
      "Expressiveness vs. manipulation",
      "Warmth vs. anthropomorphism",
    ],
    design_moves: [
      "Make AI social presence a deliberate framing choice, not a default",
      "Design social signals that support the work without simulating friendship",
      "Test emotional AI designs for manipulation risk, not just user preference",
    ],
    representative_source_ids: [
      "pursuit-happiness",
      "purposeful-presentation",
      "ideal-human",
    ],
    territory_ids: ["interactions-modality"],
    related_neighborhood_ids: ["ai-behavioral-patterns", "trust-calibration"],
    labelPos: { x: 145, y: 540 },
    prominence: 0.65,
  },
  {
    id: "ai-behavioral-patterns",
    name: "AI Behavioral Patterns",
    thesis:
      "The norms and guidelines that govern how AI behaves in collaborative contexts.",
    why_it_matters:
      "Behavioral unpredictability erodes trust faster than errors. Teams need AI that behaves consistently within understood boundaries.",
    key_tensions: [
      "Consistency vs. contextual adaptation",
      "Rule-based behavior vs. emergent judgment",
    ],
    design_moves: [
      "Document and share AI behavioral norms across the team",
      "Design explicit overrides for AI defaults",
      "Create behavioral contracts for high-stakes AI roles",
    ],
    representative_source_ids: [
      "amershi-guidelines",
      "improving-collab",
      "how-make-agents",
    ],
    territory_ids: ["interactions-modality"],
    related_neighborhood_ids: ["communication-design", "shared-understanding"],
    labelPos: { x: 248, y: 508 },
    prominence: 0.7,
  },
  {
    id: "shared-understanding",
    name: "Shared Understanding",
    thesis:
      "Building mutual mental models — what the human knows about the AI, and what the AI represents about the human.",
    why_it_matters:
      "Without shared mental models, coordination breaks down silently. Both sides need an accurate model of the other's capabilities and limits.",
    key_tensions: [
      "Model accuracy vs. cognitive load of maintaining it",
      "Individual understanding vs. team-level shared model",
    ],
    design_moves: [
      "Surface AI capability and limitation models in the workspace",
      "Design explicit calibration activities for new AI teammates",
      "Create shared artifacts that encode team-AI mental models",
    ],
    representative_source_ids: [
      "mutual-tom",
      "shared-mental-models",
      "leveraging-team-cognition",
    ],
    territory_ids: ["interactions-modality", "workflow"],
    related_neighborhood_ids: ["trust-calibration", "communication-design"],
    labelPos: { x: 185, y: 572 },
    prominence: 0.7,
  },

  // ── Workflow ─────────────────────────────────────────────────────────────
  {
    id: "task-delegation",
    name: "Task Delegation",
    thesis:
      "How to divide and sequence tasks between humans and AI based on complexity, stakes, and context.",
    why_it_matters:
      "Delegation is not just efficiency — it shapes what humans learn and what they forget. Bad delegation patterns erode human judgment over time.",
    key_tensions: [
      "Optimal performance now vs. human skill development",
      "Task fit vs. team capability building",
    ],
    design_moves: [
      "Map task complexity against AI capability — don't default to full delegation",
      "Design rotation policies that preserve human judgment in key tasks",
      "Create delegation audit points for high-stakes workflows",
    ],
    representative_source_ids: [
      "survey-hat-lpm",
      "hat-empirical",
      "genai-task-performance",
    ],
    territory_ids: ["workflow"],
    related_neighborhood_ids: [
      "human-in-the-loop",
      "co-creative-workflows",
    ],
    labelPos: { x: 278, y: 468 },
    prominence: 0.85,
  },
  {
    id: "co-creative-workflows",
    name: "Co-Creative Workflows",
    thesis:
      "Designing the iterative cycle between human ideation and AI elaboration.",
    why_it_matters:
      "Co-creation is not prompt-and-generate. It requires designed turn-taking, revision norms, and ways to prevent AI from flattening human creativity.",
    key_tensions: [
      "Human creative control vs. AI generative momentum",
      "Speed vs. originality",
    ],
    design_moves: [
      "Design explicit diverge-converge phases in co-creative workflows",
      "Build checkpoints that require human judgment before AI elaboration",
      "Create provenance markers to track which ideas originated with AI",
    ],
    representative_source_ids: [
      "human-ai-cocreation",
      "human-ai-cocreativity",
      "collective-intelligence",
    ],
    territory_ids: ["workflow"],
    related_neighborhood_ids: ["task-delegation", "team-effectiveness"],
    labelPos: { x: 420, y: 452 },
    prominence: 0.8,
  },
  {
    id: "human-in-the-loop",
    name: "Human-in-the-Loop",
    thesis:
      "Where and how to position human oversight in automated AI workflows.",
    why_it_matters:
      "The human-in-the-loop boundary is often set by default, not design. Moving it requires understanding what is lost when it shifts.",
    key_tensions: [
      "Oversight thoroughness vs. efficiency gains",
      "Who decides where the boundary sits",
    ],
    design_moves: [
      "Make the oversight boundary an explicit design decision with stakeholders",
      "Design escalation paths that are easy for AI to trigger",
      "Build observability for AI decisions before removing human checkpoints",
    ],
    representative_source_ids: ["human-loop-orgs", "algorithmic-management"],
    territory_ids: ["workflow", "governance"],
    related_neighborhood_ids: ["task-delegation", "accountability-harm"],
    labelPos: { x: 494, y: 502 },
    prominence: 0.8,
  },
  {
    id: "team-effectiveness",
    name: "Team Effectiveness",
    thesis:
      "Organizational conditions and support structures that enable effective human-AI teaming.",
    why_it_matters:
      "Teams that work well with AI are not just technically capable — they have specific social structures that support coordination, disagreement, and adaptation.",
    key_tensions: [
      "Team autonomy vs. standardized AI practices",
      "Individual effectiveness vs. collective learning",
    ],
    design_moves: [
      "Map prerequisite conditions before deploying AI into team workflows",
      "Design onboarding that addresses the whole team, not just the user",
      "Create explicit team practices for managing AI disagreements",
    ],
    representative_source_ids: [
      "team-challenges-ai",
      "antecedents-hat",
      "state-ai-work-anthropic",
    ],
    territory_ids: ["workflow", "roles-boundaries"],
    related_neighborhood_ids: [
      "co-creative-workflows",
      "onboarding-rituals",
    ],
    labelPos: { x: 360, y: 574 },
    prominence: 0.75,
  },

  // ── Roles + Boundaries ───────────────────────────────────────────────────
  {
    id: "tool-vs-teammate",
    name: "Tool vs. Teammate",
    thesis:
      "The fundamental framing decision: where does AI sit on the spectrum from passive instrument to active team member?",
    why_it_matters:
      "This framing determines everything downstream: expectations, accountability, design conventions, and team dynamics. Most organizations choose this implicitly.",
    key_tensions: [
      "Teammate framing vs. accountability dilution",
      "Tool framing vs. underestimating AI capability",
    ],
    design_moves: [
      "Make the framing explicit — document it, discuss it, revisit it",
      "Distinguish framing from capability (AI can be powerful and still a tool)",
      "Design different interaction patterns for different positions on this spectrum",
    ],
    representative_source_ids: [
      "tools-to-teammates",
      "beyond-tool-teammate",
      "defining-hat",
    ],
    territory_ids: ["roles-boundaries"],
    related_neighborhood_ids: ["team-composition", "teaming-vs-interaction"],
    labelPos: { x: 308, y: 238 },
    prominence: 0.9,
  },
  {
    id: "team-composition",
    name: "Team Composition",
    thesis:
      "How AI membership changes the optimal size, structure, and role distribution of a team.",
    why_it_matters:
      "AI teammates change the math. Teams structured for human-only work may be over-resourced in some roles and under-resourced in others once AI joins.",
    key_tensions: [
      "Optimal AI-assisted output vs. human team cohesion",
      "Role specialization vs. shared ownership",
    ],
    design_moves: [
      "Audit roles for AI-compatibility vs. human-necessity",
      "Design team onboarding that explicitly addresses the AI member",
      "Revisit team size and role distribution after AI integration",
    ],
    representative_source_ids: [
      "who-what-teammate",
      "superteams",
      "genai-colleague",
    ],
    territory_ids: ["roles-boundaries"],
    related_neighborhood_ids: ["tool-vs-teammate", "team-effectiveness"],
    labelPos: { x: 474, y: 228 },
    prominence: 0.8,
  },
  {
    id: "identity-meaning",
    name: "Identity + Meaning",
    thesis:
      "What makes work meaningful when AI can perform tasks that once defined professional identity.",
    why_it_matters:
      "This is the existential layer of human-AI collaboration. Ignoring it produces resentment, disengagement, and resistance that no UX improvement can fix.",
    key_tensions: [
      "Efficiency gains vs. meaning erosion",
      "Individual agency vs. team-level optimization",
    ],
    design_moves: [
      "Identify which tasks carry identity before deciding what to delegate",
      "Design AI roles that amplify human contribution, not replace it",
      "Create new sources of professional meaning in AI-augmented work",
    ],
    representative_source_ids: [
      "soul-of-work",
      "when-should-i-lead",
      "synthetic-authority",
    ],
    territory_ids: ["roles-boundaries", "rituals-norms"],
    related_neighborhood_ids: ["tool-vs-teammate", "ai-culture-norms"],
    labelPos: { x: 340, y: 374 },
    prominence: 0.75,
  },
  {
    id: "teaming-vs-interaction",
    name: "Teaming vs. Interaction",
    thesis:
      "What distinguishes true human-AI teaming from basic AI interaction — and why the distinction matters.",
    why_it_matters:
      "Most AI use is interaction, not teaming. The line between them determines what design practices apply and what capabilities are actually required.",
    key_tensions: [
      "Teaming requirements vs. cost of meeting them",
      "Interaction simplicity vs. teaming depth",
    ],
    design_moves: [
      "Define your intended level before starting design",
      "Audit AI capability against teaming requirements before deployment",
      "Design incrementally — interaction first, teaming when warranted",
    ],
    representative_source_ids: [
      "requirements-ai-teammates",
      "focus-modality-design",
    ],
    territory_ids: ["roles-boundaries", "interactions-modality"],
    related_neighborhood_ids: ["tool-vs-teammate", "ai-behavioral-patterns"],
    labelPos: { x: 490, y: 360 },
    prominence: 0.65,
  },

  // ── Governance ────────────────────────────────────────────────────────────
  {
    id: "accountability-harm",
    name: "Accountability + Harm",
    thesis:
      "Who is responsible when AI decisions cause harm, and how that accountability is established.",
    why_it_matters:
      "Accountability gaps are not edge cases — they are the predictable consequence of deploying AI without explicit responsibility chains.",
    key_tensions: [
      "Distributed agency vs. clear accountability",
      "Accountability design vs. innovation chilling",
    ],
    design_moves: [
      "Map responsibility chains for every AI decision type before deployment",
      "Design audit trails that are legible to the people affected",
      "Create clear escalation paths that don't require lawyers to navigate",
    ],
    representative_source_ids: [
      "ethics-hat",
      "towards-ethical-ai",
      "hcai-hat",
    ],
    territory_ids: ["governance", "trust-accountability"],
    related_neighborhood_ids: ["power-fairness", "human-in-the-loop"],
    labelPos: { x: 668, y: 140 },
    prominence: 0.9,
  },
  {
    id: "power-fairness",
    name: "Power + Fairness",
    thesis:
      "How AI redistributes power within organizations — who gains leverage and who loses it.",
    why_it_matters:
      "AI doesn't just change how work is done. It changes who controls work. Fairness in AI deployment requires examining these power shifts explicitly.",
    key_tensions: [
      "Managerial efficiency vs. worker autonomy",
      "Algorithmic fairness vs. contextual equity",
    ],
    design_moves: [
      "Map power implications as part of AI design review",
      "Involve workers in AI role and workflow design — not just managers",
      "Design worker-facing AI interfaces that preserve agency and dignity",
    ],
    representative_source_ids: ["synthetic-authority", "when-should-i-lead"],
    territory_ids: ["governance"],
    related_neighborhood_ids: ["accountability-harm", "identity-meaning"],
    labelPos: { x: 788, y: 185 },
    prominence: 0.75,
  },

  // ── Trust + Accountability ────────────────────────────────────────────────
  {
    id: "trust-dynamics",
    name: "Trust Dynamics",
    thesis:
      "How trust evolves through the lifecycle of human-AI collaboration — from swift trust to earned trust to trust repair.",
    why_it_matters:
      "Trust is not static. Designing for the initial onboarding moment is not enough — teams need practices for all trust phases.",
    key_tensions: [
      "Swift trust enabling collaboration vs. uncritical trust",
      "Trust built on performance vs. trust built on understanding",
    ],
    design_moves: [
      "Design distinct practices for trust initiation, maintenance, and repair",
      "Create visible AI track records that teams can reference",
      "Build failure response protocols before failures happen",
    ],
    representative_source_ids: [
      "trust-digital-teams",
      "shaping-trust",
      "trust-ai-team-member",
    ],
    territory_ids: ["trust-accountability", "rituals-norms"],
    related_neighborhood_ids: [
      "trust-calibration",
      "onboarding-rituals",
      "trust-repair",
    ],
    labelPos: { x: 572, y: 278 },
    prominence: 0.85,
  },
  {
    id: "algorithmic-oversight",
    name: "Algorithmic Oversight",
    thesis:
      "How organizations monitor, audit, and maintain accountability for AI behavior over time.",
    why_it_matters:
      "Oversight that exists only at deployment quickly becomes stale. Ongoing governance requires designed observability and accountability mechanisms.",
    key_tensions: [
      "Oversight depth vs. operational friction",
      "Centralized control vs. local accountability",
    ],
    design_moves: [
      "Design observability as a first-class feature, not an afterthought",
      "Create regular AI performance reviews alongside human performance reviews",
      "Build in sunset clauses for AI deployments in high-stakes contexts",
    ],
    representative_source_ids: [
      "human-loop-orgs",
      "algorithmic-management",
      "hcai-hat",
    ],
    territory_ids: ["trust-accountability", "governance"],
    related_neighborhood_ids: ["accountability-harm", "human-in-the-loop"],
    labelPos: { x: 652, y: 445 },
    prominence: 0.75,
  },

  // ── Rituals + Norms ────────────────────────────────────────────────────────
  {
    id: "onboarding-rituals",
    name: "Onboarding Rituals",
    thesis:
      "How to introduce AI into an established team — and what makes that different from human onboarding.",
    why_it_matters:
      "First impressions of AI teammates shape long-term adoption patterns. Poorly designed onboarding creates either over-trust or under-use.",
    key_tensions: [
      "Structured introduction vs. organic discovery",
      "Individual vs. team-level onboarding",
    ],
    design_moves: [
      "Design a team-level AI kickoff ritual, not just individual training",
      "Create a 'get to know the AI' period before high-stakes use",
      "Build shared norms documentation as an output of onboarding",
    ],
    representative_source_ids: [
      "trust-ai-team-member",
      "hello-mate",
      "when-ai-joins",
    ],
    territory_ids: ["rituals-norms"],
    related_neighborhood_ids: [
      "trust-dynamics",
      "team-effectiveness",
    ],
    labelPos: { x: 158, y: 128 },
    prominence: 0.85,
  },
  {
    id: "trust-repair",
    name: "Trust Repair",
    thesis:
      "Rituals and practices for rebuilding trust after AI errors, failures, or disappointments.",
    why_it_matters:
      "Trust is easier to lose than to build. Organizations need pre-designed repair protocols, not improvised responses to AI failures.",
    key_tensions: [
      "Acknowledging failures vs. undermining confidence",
      "Human-specific repair practices vs. AI-adapted ones",
    ],
    design_moves: [
      "Design explicit post-incident rituals for teams after AI failures",
      "Create AI error communication templates that acknowledge impact",
      "Build confidence-recovery checkpoints into AI workflows after incidents",
    ],
    representative_source_ids: ["shaping-trust", "ai-culture"],
    territory_ids: ["rituals-norms", "trust-accountability"],
    related_neighborhood_ids: ["trust-dynamics", "onboarding-rituals"],
    labelPos: { x: 254, y: 158 },
    prominence: 0.75,
  },
  {
    id: "training-upskilling",
    name: "Training + Upskilling",
    thesis:
      "Building human skills and shared norms for effective human-AI collaboration over time.",
    why_it_matters:
      "AI doesn't automatically make people better. It makes some people better and some worse, depending on how they're trained to work with it.",
    key_tensions: [
      "AI doing vs. human learning",
      "Standardized training vs. team-specific norms",
    ],
    design_moves: [
      "Design training programs that build AI collaboration skills, not just tool skills",
      "Create deliberate skill-building moments where AI is withheld or constrained",
      "Measure team AI literacy as an organizational health metric",
    ],
    representative_source_ids: [
      "we-train-ai",
      "skills-humans-need",
      "politeness-llms",
    ],
    territory_ids: ["rituals-norms"],
    related_neighborhood_ids: ["team-effectiveness", "ai-culture-norms"],
    labelPos: { x: 188, y: 232 },
    prominence: 0.75,
  },
  {
    id: "ai-culture-norms",
    name: "AI Culture + Norms",
    thesis:
      "The informal rules, shared expectations, and cultural patterns that govern AI use in a team.",
    why_it_matters:
      "Culture determines whether formal policies are followed. AI norms that aren't embedded in culture are policies that don't work.",
    key_tensions: [
      "Organic norm emergence vs. managed culture change",
      "Team autonomy vs. organizational consistency",
    ],
    design_moves: [
      "Surface and document informal AI norms explicitly",
      "Design cultural artifacts — rituals, symbols, stories — around AI collaboration",
      "Create regular norm-review rituals, especially after major AI changes",
    ],
    representative_source_ids: ["ai-culture", "state-ai-work-anthropic"],
    territory_ids: ["rituals-norms"],
    related_neighborhood_ids: [
      "training-upskilling",
      "identity-meaning",
    ],
    labelPos: { x: 295, y: 218 },
    prominence: 0.65,
  },
];

// ─── Source Assignments ───────────────────────────────────────────────────────

export const SOURCE_ASSIGNMENTS: SourceAssignment[] = [
  // Trust + Accountability
  {
    item_id: "trust-digital-teams",
    primary_territory: "trust-accountability",
    secondary_territory: "interactions-modality",
    neighborhood_ids: ["trust-dynamics", "trust-calibration"],
    primary_layer: "team",
  },
  {
    item_id: "impacts-trust-model",
    primary_territory: "trust-accountability",
    secondary_territory: "interactions-modality",
    neighborhood_ids: ["trust-calibration"],
    primary_layer: "team",
  },
  {
    item_id: "shaping-trust",
    primary_territory: "trust-accountability",
    secondary_territory: "rituals-norms",
    neighborhood_ids: ["trust-dynamics", "trust-repair"],
    primary_layer: "team",
  },
  {
    item_id: "trust-ai-team-member",
    primary_territory: "trust-accountability",
    secondary_territory: "rituals-norms",
    neighborhood_ids: ["trust-dynamics", "onboarding-rituals"],
    primary_layer: "team",
  },
  // Interactions + Modality
  {
    item_id: "ai-explaining",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["trust-calibration"],
    primary_layer: "task",
  },
  {
    item_id: "structuring-ai-comm",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["communication-design"],
    primary_layer: "task",
  },
  {
    item_id: "investigating-comm",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["communication-design"],
    primary_layer: "task",
  },
  {
    item_id: "collective-attention",
    primary_territory: "interactions-modality",
    secondary_territory: "workflow",
    neighborhood_ids: ["communication-design", "shared-understanding"],
    primary_layer: "workflow",
  },
  {
    item_id: "pursuit-happiness",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["social-emotional-ai"],
    primary_layer: "task",
  },
  {
    item_id: "purposeful-presentation",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["social-emotional-ai"],
    primary_layer: "task",
  },
  {
    item_id: "ideal-human",
    primary_territory: "interactions-modality",
    secondary_territory: "roles-boundaries",
    neighborhood_ids: ["social-emotional-ai", "tool-vs-teammate"],
    primary_layer: "task",
  },
  {
    item_id: "amershi-guidelines",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["ai-behavioral-patterns"],
    primary_layer: "task",
  },
  {
    item_id: "improving-collab",
    primary_territory: "interactions-modality",
    secondary_territory: "workflow",
    neighborhood_ids: ["ai-behavioral-patterns"],
    primary_layer: "workflow",
  },
  {
    item_id: "how-make-agents",
    primary_territory: "interactions-modality",
    secondary_territory: "roles-boundaries",
    neighborhood_ids: ["ai-behavioral-patterns", "teaming-vs-interaction"],
    primary_layer: "task",
  },
  {
    item_id: "mutual-tom",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["shared-understanding"],
    primary_layer: "team",
  },
  {
    item_id: "shared-mental-models",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["shared-understanding"],
    primary_layer: "team",
  },
  {
    item_id: "leveraging-team-cognition",
    primary_territory: "interactions-modality",
    secondary_territory: "workflow",
    neighborhood_ids: ["shared-understanding", "team-effectiveness"],
    primary_layer: "team",
  },
  {
    item_id: "politeness-llms",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["social-emotional-ai", "ai-behavioral-patterns"],
    primary_layer: "task",
  },
  // Workflow
  {
    item_id: "survey-hat-lpm",
    primary_territory: "workflow",
    neighborhood_ids: ["task-delegation"],
    primary_layer: "workflow",
  },
  {
    item_id: "hat-empirical",
    primary_territory: "workflow",
    neighborhood_ids: ["task-delegation"],
    primary_layer: "workflow",
  },
  {
    item_id: "genai-task-performance",
    primary_territory: "workflow",
    neighborhood_ids: ["task-delegation"],
    primary_layer: "task",
  },
  {
    item_id: "human-ai-cocreation",
    primary_territory: "workflow",
    neighborhood_ids: ["co-creative-workflows"],
    primary_layer: "workflow",
  },
  {
    item_id: "human-ai-cocreativity",
    primary_territory: "workflow",
    neighborhood_ids: ["co-creative-workflows"],
    primary_layer: "workflow",
  },
  {
    item_id: "collective-intelligence",
    primary_territory: "workflow",
    secondary_territory: "roles-boundaries",
    neighborhood_ids: ["co-creative-workflows", "team-effectiveness"],
    primary_layer: "team",
  },
  {
    item_id: "team-challenges-ai",
    primary_territory: "workflow",
    secondary_territory: "roles-boundaries",
    neighborhood_ids: ["team-effectiveness"],
    primary_layer: "team",
  },
  {
    item_id: "antecedents-hat",
    primary_territory: "workflow",
    secondary_territory: "roles-boundaries",
    neighborhood_ids: ["team-effectiveness"],
    primary_layer: "team",
  },
  {
    item_id: "state-ai-work-anthropic",
    primary_territory: "workflow",
    secondary_territory: "rituals-norms",
    neighborhood_ids: ["team-effectiveness", "ai-culture-norms"],
    primary_layer: "organization",
  },
  {
    item_id: "human-loop-orgs",
    primary_territory: "governance",
    secondary_territory: "workflow",
    neighborhood_ids: ["human-in-the-loop", "algorithmic-oversight"],
    primary_layer: "organization",
  },
  {
    item_id: "algorithmic-management",
    primary_territory: "governance",
    secondary_territory: "workflow",
    neighborhood_ids: ["human-in-the-loop", "power-fairness"],
    primary_layer: "organization",
  },
  // Roles + Boundaries
  {
    item_id: "tools-to-teammates",
    primary_territory: "roles-boundaries",
    neighborhood_ids: ["tool-vs-teammate"],
    primary_layer: "team",
  },
  {
    item_id: "beyond-tool-teammate",
    primary_territory: "roles-boundaries",
    neighborhood_ids: ["tool-vs-teammate"],
    primary_layer: "team",
  },
  {
    item_id: "defining-hat",
    primary_territory: "roles-boundaries",
    neighborhood_ids: ["tool-vs-teammate", "teaming-vs-interaction"],
    primary_layer: "team",
  },
  {
    item_id: "who-what-teammate",
    primary_territory: "roles-boundaries",
    neighborhood_ids: ["team-composition"],
    primary_layer: "team",
  },
  {
    item_id: "superteams",
    primary_territory: "roles-boundaries",
    neighborhood_ids: ["team-composition"],
    primary_layer: "organization",
  },
  {
    item_id: "genai-colleague",
    primary_territory: "roles-boundaries",
    neighborhood_ids: ["team-composition", "identity-meaning"],
    primary_layer: "team",
  },
  {
    item_id: "soul-of-work",
    primary_territory: "roles-boundaries",
    secondary_territory: "rituals-norms",
    neighborhood_ids: ["identity-meaning", "ai-culture-norms"],
    primary_layer: "organization",
  },
  {
    item_id: "when-should-i-lead",
    primary_territory: "roles-boundaries",
    secondary_territory: "governance",
    neighborhood_ids: ["identity-meaning", "power-fairness"],
    primary_layer: "team",
  },
  {
    item_id: "requirements-ai-teammates",
    primary_territory: "roles-boundaries",
    neighborhood_ids: ["teaming-vs-interaction"],
    primary_layer: "team",
  },
  {
    item_id: "focus-modality-design",
    primary_territory: "roles-boundaries",
    secondary_territory: "interactions-modality",
    neighborhood_ids: ["teaming-vs-interaction", "ai-behavioral-patterns"],
    primary_layer: "task",
  },
  // Governance
  {
    item_id: "ethics-hat",
    primary_territory: "governance",
    neighborhood_ids: ["accountability-harm"],
    primary_layer: "organization",
  },
  {
    item_id: "towards-ethical-ai",
    primary_territory: "governance",
    neighborhood_ids: ["accountability-harm"],
    primary_layer: "organization",
  },
  {
    item_id: "hcai-hat",
    primary_territory: "governance",
    secondary_territory: "trust-accountability",
    neighborhood_ids: ["accountability-harm", "algorithmic-oversight"],
    primary_layer: "organization",
  },
  {
    item_id: "synthetic-authority",
    primary_territory: "governance",
    secondary_territory: "roles-boundaries",
    neighborhood_ids: ["power-fairness", "identity-meaning"],
    primary_layer: "organization",
  },
  // Rituals + Norms
  {
    item_id: "hello-mate",
    primary_territory: "rituals-norms",
    neighborhood_ids: ["onboarding-rituals"],
    primary_layer: "team",
  },
  {
    item_id: "when-ai-joins",
    primary_territory: "rituals-norms",
    neighborhood_ids: ["onboarding-rituals"],
    primary_layer: "team",
  },
  {
    item_id: "ai-culture",
    primary_territory: "rituals-norms",
    neighborhood_ids: ["ai-culture-norms", "trust-repair"],
    primary_layer: "organization",
  },
  {
    item_id: "we-train-ai",
    primary_territory: "rituals-norms",
    neighborhood_ids: ["training-upskilling"],
    primary_layer: "team",
  },
  {
    item_id: "skills-humans-need",
    primary_territory: "rituals-norms",
    neighborhood_ids: ["training-upskilling"],
    primary_layer: "organization",
  },
];

// ─── Source assignment lookup ─────────────────────────────────────────────────

export const SOURCE_ASSIGNMENT_MAP = new Map<string, SourceAssignment>(
  SOURCE_ASSIGNMENTS.map((a) => [a.item_id, a])
);

export function getSourceTerritory(itemId: string): string | null {
  return SOURCE_ASSIGNMENT_MAP.get(itemId)?.primary_territory ?? null;
}

// ─── Guided Routes ────────────────────────────────────────────────────────────

export const ROUTES: Route[] = [
  {
    id: "designing-ai-teammate",
    name: "Designing an AI Teammate",
    description:
      "A guided traverse through the core design challenges of introducing an AI into a human team. Five stops. Each one a different layer of the problem.",
    stops: [
      {
        id: "stop-workflow",
        focus_id: "workflow",
        focus_type: "territory",
        narrative:
          "Start here: work itself. Before designing any interaction, understand how adding AI changes the shape of tasks, the rhythm of handoffs, and where human judgment must be preserved. The Delegation Basin is where most AI projects either find their footing or lose it.",
        source_ids: ["survey-hat-lpm", "hat-empirical", "human-ai-cocreation"],
      },
      {
        id: "stop-roles",
        focus_id: "roles-boundaries",
        focus_type: "territory",
        narrative:
          "Now the harder question: is this AI a tool or a teammate? That framing shapes everything — expectations, accountability, the way people talk about it in meetings. Most teams skip this decision. Design requires making it explicit.",
        source_ids: ["tools-to-teammates", "beyond-tool-teammate", "defining-hat"],
      },
      {
        id: "stop-interactions",
        focus_id: "interactions-modality",
        focus_type: "territory",
        narrative:
          "The interaction layer: how does the AI communicate, behave, and signal its state? This is where team trust is built or broken — not through what the AI does, but through how it does it.",
        source_ids: [
          "amershi-guidelines",
          "structuring-ai-comm",
          "shared-mental-models",
        ],
      },
      {
        id: "stop-trust",
        focus_id: "trust-accountability",
        focus_type: "territory",
        narrative:
          "The ridge that runs through everything. Trust is not a feature to be added — it is a condition to be designed for. Calibration, repair, and accountability are all trust problems in different registers.",
        source_ids: [
          "trust-digital-teams",
          "shaping-trust",
          "trust-ai-team-member",
        ],
      },
      {
        id: "stop-governance",
        focus_id: "governance",
        focus_type: "territory",
        narrative:
          "Finally: the governance layer. Who is responsible when something goes wrong? How does the organization set the rules and revise them? Governance designed after an incident is governance that comes too late.",
        source_ids: ["ethics-hat", "hcai-hat", "human-loop-orgs"],
      },
    ],
  },
];

// ─── Territory lookup ─────────────────────────────────────────────────────────

export const TERRITORY_MAP = new Map<string, Territory>(
  TERRITORIES.map((t) => [t.id, t])
);

export const NEIGHBORHOOD_MAP = new Map<string, Neighborhood>(
  NEIGHBORHOODS.map((n) => [n.id, n])
);

/** Get all neighborhoods that belong to a territory */
export function getNeighborhoodsForTerritory(territoryId: string): Neighborhood[] {
  return NEIGHBORHOODS.filter((n) => n.territory_ids.includes(territoryId));
}

/** Get all source assignments for a territory */
export function getSourcesForTerritory(territoryId: string): SourceAssignment[] {
  return SOURCE_ASSIGNMENTS.filter(
    (a) =>
      a.primary_territory === territoryId ||
      a.secondary_territory === territoryId
  );
}
