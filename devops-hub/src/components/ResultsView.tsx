"use client";

import { useMemo, useState } from "react";
import type { GenerationResult } from "@/lib/types";

interface ResultsViewProps {
    result: GenerationResult;
    onRestart: () => void;
}

interface GraphNode {
    name: string;
    type: string;
    x: number;
    y: number;
}

function groupWorkflowBranches(nodes: Record<string, unknown>[]): GraphNode[][] {
    const parsed: GraphNode[] = nodes.map((n) => {
        const pos = (n.position as [number, number]) ?? [0, 0];
        return { name: n.name as string, type: (n.type as string).split(".").pop() ?? "", x: pos[0], y: pos[1] };
    });
    const byY = new Map<number, GraphNode[]>();
    for (const node of parsed) {
        const bucket = byY.get(node.y) ?? [];
        bucket.push(node);
        byY.set(node.y, bucket);
    }
    return Array.from(byY.values()).map((branch) => branch.sort((a, b) => a.x - b.x));
}

export default function ResultsView({ result, onRestart }: ResultsViewProps) {
    const { plan, scaffold, workflow, usedAI } = result;
    const [deployState, setDeployState] = useState<"idle" | "deploying" | "done" | "error">("idle");
    const [deployMessage, setDeployMessage] = useState<string>("");

    const branches = useMemo(() => groupWorkflowBranches(workflow.nodes), [workflow.nodes]);

    async function deployToN8n() {
        setDeployState("deploying");
        setDeployMessage("");
        try {
            const res = await fetch("/api/n8n/deploy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workflow })
            });
            const data = await res.json();
            if (!res.ok) {
                setDeployState("error");
                setDeployMessage(data.error ?? "הפריסה נכשלה");
                return;
            }
            setDeployState("done");
            setDeployMessage(data.editorUrl);
        } catch {
            setDeployState("error");
            setDeployMessage("שגיאת רשת בעת פריסת ה-workflow");
        }
    }

    return (
        <div>
            <span className={`badge${usedAI ? "" : " fallback"}`}>
                <span className="status-dot" style={{ boxShadow: "none" }} />
                <span className="mono">plan.json</span>
                {usedAI ? <span>נוצר על ידי Claude</span> : <span>נוצר מתבניות (<span className="mono">ANTHROPIC_API_KEY</span> לא מוגדר)</span>}
            </span>

            <div className="card">
                <div className="step-label">01 · planner-agent</div>
                <h2>{plan.title}</h2>
                <p>{plan.summary}</p>

                <h3>סטאק מומלץ</h3>
                <ul className="plain">
                    {plan.recommendedStack.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>

                <h3>ארכיטקטורה</h3>
                <ul className="plain">
                    {plan.architecture.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>

                <h3>אבני דרך</h3>
                <ul className="plain">
                    {plan.milestones.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>

                <h3>סיכונים לתשומת לב</h3>
                <ul className="plain">
                    {plan.risks.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>

            <div className="card">
                <div className="step-label">02 · scaffold-agent</div>
                <h2>קבצי סקאפולד <span className="mono" style={{ color: "var(--muted)", fontSize: 14 }}>({scaffold.length} files)</span></h2>
                {scaffold.map((file) => (
                    <details className="file-item" key={file.path}>
                        <summary>
                            <span className="file-path">{file.path}</span>
                            <span className="file-desc">{file.description}</span>
                        </summary>
                        <pre>{file.content}</pre>
                    </details>
                ))}
            </div>

            <div className="card">
                <div className="step-label">03 · n8n-workflow-agent</div>
                <h2>{workflow.name}</h2>
                <p style={{ color: "var(--muted)" }}>
                    {workflow.nodes.length} nodes נוצרו בהתאם לתהליכי האוטומציה שנבחרו — כל שורה למטה היא נתיב אחד ב-workflow.
                </p>

                <div className="workflow-graph">
                    {branches.map((branch, i) => (
                        <div className="workflow-branch" key={i}>
                            {branch.map((node, j) => (
                                <span key={node.name}>
                                    <span className={`workflow-node${j === 0 ? " trigger" : ""}`}>
                                        {node.name}
                                    </span>
                                    {j < branch.length - 1 && <span className="workflow-arrow">▸</span>}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>

                <details className="file-item">
                    <summary>
                        <span className="file-path">workflow.json</span>
                        <span className="file-desc">ה-JSON המלא כפי שנשלח ל-n8n</span>
                    </summary>
                    <pre>{JSON.stringify(workflow, null, 2)}</pre>
                </details>

                <div className="actions deploy">
                    <button className="primary" onClick={deployToN8n} disabled={deployState === "deploying"}>
                        {deployState === "deploying" ? "מפרס..." : "פרוס ל-n8n ▸"}
                    </button>
                </div>

                {deployState === "done" && (
                    <p className="success">
                        ✓ נפרס בהצלחה: <a href={deployMessage} target="_blank" rel="noreferrer">{deployMessage}</a>
                    </p>
                )}
                {deployState === "error" && <p className="error">✗ {deployMessage}</p>}
            </div>

            <div className="restart-row">
                <button className="secondary" onClick={onRestart}>
                    ↺ התחל שאלון חדש
                </button>
            </div>
        </div>
    );
}
