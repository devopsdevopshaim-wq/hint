import { getArray, getString } from "../answers";
import type { Answers, N8nWorkflowSpec, ProjectPlan } from "../types";

interface NodeBranch {
    trigger: Record<string, unknown>;
    steps: Record<string, unknown>[];
}

const GRID_Y_STEP = 200;

/**
 * The n8n Workflow Agent turns the chosen automations into a real n8n
 * workflow definition (nodes + connections) tailored to the project.
 * Node JSON shape is template-driven to guarantee it stays importable.
 */
export function buildN8nWorkflow(answers: Answers, plan: ProjectPlan): N8nWorkflowSpec {
    const automations = getArray(answers, "n8n_automation");
    const channel = getString(answers, "notification_channel") || "slack";
    const projectName = getString(answers, "project_name") || "project";

    const branches: NodeBranch[] = [];

    if (automations.includes("ci_notifications")) {
        branches.push(webhookNotificationBranch({
            triggerName: "CI/CD Webhook",
            path: "ci-cd-events",
            notifyName: "Notify CI Result",
            message: `CI/CD run for ${projectName}: {{$json["status"]}}`,
            channel
        }));
    }

    if (automations.includes("incident_alerts")) {
        branches.push(webhookNotificationBranch({
            triggerName: "Incident Webhook",
            path: "incidents",
            notifyName: "Notify Incident",
            message: `🚨 Incident on ${projectName}: {{$json["message"]}}`,
            channel
        }));
    }

    if (automations.includes("deploy_approval")) {
        const trigger = webhookNode("Deploy Request Webhook", "deploy-approval", 0);
        const notify = notificationNode(
            "Request Deploy Approval",
            `Approve deployment of ${projectName} to {{$json["environment"]}}?`,
            channel,
            1
        );
        const httpTrigger = httpRequestNode(
            "Trigger Deployment",
            `https://example.com/api/deploy/${projectName}`,
            2
        );
        branches.push({ trigger, steps: [notify, httpTrigger] });
    }

    if (automations.includes("ticket_creation")) {
        const trigger = webhookNode("Ticket Webhook", "tickets", 0);
        const httpCreate = httpRequestNode(
            "Create Ticket",
            "https://example.atlassian.net/rest/api/2/issue",
            1
        );
        branches.push({ trigger, steps: [httpCreate] });
    }

    if (automations.includes("scheduled_reports")) {
        const trigger = cronNode("Scheduled Report Trigger", 0);
        const gather = httpRequestNode(
            "Gather Report Data",
            `https://example.com/api/${projectName}/metrics`,
            1
        );
        const notify = notificationNode(
            `Send ${projectName} Report`,
            `📊 Weekly report for ${projectName} is ready.`,
            channel,
            2
        );
        branches.push({ trigger, steps: [gather, notify] });
    }

    if (branches.length === 0) {
        branches.push(webhookNotificationBranch({
            triggerName: "CI/CD Webhook",
            path: "ci-cd-events",
            notifyName: "Notify CI Result",
            message: `CI/CD run for ${projectName}: {{$json["status"]}}`,
            channel
        }));
    }

    const nodes: Record<string, unknown>[] = [];
    const connections: Record<string, unknown> = {};

    branches.forEach((branch, branchIndex) => {
        const y = branchIndex * GRID_Y_STEP;
        const triggerNode = positioned(branch.trigger, 0, y);
        nodes.push(triggerNode);

        let previousName = nameOf(triggerNode);
        branch.steps.forEach((step, stepIndex) => {
            const node = positioned(step, (stepIndex + 1) * 300, y);
            nodes.push(node);
            connections[previousName] = {
                main: [[{ node: nameOf(node), type: "main", index: 0 }]]
            };
            previousName = nameOf(node);
        });
    });

    return {
        name: `${projectName} - DevOps Automation`,
        nodes,
        connections,
        active: false,
        settings: { executionOrder: "v1" }
    };
}

function webhookNotificationBranch(params: {
    triggerName: string;
    path: string;
    notifyName: string;
    message: string;
    channel: string;
}): NodeBranch {
    return {
        trigger: webhookNode(params.triggerName, params.path, 0),
        steps: [notificationNode(params.notifyName, params.message, params.channel, 1)]
    };
}

function nameOf(node: Record<string, unknown>): string {
    return node.name as string;
}

function positioned(node: Record<string, unknown>, x: number, y: number): Record<string, unknown> {
    return { ...node, position: [x, y] };
}

function webhookNode(name: string, path: string, order: number): Record<string, unknown> {
    return {
        id: slug(name),
        name,
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [order * 300, 0],
        parameters: {
            path,
            httpMethod: "POST",
            responseMode: "onReceived"
        }
    };
}

function cronNode(name: string, order: number): Record<string, unknown> {
    return {
        id: slug(name),
        name,
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1,
        position: [order * 300, 0],
        parameters: {
            rule: { interval: [{ field: "weeks" }] }
        }
    };
}

function httpRequestNode(name: string, url: string, order: number): Record<string, unknown> {
    return {
        id: slug(name),
        name,
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [order * 300, 0],
        parameters: {
            method: "POST",
            url,
            sendBody: true,
            bodyParameters: {
                parameters: [{ name: "source", value: "={{$json}}" }]
            }
        }
    };
}

function notificationNode(name: string, message: string, channel: string, order: number): Record<string, unknown> {
    const base = {
        id: slug(name),
        name,
        position: [order * 300, 0] as [number, number]
    };

    switch (channel) {
        case "slack":
            return {
                ...base,
                type: "n8n-nodes-base.slack",
                typeVersion: 2.2,
                parameters: {
                    resource: "message",
                    operation: "post",
                    select: "channel",
                    channelId: "#devops",
                    text: message
                }
            };
        case "email":
            return {
                ...base,
                type: "n8n-nodes-base.emailSend",
                typeVersion: 2.1,
                parameters: {
                    subject: name,
                    text: message,
                    toEmail: "devops@example.com"
                }
            };
        case "teams":
            return {
                ...base,
                type: "n8n-nodes-base.microsoftTeams",
                typeVersion: 2,
                parameters: {
                    resource: "chatMessage",
                    message
                }
            };
        default:
            return {
                ...base,
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.2,
                parameters: {
                    method: "POST",
                    url: "https://example.com/webhook-target",
                    sendBody: true,
                    bodyParameters: { parameters: [{ name: "message", value: message }] }
                }
            };
    }
}

function slug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
