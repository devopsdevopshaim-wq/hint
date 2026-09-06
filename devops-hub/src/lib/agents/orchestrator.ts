import { isAIEnabled } from "../claude";
import type { Answers, GenerationResult } from "../types";
import { planProject } from "./plannerAgent";
import { scaffoldProject } from "./scaffoldAgent";
import { buildN8nWorkflow } from "./n8nWorkflowAgent";

/**
 * Coordinates the three DevOps agents: Planner -> Scaffold -> n8n Workflow.
 * Scaffold and workflow both depend on the plan, so they run after it
 * (and in parallel with each other, since they don't depend on one
 * another).
 */
export async function runAgentPipeline(answers: Answers): Promise<GenerationResult> {
    const plan = await planProject(answers);

    const [scaffold, workflow] = await Promise.all([
        Promise.resolve(scaffoldProject(answers, plan)),
        Promise.resolve(buildN8nWorkflow(answers, plan))
    ]);

    return {
        plan,
        scaffold,
        workflow,
        usedAI: isAIEnabled()
    };
}
