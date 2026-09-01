"use client";

import { useState } from "react";
import { QUESTIONS } from "@/lib/questions";
import type { Answers } from "@/lib/types";

interface QuestionWizardProps {
    onComplete: (answers: Answers) => void;
}

export default function QuestionWizard({ onComplete }: QuestionWizardProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});

    const question = QUESTIONS[stepIndex];
    const isLast = stepIndex === QUESTIONS.length - 1;
    const currentValue = answers[question.id];

    const canProceed = question.type === "text"
        ? true
        : question.type === "multi"
            ? Array.isArray(currentValue) && currentValue.length > 0
            : typeof currentValue === "string" && currentValue.length > 0;

    function selectSingle(value: string) {
        setAnswers((prev) => ({ ...prev, [question.id]: value }));
    }

    function toggleMulti(value: string) {
        setAnswers((prev) => {
            const existing = Array.isArray(prev[question.id]) ? (prev[question.id] as string[]) : [];
            const next = existing.includes(value)
                ? existing.filter((v) => v !== value)
                : [...existing, value];
            return { ...prev, [question.id]: next };
        });
    }

    function setText(value: string) {
        setAnswers((prev) => ({ ...prev, [question.id]: value }));
    }

    function next() {
        if (isLast) {
            onComplete(answers);
        } else {
            setStepIndex((i) => i + 1);
        }
    }

    function back() {
        setStepIndex((i) => Math.max(0, i - 1));
    }

    return (
        <div className="card">
            <div className="progress">
                שאלה {stepIndex + 1} מתוך {QUESTIONS.length}
            </div>
            <h2>{question.text}</h2>
            {question.helpText && <p style={{ color: "var(--muted)" }}>{question.helpText}</p>}

            {question.type === "text" ? (
                <input
                    type="text"
                    placeholder={question.placeholder}
                    value={(currentValue as string) ?? ""}
                    onChange={(e) => setText(e.target.value)}
                />
            ) : (
                <div className="options">
                    {question.options?.map((option) => {
                        const selected = question.type === "multi"
                            ? Array.isArray(currentValue) && currentValue.includes(option.value)
                            : currentValue === option.value;
                        return (
                            <div
                                key={option.value}
                                className={`option${selected ? " selected" : ""}`}
                                onClick={() => (question.type === "multi" ? toggleMulti(option.value) : selectSingle(option.value))}
                            >
                                <input
                                    type={question.type === "multi" ? "checkbox" : "radio"}
                                    checked={selected}
                                    readOnly
                                />
                                <span>{option.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="actions">
                <button className="secondary" onClick={back} disabled={stepIndex === 0}>
                    הקודם
                </button>
                <button className="primary" onClick={next} disabled={!canProceed}>
                    {isLast ? "צור תוכנית" : "הבא"}
                </button>
            </div>
        </div>
    );
}
