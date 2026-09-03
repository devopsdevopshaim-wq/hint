import { NextRequest, NextResponse } from "next/server";
import { deployWorkflowToN8n, N8nNotConfiguredError, N8nRequestError } from "@/lib/n8nClient";
import type { N8nWorkflowSpec } from "@/lib/types";

export async function POST(request: NextRequest) {
    let workflow: N8nWorkflowSpec;

    try {
        const body = await request.json();
        workflow = body.workflow as N8nWorkflowSpec;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!workflow || !Array.isArray(workflow.nodes)) {
        return NextResponse.json({ error: "Missing 'workflow' object" }, { status: 400 });
    }

    try {
        const deployed = await deployWorkflowToN8n(workflow);
        return NextResponse.json(deployed);
    } catch (error) {
        if (error instanceof N8nNotConfiguredError) {
            return NextResponse.json({ error: error.message }, { status: 501 });
        }
        if (error instanceof N8nRequestError) {
            return NextResponse.json({ error: error.message }, { status: 502 });
        }
        console.error("Unexpected error deploying workflow to n8n:", error);
        return NextResponse.json({ error: "Failed to deploy workflow" }, { status: 500 });
    }
}
