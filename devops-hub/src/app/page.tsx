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
                <h1>DevOps Hub</h1>
                <p>שאלון DevOps מבוסס AI שמייצר תוכנית פרויקט, קבצי סקאפולד ו-workflow אוטומציה ל-n8n</p>
            </div>

            {view === "wizard" && <QuestionWizard onComplete={handleComplete} />}

            {view === "loading" && (
                <div className="card">
                    <p>סוכני ה-AI בונים עבורכם תוכנית, סקאפולד ו-workflow ל-n8n...</p>
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
