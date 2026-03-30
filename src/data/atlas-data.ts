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
      "M 155 332 C 222 332 277 390 277 462 C 277 534 222 592 155 592 C 88 592 33 534 33 462 C 33 390 88 332 155 332 Z",
    center: { x: 155, y: 462 },
    labelPos: { x: 155, y: 426 },
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
      "M 400 447 C 482 447 548 495 548 555 C 548 615 482 663 400 663 C 318 663 252 615 252 555 C 252 495 318 447 400 447 Z",
    center: { x: 400, y: 555 },
    labelPos: { x: 400, y: 525 },
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
      "M 420 156 C 502 156 568 211 568 278 C 568 345 502 400 420 400 C 338 400 272 345 272 278 C 272 211 338 156 420 156 Z",
    center: { x: 420, y: 278 },
    labelPos: { x: 420, y: 244 },
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
      "M 778 30 C 833 30 878 69 878 118 C 878 167 833 206 778 206 C 723 206 678 167 678 118 C 678 69 723 30 778 30 Z",
    center: { x: 778, y: 118 },
    labelPos: { x: 778, y: 93 },
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
    // Elongated vertical ridge — cross-cutting through center-east
    svgPath:
      "M 690 185 C 743 185 786 268 786 370 C 786 472 743 555 690 555 C 637 555 594 472 594 370 C 594 268 637 185 690 185 Z",
    center: { x: 690, y: 370 },
    labelPos: { x: 690, y: 318 },
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
      "M 188 52 C 253 52 306 97 306 152 C 306 207 253 252 188 252 C 123 252 70 207 70 152 C 70 97 123 52 188 52 Z",
    center: { x: 188, y: 152 },
    labelPos: { x: 188, y: 124 },
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
    labelPos: { x: 96, y: 392 },
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
    labelPos: { x: 194, y: 442 },
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
    labelPos: { x: 118, y: 522 },
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
    labelPos: { x: 218, y: 490 },
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
    labelPos: { x: 172, y: 556 },
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
    labelPos: { x: 290, y: 508 },
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
    labelPos: { x: 432, y: 492 },
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
    labelPos: { x: 506, y: 542 },
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
    labelPos: { x: 370, y: 614 },
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
    labelPos: { x: 312, y: 204 },
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
    labelPos: { x: 478, y: 194 },
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
    labelPos: { x: 344, y: 340 },
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
    labelPos: { x: 494, y: 326 },
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
    labelPos: { x: 740, y: 98 },
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
    labelPos: { x: 822, y: 152 },
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
    labelPos: { x: 634, y: 296 },
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
    labelPos: { x: 714, y: 462 },
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
    labelPos: { x: 148, y: 100 },
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
    labelPos: { x: 244, y: 130 },
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
    labelPos: { x: 176, y: 204 },
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
    labelPos: { x: 258, y: 190 },
    prominence: 0.65,
  },

  // ── Roles + Boundaries (new) ─────────────────────────────────────────────
  {
    id: "cila-7-dimensions",
    name: "CILA's 7 Collaboration Dimensions",
    thesis:
      "A practical canvas for specifying exactly how human and AI responsibilities are distributed across seven dimensions.",
    why_it_matters:
      "The CILA framework (Cila et al., CHI 2022) identifies seven dimensions for characterizing human-AI collaboration: goal setting, task performance, context awareness, learning, decision making, communication, and social interaction. Each dimension sits on a spectrum from fully human-led to fully AI-led. Rather than asking 'is AI a tool or teammate?' (binary), designers ask where each of the seven dimensions should sit for their specific context.",
    key_tensions: [
      "Granular role design vs. coordination overhead",
      "Explicit role contracts vs. emergent collaboration",
    ],
    design_moves: [
      "Use the 7 dimensions as a team charter canvas before deployment",
      "Revisit the canvas quarterly as AI capabilities change",
      "Make the dimension settings visible to all team members, not just designers",
    ],
    representative_source_ids: ["cila-7-dimensions-src"],
    territory_ids: ["roles-boundaries"],
    related_neighborhood_ids: ["tool-vs-teammate", "team-composition"],
    labelPos: { x: 372, y: 292 },
    prominence: 0.75,
  },
  {
    id: "synthetic-authority",
    name: "Synthetic Authority",
    thesis:
      "When AI acquires perceived authority it was never explicitly given — and why that happens by default.",
    why_it_matters:
      "AI systems accumulate perceived authority through interface design, confidence of presentation, frequency of use, and institutional embedding — regardless of whether that authority was formally assigned. Not deciding about AI authority is itself a decision that defaults toward accumulation. Teams need explicit authority audits as a governance practice.",
    key_tensions: [
      "Efficiency of deferring to AI vs. risks of unexamined authority",
      "Explicit authority design vs. organic adoption patterns",
    ],
    design_moves: [
      "Conduct an 'authority audit' before deployment: which decisions will AI recommendations influence?",
      "Design visible override mechanisms that don't require justification",
      "Surface AI's confidence level — distinguish 'AI suggested' from 'AI decided'",
    ],
    representative_source_ids: ["synthetic-authority"],
    territory_ids: ["roles-boundaries"],
    related_neighborhood_ids: ["identity-meaning", "power-fairness"],
    labelPos: { x: 462, y: 358 },
    prominence: 0.7,
  },

  // ── Workflow (new) ────────────────────────────────────────────────────────
  {
    id: "vibe-teaming",
    name: "Vibe Teaming",
    thesis:
      "When collaboration is ambient, always-on, and not organized around discrete tasks — a fundamentally different teaming mode.",
    why_it_matters:
      "Vibe Teaming (Taylor & Krishna, 2024) describes the emergent mode of human-AI collaboration that's informal, continuous, and context-rich. It's the difference between 'I'm delegating this task to AI' and 'AI is always in the room with me.' Knowledge workers interacting with LLM tools throughout their day are mostly doing Vibe Teaming, not structured task delegation — yet most design and research assumes the latter.",
    key_tensions: [
      "Ambient availability vs. distraction and over-reliance",
      "Informal collaboration vs. accountability for AI-influenced decisions",
      "Always-on AI vs. human cognitive recovery time",
    ],
    design_moves: [
      "Design AI 'off' modes and check-in rhythms alongside 'on' capabilities",
      "Create norms around when ambient AI use should become explicit task delegation",
      "Log AI touchpoints in ambient workflows so teams can reflect on AI's actual influence",
    ],
    representative_source_ids: ["vibe-teaming-src"],
    territory_ids: ["workflow"],
    related_neighborhood_ids: ["task-delegation", "co-creative-workflows"],
    labelPos: { x: 318, y: 584 },
    prominence: 0.75,
  },

  // ── Interactions + Modality (new) ─────────────────────────────────────────
  {
    id: "mutual-theory-of-mind",
    name: "Mutual Theory of Mind",
    thesis:
      "Effective collaboration requires that AI models its human — not just that humans learn to model AI.",
    why_it_matters:
      "The Mutual Theory of Mind framework (Schelble et al., 2023) reframes transparency as a bidirectional design challenge. It's not enough for AI to explain itself to humans; effective teaming requires that AI systems also build and update their model of the specific human they're working with, and adapt accordingly. The design question shifts from 'how do we make AI legible?' to 'how do we design for mutual adaptation?'",
    key_tensions: [
      "AI personalization vs. human privacy and autonomy",
      "Adaptive AI behavior vs. predictability and trust",
      "User modeling vs. stereotyping or manipulation",
    ],
    design_moves: [
      "Design explicit 'tell me about you' onboarding moments for AI teammates",
      "Make AI's model of its human visible and correctable",
      "Design for the AI to flag when it's operating outside its calibrated model of the user",
    ],
    representative_source_ids: ["mutual-tom-schelble"],
    territory_ids: ["interactions-modality"],
    related_neighborhood_ids: ["shared-understanding", "trust-calibration"],
    labelPos: { x: 80, y: 478 },
    prominence: 0.7,
  },

  // ── Rituals + Norms (new) ─────────────────────────────────────────────────
  {
    id: "relationship-stages",
    name: "Relationship Stages",
    thesis:
      "Human-AI relationships evolve through recognizable stages — and transitions between stages require deliberate ritual design.",
    why_it_matters:
      "Using a sociomateriality lens, Drossel & Hallbeck (2024) map how people's relationships with generative AI evolve through four stages: Tool Use → Interaction Partner → Collaborator → Colleague. Each stage has distinct interaction patterns and requires different rituals to enable progression. Most organizations get stuck at the Tool Use stage because they never design for the transitions.",
    key_tensions: [
      "Organic relationship development vs. designed onboarding rituals",
      "Individual relationship pace vs. team-level norm-setting",
      "Deeper collaboration vs. increasing dependence",
    ],
    design_moves: [
      "Design stage-appropriate onboarding: don't introduce collaboration norms before teams have basic fluency",
      "Create 'relationship review' rituals — e.g., quarterly team reflections on how AI use has evolved",
      "Name the stages explicitly so teams can recognize where they are and where they want to go",
    ],
    representative_source_ids: ["genai-new-colleague"],
    territory_ids: ["rituals-norms"],
    related_neighborhood_ids: ["onboarding-rituals", "ai-culture-norms"],
    labelPos: { x: 140, y: 172 },
    prominence: 0.75,
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
  // New sources — Step 3
  {
    item_id: "cila-7-dimensions-src",
    primary_territory: "roles-boundaries",
    neighborhood_ids: ["cila-7-dimensions"],
    primary_layer: "team",
  },
  {
    item_id: "genai-new-colleague",
    primary_territory: "rituals-norms",
    neighborhood_ids: ["relationship-stages"],
    primary_layer: "team",
  },
  {
    item_id: "vibe-teaming-src",
    primary_territory: "workflow",
    neighborhood_ids: ["vibe-teaming"],
    primary_layer: "workflow",
  },
  {
    item_id: "mutual-tom-schelble",
    primary_territory: "interactions-modality",
    neighborhood_ids: ["mutual-theory-of-mind"],
    primary_layer: "team",
  },
  {
    item_id: "ai-superteams-bock",
    primary_territory: "roles-boundaries",
    secondary_territory: "workflow",
    neighborhood_ids: ["team-composition"],
    primary_layer: "organization",
  },
  {
    item_id: "practical-guide-agents",
    primary_territory: "workflow",
    secondary_territory: "roles-boundaries",
    neighborhood_ids: ["task-delegation", "human-in-the-loop"],
    primary_layer: "workflow",
  },
  {
    item_id: "state-ai-business-2025",
    primary_territory: "governance",
    neighborhood_ids: ["accountability-harm", "power-fairness"],
    primary_layer: "organization",
  },
  {
    item_id: "cautious-adoption-genai",
    primary_territory: "governance",
    secondary_territory: "rituals-norms",
    neighborhood_ids: ["algorithmic-oversight"],
    primary_layer: "organization",
  },
  {
    item_id: "when-boss-algorithm",
    primary_territory: "governance",
    secondary_territory: "workflow",
    neighborhood_ids: ["power-fairness", "algorithmic-oversight"],
    primary_layer: "organization",
  },
  {
    item_id: "behavior-descriptions-teaming",
    primary_territory: "interactions-modality",
    secondary_territory: "roles-boundaries",
    neighborhood_ids: ["ai-behavioral-patterns", "mutual-theory-of-mind"],
    primary_layer: "team",
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
  {
    id: "integrating-ai-organization",
    name: "Integrating AI Into Your Organization",
    description:
      "For leaders and change-makers navigating org-wide AI adoption — a path through governance, culture, and workflow redesign. Five stops through the structural landscape.",
    stops: [
      {
        id: "org-stop-governance",
        focus_id: "governance",
        focus_type: "territory",
        narrative:
          "Start here: establish accountability chains and oversight structures before deployment, not after incidents. The Charter Hall is where the rules are set — or where, by default, they aren't.",
        source_ids: ["ethics-hat", "hcai-hat", "state-ai-business-2025"],
      },
      {
        id: "org-stop-rituals",
        focus_id: "rituals-norms",
        focus_type: "territory",
        narrative:
          "Build the cultural practices that make AI integration sustainable over time — not just policies, but habits. The Common Ground is where abstract governance becomes daily behaviour.",
        source_ids: ["ai-culture", "when-ai-joins", "genai-new-colleague"],
      },
      {
        id: "org-stop-workflow",
        focus_id: "workflow",
        focus_type: "territory",
        narrative:
          "Redesign how work is structured once AI is part of the team — handoffs, delegation patterns, and oversight moments. The Delegation Basin is where org strategy meets daily task flow.",
        source_ids: ["human-loop-orgs", "practical-guide-agents", "vibe-teaming-src"],
      },
      {
        id: "org-stop-roles",
        focus_id: "roles-boundaries",
        focus_type: "territory",
        narrative:
          "Define who does what — use the 7-dimension CILA framework to distribute responsibilities explicitly. The Boundary Cairn is where authority is assigned, or left dangerously ambiguous.",
        source_ids: ["cila-7-dimensions-src", "ai-superteams-bock", "when-should-i-lead"],
      },
      {
        id: "org-stop-trust",
        focus_id: "trust-accountability",
        focus_type: "territory",
        narrative:
          "Close the loop: build the trust calibration and repair mechanisms that keep the system healthy as AI capabilities grow. The Accountability Ridge runs through everything — you end here because trust is sustained, not installed.",
        source_ids: ["trust-digital-teams", "shaping-trust", "cautious-adoption-genai"],
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
