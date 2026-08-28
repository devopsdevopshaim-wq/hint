// JARVIS Hub backend
//
// Two jobs, on purpose kept this small:
//   1. Serve the unified portal (../web) as static files.
//   2. Expose a small, *accurate* Hebrew-calendar JSON API built on
//      @hebcal/core — used by the website's calendar tab AND by the
//      n8n workflow's "hebrew_calendar_tool" (HTTP Request Tool node),
//      so both surfaces answer from the same source instead of two
//      different hand-rolled calculations drifting apart over time.
//
// Real-estate data (DiraFinder) and the JARVIS chat itself live in
// n8n/unified-assistant-workflow.json and talk to Postgres / the LLMs
// directly — this server does not touch that data.

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HDate,
  HebrewCalendar,
  Location,
  getSedra,
  Locale,
} from '@hebcal/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.join(__dirname, '..', 'web');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static(WEB_DIR));

// Allow the portal (or n8n, running on a different origin) to call this API.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function parseDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: "${value}". Use YYYY-MM-DD.`);
  }
  return d;
}

const ISRAEL = new Location(31.7683, 35.2137, true, 'Asia/Jerusalem', 'Jerusalem', 'IL');

/**
 * GET /api/hebrew-date?date=YYYY-MM-DD
 * Hebrew date, Shabbat/Rosh-Chodesh flags, holidays and parsha for one day.
 */
app.get('/api/hebrew-date', (req, res) => {
  try {
    const greg = parseDate(req.query.date);
    const hd = new HDate(greg);
    const dow = greg.getDay(); // 0 = Sunday .. 6 = Saturday

    const holidayEvents = HebrewCalendar.getHolidaysOnDate(hd, true) || [];
    let parsha = null;
    if (dow === 6) {
      const sedra = getSedra(hd.getFullYear(), true);
      const lookup = sedra.lookup(hd);
      if (lookup && !lookup.chag && lookup.parsha && lookup.parsha.length) {
        parsha = {
          en: lookup.parsha.join('-'),
          he: lookup.parsha.map((p) => Locale.gettext(p, 'he')).join(' – '),
        };
      }
    }

    res.json({
      gregorian: greg.toISOString().slice(0, 10),
      hebrew: { en: hd.render('en'), he: hd.render('he'), year: hd.getFullYear() },
      isLeapYear: hd.isLeapYear(),
      isShabbat: dow === 6,
      isRoshChodesh: hd.getDate() === 1 || hd.getDate() === 30,
      holidays: holidayEvents.map((e) => ({ en: e.render('en'), he: e.render('he'), categories: e.getCategories() })),
      parsha,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/holidays?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Holidays and parshiot in a Gregorian date range (defaults to the
 * current Hebrew year). Used for "when is X" / "what's the next Y" style
 * JARVIS questions.
 */
app.get('/api/holidays', (req, res) => {
  try {
    const start = req.query.start ? parseDate(req.query.start) : new Date();
    const end = req.query.end
      ? parseDate(req.query.end)
      : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

    const events = HebrewCalendar.calendar({
      start,
      end,
      location: ISRAEL,
      il: true,
      sedrot: true,
      candlelighting: false,
    });

    res.json(
      events.map((e) => ({
        gregorian: e.getDate().greg().toISOString().slice(0, 10),
        he: e.render('he'),
        en: e.render('en'),
        categories: e.getCategories(),
      }))
    );
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const ZODIAC = [
  { sign: 'גדי', en: 'Capricorn', from: [12, 22], to: [1, 19], element: 'אדמה', ruler: 'שבתאי',
    personality: 'ממושמע, אחראי, שאפתן וסבלני', strengths: ['התמדה', 'ריאליזם', 'משמעת עצמית'],
    challenges: ['נוקשות', 'פסימיות', 'קשיחות'], love: 'זהיר ומחויב, בונה קשר לטווח ארוך',
    career: 'מצטיין בניהול, כלכלה ותכנון ארוך טווח' },
  { sign: 'דלי', en: 'Aquarius', from: [1, 20], to: [2, 18], element: 'אוויר', ruler: 'אורנוס/שבתאי',
    personality: 'עצמאי, חדשני, הומניטרי', strengths: ['מקוריות', 'פתיחות מחשבתית', 'חברותיות'],
    challenges: ['ניתוק רגשי', 'עקשנות', 'חוסר צפיות'], love: 'זקוק לחופש ולחיבור אינטלקטואלי',
    career: 'טכנולוגיה, מדע, פעילות חברתית וקהילתית' },
  { sign: 'דגים', en: 'Pisces', from: [2, 19], to: [3, 20], element: 'מים', ruler: 'נפטון/צדק',
    personality: 'רגיש, אינטואיטיבי, חולמני', strengths: ['אמפתיה', 'יצירתיות', 'רוחניות'],
    challenges: ['בריחה מהמציאות', 'קורבנות עצמית', 'חוסר גבולות'], love: 'רומנטי ומסור, נוטה להתמזג עם בן/בת הזוג',
    career: 'אמנות, טיפול, עבודה סוציאלית' },
  { sign: 'טלה', en: 'Aries', from: [3, 21], to: [4, 19], element: 'אש', ruler: 'מאדים',
    personality: 'אנרגטי, ישיר, תחרותי', strengths: ['מנהיגות', 'אומץ', 'יוזמה'],
    challenges: ['חוסר סבלנות', 'אימפולסיביות', 'תוקפנות'], love: 'ישיר ותשוקתי, זקוק לעצמאות',
    career: 'ניהול, יזמות, ספורט' },
  { sign: 'שור', en: 'Taurus', from: [4, 20], to: [5, 20], element: 'אדמה', ruler: 'נוגה',
    personality: 'יציב, נהנתן, נאמן', strengths: ['סבלנות', 'אמינות', 'מעשיות'],
    challenges: ['עקשנות', 'חומרנות', 'התנגדות לשינוי'], love: 'נאמן ומחויב, מעריך יציבות',
    career: 'פיננסים, נדל"ן, אמנות ובישול' },
  { sign: 'תאומים', en: 'Gemini', from: [5, 21], to: [6, 20], element: 'אוויר', ruler: 'כוכב חמה',
    personality: 'סקרן, חברותי, מהיר מחשבה', strengths: ['תקשורת', 'הסתגלות', 'שנינות'],
    challenges: ['חוסר עקביות', 'שטחיות', 'חוסר החלטיות'], love: 'זקוק לגירוי מנטלי ומגוון',
    career: 'תקשורת, כתיבה, מכירות, הוראה' },
  { sign: 'סרטן', en: 'Cancer', from: [6, 21], to: [7, 22], element: 'מים', ruler: 'ירח',
    personality: 'רגשי, מטפח, אינטואיטיבי', strengths: ['אמפתיה', 'נאמנות', 'זיכרון רגשי'],
    challenges: ['רגישות יתר', 'מצבי רוח', 'הידבקות לעבר'], love: 'מסור ומגונן, זקוק לביטחון רגשי',
    career: 'טיפול, חינוך, מזון ומשפחה' },
  { sign: 'אריה', en: 'Leo', from: [7, 23], to: [8, 22], element: 'אש', ruler: 'שמש',
    personality: 'כריזמטי, נדיב, גאה', strengths: ['ביטחון עצמי', 'יצירתיות', 'נדיבות'],
    challenges: ['אגו', 'עקשנות', 'צורך בתשומת לב'], love: 'רומנטי ונדיב, זקוק להערכה',
    career: 'בידור, ניהול, אמנות' },
  { sign: 'בתולה', en: 'Virgo', from: [8, 23], to: [9, 22], element: 'אדמה', ruler: 'כוכב חמה',
    personality: 'אנליטי, פרפקציוניסט, שירותי', strengths: ['דיוק', 'ארגון', 'אחריות'],
    challenges: ['ביקורתיות יתר', 'דאגנות', 'קיפאון'], love: 'מסור ומעשי, מבטא אהבה דרך מעשים',
    career: 'רפואה, אנליזה, ניהול איכות' },
  { sign: 'מאזניים', en: 'Libra', from: [9, 23], to: [10, 22], element: 'אוויר', ruler: 'נוגה',
    personality: 'דיפלומטי, אסתטי, חברתי', strengths: ['הגינות', 'שיתוף פעולה', 'טאקט'],
    challenges: ['חוסר החלטיות', 'הימנעות מעימות', 'תלות בזולת'], love: 'רומנטי ומחפש הרמוניה',
    career: 'משפטים, עיצוב, דיפלומטיה' },
  { sign: 'עקרב', en: 'Scorpio', from: [10, 23], to: [11, 21], element: 'מים', ruler: 'פלוטו/מאדים',
    personality: 'עז, מסתורי, נחוש', strengths: ['עוצמה', 'נאמנות', 'תובנה'],
    challenges: ['קנאה', 'חשדנות', 'נקמנות'], love: 'עמוק ואינטנסיבי, זקוק לאמון מוחלט',
    career: 'חקירה, פסיכולוגיה, פיננסים' },
  { sign: 'קשת', en: 'Sagittarius', from: [11, 22], to: [12, 21], element: 'אש', ruler: 'צדק',
    personality: 'הרפתקן, אופטימי, פילוסופי', strengths: ['פתיחות', 'כנות', 'התלהבות'],
    challenges: ['חוסר טקט', 'חוסר סבלנות', 'התחייבות'], love: 'זקוק לחופש ולהרפתקה משותפת',
    career: 'חינוך, תיירות, פרסום' },
];

function findZodiac(month, day) {
  return ZODIAC.find(({ from, to }) => {
    if (from[0] === to[0]) return month === from[0] && day >= from[1] && day <= to[1];
    return (month === from[0] && day >= from[1]) || (month === to[0] && day <= to[1]);
  });
}

/**
 * GET /api/zodiac?date=YYYY-MM-DD
 * Deterministic Western-zodiac lookup (sign, element, ruler, short
 * personality/love/career notes) for the "astrology_tool" used by JARVIS
 * chat. The full rich interpretation engine lives client-side in the
 * Astrology tab (tools/astrology.html); this is just enough for JARVIS
 * to answer quick questions in the chat.
 */
app.get('/api/zodiac', (req, res) => {
  try {
    const d = parseDate(req.query.date);
    const z = findZodiac(d.getMonth() + 1, d.getDate());
    if (!z) return res.status(500).json({ error: 'Could not resolve zodiac sign' });
    const { from, to, ...info } = z;
    res.json({ date: d.toISOString().slice(0, 10), ...info });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`JARVIS Hub server listening on http://localhost:${PORT}`);
  console.log(`  Portal:        http://localhost:${PORT}/`);
  console.log(`  Hebrew date:   http://localhost:${PORT}/api/hebrew-date?date=2026-08-28`);
  console.log(`  Holidays:      http://localhost:${PORT}/api/holidays`);
});
