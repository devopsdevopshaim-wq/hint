import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null | undefined;

function getClient(): Anthropic | null {
    if (client !== undefined) return client;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    client = apiKey ? new Anthropic({ apiKey }) : null;
    return client;
}

export function isAIEnabled(): boolean {
    return getClient() !== null;
}

/**
 * Asks Claude to produce a JSON object matching the caller's expectations.
 * Returns null when no ANTHROPIC_API_KEY is configured or the call/parse
 * fails, so agents can fall back to their deterministic templates.
 */
export async function askClaudeForJson<T>(params: {
    system: string;
    prompt: string;
    model?: string;
}): Promise<T | null> {
    const anthropic = getClient();
    if (!anthropic) return null;

    try {
        const response = await anthropic.messages.create({
            model: params.model ?? "claude-sonnet-5",
            max_tokens: 4096,
            system: params.system,
            messages: [{ role: "user", content: params.prompt }]
        });

        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === "text")
            .map((block) => block.text)
            .join("\n");

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
        console.error("Claude request failed, falling back to templates:", error);
        return null;
    }
}
