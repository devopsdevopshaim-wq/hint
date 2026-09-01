"use client";

import { useState } from "react";
import type { GenerationResult } from "@/lib/types";

interface ResultsViewProps {
    result: GenerationResult;
    onRestart: () => void;
}

export default function ResultsView({ result, onRestart }: ResultsViewProps) {
    const { plan, scaffold, workflow, usedAI } = result;
    const [deployState, setDeployState] = useState<"idle" | "deploying" | "done" | "error">("idle");
    const [deployMessage, setDeployMessage] = useState<string>("");

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
                {usedAI ? "נוצר על ידי Claude" : "נוצר מתבניות (ANTHROPIC_API_KEY לא מוגדר)"}
            </span>

            <div className="card">
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
                <h2>קבצי סקאפולד ({scaffold.length})</h2>
                {scaffold.map((file) => (
                    <details className="file-item" key={file.path}>
                        <summary>{file.path} — {file.description}</summary>
                        <pre>{file.content}</pre>
                    </details>
                ))}
            </div>

            <div className="card">
                <h2>n8n Workflow: {workflow.name}</h2>
                <p style={{ color: "var(--muted)" }}>
                    {workflow.nodes.length} nodes נוצרו בהתאם לתהליכי האוטומציה שנבחרו.
                </p>
                <details className="file-item">
                    <summary>הצג JSON מלא</summary>
                    <pre>{JSON.stringify(workflow, null, 2)}</pre>
                </details>

                <div className="actions" style={{ justifyContent: "flex-start", gap: 12 }}>
                    <button className="primary" onClick={deployToN8n} disabled={deployState === "deploying"}>
                        {deployState === "deploying" ? "מפרס..." : "פרוס ל-n8n"}
                    </button>
                </div>

                {deployState === "done" && (
                    <p className="success">
                        נפרס בהצלחה: <a href={deployMessage} target="_blank" rel="noreferrer">{deployMessage}</a>
                    </p>
                )}
                {deployState === "error" && <p className="error">{deployMessage}</p>}
            </div>

            <button className="secondary" onClick={onRestart}>
                התחל שאלון חדש
            </button>
        </div>
    );
}
