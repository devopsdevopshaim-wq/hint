# DevOps Hub

מערכת המאגדת ידע DevOps לתוך שאלון אינטראקטיבי: המשתמש עונה על סדרת שאלות
(ענן, קונטיינרים, CI/CD, ניטור, ניהול סודות, שילובי AI וכו') ומקבל בתמורה:

1. **תוכנית פרויקט** - סיכום, סטאק מומלץ, ארכיטקטורה, אבני דרך וסיכונים.
2. **קבצי סקאפולד** - Dockerfile, קובצי CI/CD, שלד Terraform, README ועוד,
   מותאמים לתשובות שנבחרו.
3. **Workflow ל-n8n** - הגדרת workflow (nodes + connections) לאוטומציה של
   תהליכי ה-DevOps (התראות CI, תקריות, אישורי פריסה, טיקטים, דוחות), עם
   כפתור לפריסה ישירה למופע n8n אמיתי דרך ה-REST API שלו.

הבנייה מתבצעת על ידי שלושה "סוכנים" (`src/lib/agents`) המתואמים על ידי
אורקסטרטור (`orchestrator.ts`): Planner, Scaffold, ו-n8n Workflow. ה-Planner
משתמש ב-Claude כשמוגדר `ANTHROPIC_API_KEY`, ונופל בחזרה לתבניות דטרמיניסטיות
כשאין מפתח - כך שהאפליקציה עובדת מקצה לקצה גם ללא מפתחות.

## הרצה מקומית

```bash
cd devops-hub
npm install
cp .env.example .env.local   # מלאו ANTHROPIC_API_KEY / N8N_BASE_URL / N8N_API_KEY
npm run dev
```

האפליקציה תעלה על `http://localhost:3000`.

## משתני סביבה

| משתנה | תיאור |
| --- | --- |
| `ANTHROPIC_API_KEY` | מפתח Claude API. אופציונלי - בלעדיו ה-Planner Agent עובד עם תבניות. |
| `N8N_BASE_URL` | כתובת השורש של מופע ה-n8n שלכם (למשל `https://n8n.example.com`). נדרש כדי לפרוס workflow בפועל. |
| `N8N_API_KEY` | מפתח API של n8n (Settings → API בתוך n8n). |

## מבנה הפרויקט

```
src/
  app/
    page.tsx                     # השאלון + תצוגת תוצאות
    api/generate/route.ts        # מריץ את pipeline הסוכנים
    api/n8n/deploy/route.ts      # פורס workflow למופע n8n אמיתי
  components/
    QuestionWizard.tsx
    ResultsView.tsx
  lib/
    questions.ts                 # קטלוג השאלות
    types.ts
    claude.ts                    # עטיפת Anthropic SDK
    n8nClient.ts                 # קליינט REST ל-n8n
    agents/
      plannerAgent.ts
      scaffoldAgent.ts
      n8nWorkflowAgent.ts
      orchestrator.ts
```

## הרחבות עתידיות

* חיבור GitHub API ליצירת repo אמיתי ו-push ישיר של קבצי הסקאפולד.
* שמירת היסטוריית שאלונים/תוכניות למשתמש (מסד נתונים).
* עוד סוכנים (למשל Security Agent שסורק את הסקאפולד שנוצר).
