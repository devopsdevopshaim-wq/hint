"use client";

import { useState } from "react";
import QuestionWizard from "@/components/QuestionWizard";
import ResultsView from "@/components/ResultsView";
import type { Answers, GenerationResult } from "@/lib/types";

type ViewState = "wizard" | "loading" | "results" | "error";

export default function HomePage() {
    const [view, setView] = useState<ViewState>("wizard");
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleComplete(answers: Answers) {
        setView("loading");
        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data.error ?? "אירעה שגיאה");
                setView("error");
                return;
            }
            setResult(data as GenerationResult);
            setView("results");
        } catch {
            setErrorMessage("שגיאת רשת - נסו שוב");
            setView("error");
        }
    }

    function restart() {
        setResult(null);
        setView("wizard");
    }

    return (
        <main>
            <div className="header">
                <h1>שאלון אחד. <span className="accent">pipeline</span> שלם.</h1>
                <p>ענו על שאלון DevOps קצר וקבלו תוכנית פרויקט, קבצי סקאפולד מוכנים, ו-workflow אוטומציה שנפרס ישירות למופע n8n שלכם.</p>
            </div>

            {view === "wizard" && <QuestionWizard onComplete={handleComplete} />}

            {view === "loading" && (
                <div className="terminal">
                    <div className="terminal-titlebar">
                        <div className="terminal-dots"><span /><span /><span /></div>
                        <span className="path">devops-hub — running agent pipeline</span>
                    </div>
                    <div className="terminal-body">
                        <div className="prompt-line">
                            $ planner-agent → scaffold-agent → n8n-workflow-agent
                            <span className="caret" />
                        </div>
                        <p style={{ color: "var(--muted)" }}>סוכני ה-AI בונים עבורכם תוכנית, סקאפולד ו-workflow ל-n8n...</p>
                    </div>
                </div>
            )}

            {view === "results" && result && <ResultsView result={result} onRestart={restart} />}

            {view === "error" && (
                <div className="card">
                    <p className="error">{errorMessage}</p>
                    <button className="secondary" onClick={restart}>נסו שוב</button>
                </div>
            )}
        </main>
    );
}
