import { NextRequest, NextResponse } from "next/server";
import { runAgentPipeline } from "@/lib/agents/orchestrator";
import type { Answers } from "@/lib/types";

export async function POST(request: NextRequest) {
    let answers: Answers;

    try {
        const body = await request.json();
        answers = body.answers as Answers;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!answers || typeof answers !== "object") {
        return NextResponse.json({ error: "Missing 'answers' object" }, { status: 400 });
    }

    try {
        const result = await runAgentPipeline(answers);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Agent pipeline failed:", error);
        return NextResponse.json({ error: "Failed to generate project plan" }, { status: 500 });
    }
}
