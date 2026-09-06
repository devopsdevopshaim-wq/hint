import type { Question } from "./types";

/**
 * The DevOps knowledge questionnaire. Answers to these questions feed the
 * agent pipeline (see src/lib/agents) that produces a project plan, a file
 * scaffold, and an n8n automation workflow.
 */
export const QUESTIONS: Question[] = [
    {
        id: "project_type",
        domain: "project",
        text: "מה אופי הפרויקט שאתם רוצים להקים?",
        type: "single",
        options: [
            { value: "web_app", label: "אפליקציית ווב / API" },
            { value: "microservices", label: "מערכת מיקרו-שירותים" },
            { value: "data_pipeline", label: "צנרת נתונים / ETL" },
            { value: "ml_service", label: "שירות ML / AI" },
            { value: "internal_tool", label: "כלי פנימי / אוטומציה" }
        ]
    },
    {
        id: "team_size",
        domain: "project",
        text: "מה גודל הצוות שיעבוד על הפרויקט?",
        type: "single",
        options: [
            { value: "solo", label: "מפתח/ת יחיד/ה" },
            { value: "small", label: "צוות קטן (2-5)" },
            { value: "medium", label: "צוות בינוני (6-15)" },
            { value: "large", label: "ארגון גדול (15+)" }
        ]
    },
    {
        id: "cloud_provider",
        domain: "infrastructure",
        text: "באיזה ספק ענן (או תשתית) תרצו להשתמש?",
        type: "single",
        options: [
            { value: "aws", label: "AWS" },
            { value: "gcp", label: "Google Cloud" },
            { value: "azure", label: "Azure" },
            { value: "on_prem", label: "On-Premise / self-hosted" },
            { value: "none", label: "עדיין לא ידוע" }
        ]
    },
    {
        id: "containerization",
        domain: "infrastructure",
        text: "האם תרצו לעבוד עם קונטיינרים?",
        type: "single",
        options: [
            { value: "docker_only", label: "Docker בלבד" },
            { value: "kubernetes", label: "Docker + Kubernetes" },
            { value: "serverless", label: "Serverless (ללא קונטיינרים)" },
            { value: "none", label: "לא נדרש" }
        ]
    },
    {
        id: "iac_tool",
        domain: "infrastructure",
        text: "איזה כלי Infrastructure as Code מעדיפים?",
        type: "single",
        options: [
            { value: "terraform", label: "Terraform" },
            { value: "pulumi", label: "Pulumi" },
            { value: "cloudformation", label: "AWS CloudFormation" },
            { value: "none", label: "ללא IaC כרגע" }
        ]
    },
    {
        id: "source_control",
        domain: "cicd",
        text: "היכן מתארח קוד המקור?",
        type: "single",
        options: [
            { value: "github", label: "GitHub" },
            { value: "gitlab", label: "GitLab" },
            { value: "bitbucket", label: "Bitbucket" },
            { value: "azure_devops", label: "Azure DevOps" }
        ]
    },
    {
        id: "ci_cd_tool",
        domain: "cicd",
        text: "איזה כלי CI/CD תרצו להשתמש בו?",
        type: "single",
        options: [
            { value: "github_actions", label: "GitHub Actions" },
            { value: "gitlab_ci", label: "GitLab CI" },
            { value: "jenkins", label: "Jenkins" },
            { value: "azure_pipelines", label: "Azure Pipelines" },
            { value: "circleci", label: "CircleCI" }
        ]
    },
    {
        id: "environments",
        domain: "cicd",
        text: "כמה סביבות פריסה יש לכם?",
        type: "single",
        options: [
            { value: "single", label: "סביבה אחת בלבד" },
            { value: "dev_prod", label: "Dev + Production" },
            { value: "dev_staging_prod", label: "Dev + Staging + Production" }
        ]
    },
    {
        id: "monitoring",
        domain: "observability",
        text: "אילו כלי ניטור/אבחון (Observability) חשובים לכם?",
        type: "multi",
        options: [
            { value: "prometheus_grafana", label: "Prometheus + Grafana" },
            { value: "elk", label: "ELK / OpenSearch" },
            { value: "datadog", label: "Datadog" },
            { value: "cloudwatch", label: "CloudWatch" },
            { value: "none", label: "עדיין לא נדרש" }
        ]
    },
    {
        id: "secrets_management",
        domain: "security",
        text: "איך תרצו לנהל סודות (secrets)?",
        type: "single",
        options: [
            { value: "vault", label: "HashiCorp Vault" },
            { value: "cloud_secrets_manager", label: "Secrets Manager של ספק הענן" },
            { value: "doppler", label: "Doppler" },
            { value: "env_files", label: "קבצי .env מנוהלים ידנית" }
        ]
    },
    {
        id: "ai_ops",
        domain: "ai",
        text: "היכן תרצו לשלב AI / סוכני LLM בתהליך ה-DevOps?",
        type: "multi",
        options: [
            { value: "code_review", label: "סקירת קוד אוטומטית" },
            { value: "incident_triage", label: "מיון וטריאז' תקריות" },
            { value: "chatops", label: "ChatOps (Slack/Teams)" },
            { value: "deploy_approval", label: "אישור פריסות בשיחה" },
            { value: "docs_generation", label: "יצירת תיעוד אוטומטית" },
            { value: "none", label: "לא כרגע" }
        ]
    },
    {
        id: "n8n_automation",
        domain: "automation",
        text: "אילו תהליכים תרצו ש-n8n יאטמט עבורכם?",
        helpText: "הבחירות כאן קובעות אילו nodes ייכללו ב-workflow שייווצר עבורכם.",
        type: "multi",
        options: [
            { value: "ci_notifications", label: "התראות על ריצות CI/CD (הצלחה/כישלון)" },
            { value: "incident_alerts", label: "התראות תקריות (alerts) לצוות" },
            { value: "deploy_approval", label: "אישור פריסה דרך צ'אט" },
            { value: "ticket_creation", label: "פתיחת טיקטים אוטומטית" },
            { value: "scheduled_reports", label: "דוחות תקופתיים מתוזמנים" }
        ]
    },
    {
        id: "notification_channel",
        domain: "automation",
        text: "לאיזה ערוץ יישלחו ההתראות מ-n8n?",
        type: "single",
        options: [
            { value: "slack", label: "Slack" },
            { value: "email", label: "Email" },
            { value: "teams", label: "Microsoft Teams" },
            { value: "webhook", label: "Webhook כללי" }
        ]
    },
    {
        id: "project_name",
        domain: "project",
        text: "איך תרצו לקרוא לפרויקט?",
        type: "text",
        placeholder: "לדוגמה: payments-service"
    }
];

export function getQuestionById(id: string): Question | undefined {
    return QUESTIONS.find((q) => q.id === id);
}
