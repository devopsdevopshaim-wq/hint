export type QuestionType = "single" | "multi" | "text";

export interface QuestionOption {
    value: string;
    label: string;
}

export interface Question {
    id: string;
    domain: string;
    text: string;
    helpText?: string;
    type: QuestionType;
    options?: QuestionOption[];
    placeholder?: string;
}

/** Raw answers keyed by question id. Single/text -> string, multi -> string[]. */
export type Answers = Record<string, string | string[]>;

export interface ProjectPlan {
    title: string;
    summary: string;
    recommendedStack: string[];
    architecture: string[];
    milestones: string[];
    risks: string[];
}

export interface ScaffoldFile {
    path: string;
    description: string;
    content: string;
}

export interface N8nWorkflowSpec {
    name: string;
    nodes: Record<string, unknown>[];
    connections: Record<string, unknown>;
    active: boolean;
    settings?: Record<string, unknown>;
}

export interface GenerationResult {
    plan: ProjectPlan;
    scaffold: ScaffoldFile[];
    workflow: N8nWorkflowSpec;
    usedAI: boolean;
}
