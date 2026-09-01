import type { N8nWorkflowSpec } from "./types";

export class N8nNotConfiguredError extends Error {
    constructor() {
        super("N8N_BASE_URL / N8N_API_KEY are not configured on the server.");
        this.name = "N8nNotConfiguredError";
    }
}

export class N8nRequestError extends Error {
    constructor(public status: number, public body: string) {
        super(`n8n API request failed with status ${status}: ${body}`);
        this.name = "N8nRequestError";
    }
}

export interface DeployedWorkflow {
    id: string;
    editorUrl: string;
}

/**
 * Pushes a generated workflow into a real n8n instance via its REST API.
 * Requires N8N_BASE_URL (e.g. https://n8n.example.com) and N8N_API_KEY to
 * be configured in the environment.
 */
export async function deployWorkflowToN8n(workflow: N8nWorkflowSpec): Promise<DeployedWorkflow> {
    const baseUrl = process.env.N8N_BASE_URL;
    const apiKey = process.env.N8N_API_KEY;

    if (!baseUrl || !apiKey) {
        throw new N8nNotConfiguredError();
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

    const response = await fetch(`${normalizedBaseUrl}/api/v1/workflows`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-N8N-API-KEY": apiKey
        },
        body: JSON.stringify({
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings ?? {}
        })
    });

    const bodyText = await response.text();

    if (!response.ok) {
        throw new N8nRequestError(response.status, bodyText);
    }

    const created = JSON.parse(bodyText) as { id: string };

    return {
        id: created.id,
        editorUrl: `${normalizedBaseUrl}/workflow/${created.id}`
    };
}
