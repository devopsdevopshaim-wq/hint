import { askClaudeForJson } from "../claude";
import { getArray, getString, labelFor, labelsFor } from "../answers";
import type { Answers, ProjectPlan } from "../types";

const SYSTEM_PROMPT = `You are the Planner Agent inside a multi-agent DevOps assistant.
Given a questionnaire's answers about a software project, produce a concise,
practical project plan. Respond ONLY with a JSON object matching:
{
  "title": string,
  "summary": string (2-3 sentences),
  "recommendedStack": string[] (5-10 concrete technologies),
  "architecture": string[] (4-8 bullet points describing the architecture),
  "milestones": string[] (4-6 ordered delivery milestones),
  "risks": string[] (3-5 risks or open questions to watch)
}
Write in Hebrew.`;

export async function planProject(answers: Answers): Promise<ProjectPlan> {
    const aiPlan = await askClaudeForJson<ProjectPlan>({
        system: SYSTEM_PROMPT,
        prompt: `Questionnaire answers (JSON):\n${JSON.stringify(answers, null, 2)}`
    });
    if (aiPlan) return aiPlan;

    return buildTemplatePlan(answers);
}

function buildTemplatePlan(answers: Answers): ProjectPlan {
    const projectName = getString(answers, "project_name") || "הפרויקט";
    const projectType = labelFor("project_type", getString(answers, "project_type"));
    const cloud = labelFor("cloud_provider", getString(answers, "cloud_provider"));
    const containerization = labelFor("containerization", getString(answers, "containerization"));
    const iac = labelFor("iac_tool", getString(answers, "iac_tool"));
    const ciCd = labelFor("ci_cd_tool", getString(answers, "ci_cd_tool"));
    const sourceControl = labelFor("source_control", getString(answers, "source_control"));
    const environments = labelFor("environments", getString(answers, "environments"));
    const teamSize = labelFor("team_size", getString(answers, "team_size"));
    const monitoring = labelsFor("monitoring", getArray(answers, "monitoring"));
    const aiOps = labelsFor("ai_ops", getArray(answers, "ai_ops"));

    const recommendedStack = [
        sourceControl,
        ciCd,
        containerization,
        iac,
        cloud,
        ...monitoring.filter((m) => m !== "עדיין לא נדרש")
    ].filter((item) => item && !item.includes("ללא") && !item.includes("לא נדרש") && item !== "עדיין לא ידוע");

    return {
        title: `תוכנית פרויקט: ${projectName}`,
        summary: `${projectName} הוא ${projectType} שיפותח בצוות בגודל "${teamSize}" ויפרס על גבי ${cloud}, ` +
            `עם ${environments} סביבות פריסה. הפרויקט ישלב ${containerization} ו-${iac} לניהול תשתית כקוד.`,
        recommendedStack: Array.from(new Set(recommendedStack)),
        architecture: [
            `בקרת גרסאות ב-${sourceControl}, עם pipeline ב-${ciCd}.`,
            `ריצה על גבי ${containerization === "לא נדרש" ? "תהליכים רגילים ללא קונטיינרים" : containerization}.`,
            `תשתית מנוהלת כקוד באמצעות ${iac === "ללא IaC כרגע" ? "תצורה ידנית (לשקול IaC בהמשך)" : iac}.`,
            `${environments} עם קידום שינויים (promotion) בין הסביבות.`,
            monitoring.length ? `ניטור ואבחון: ${monitoring.join(", ")}.` : "ניטור: לתכנן בהמשך.",
            aiOps.length ? `שילובי AI בתהליך: ${aiOps.join(", ")}.` : "ללא שילוב AI בשלב זה."
        ],
        milestones: [
            "הקמת מאגר קוד ותשתית CI/CD בסיסית",
            "הקמת סביבת פיתוח (Dev) והרצת deployment ראשון",
            "חיבור ניטור/אבחון והתראות",
            "חיבור n8n לאוטומציה של תהליכי CI/CD ותקריות",
            environments === "Dev + Staging + Production" ? "הקמת סביבת Staging ותהליך promotion" : "הקמת סביבת Production",
            "סקירת אבטחה, ניהול סודות והשלמת תיעוד"
        ].filter(Boolean) as string[],
        risks: [
            "היעדר ניסיון קודם עם חלק מהכלים שנבחרו עלול להאט את ההקמה הראשונית.",
            iac === "ללא IaC כרגע" ? "ללא IaC קיים סיכון ל-drift בין סביבות." : "יש לוודא state management תקין ל-IaC.",
            "יש להגדיר מדיניות ניהול סודות ברורה לפני מעבר ל-Production.",
            teamSize === "מפתח/ת יחיד/ה" ? "צוות קטן/יחיד עלול להוות צוואר בקבוק בתחזוקה." : "יש להגדיר בעלות ברורה על כל רכיב בתשתית."
        ]
    };
}
