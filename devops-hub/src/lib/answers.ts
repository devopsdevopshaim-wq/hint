import { getQuestionById } from "./questions";
import type { Answers } from "./types";

export function getString(answers: Answers, id: string): string {
    const value = answers[id];
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
}

export function getArray(answers: Answers, id: string): string[] {
    const value = answers[id];
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
}

export function labelFor(questionId: string, value: string): string {
    const question = getQuestionById(questionId);
    return question?.options?.find((o) => o.value === value)?.label ?? value;
}

export function labelsFor(questionId: string, values: string[]): string[] {
    return values.map((v) => labelFor(questionId, v));
}
