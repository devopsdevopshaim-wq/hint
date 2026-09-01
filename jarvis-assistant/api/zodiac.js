// GET /api/zodiac?date=YYYY-MM-DD
// Deterministic Western-zodiac lookup for the "astrology_tool" used by
// JARVIS chat. See api/hebrew-date.js for why this is a plain Vercel
// function instead of an Express route.

function parseDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: "${value}". Use YYYY-MM-DD.`);
  }
  return d;
}

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

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const d = parseDate(req.query.date);
    const z = findZodiac(d.getMonth() + 1, d.getDate());
    if (!z) return res.status(500).json({ error: 'Could not resolve zodiac sign' });
    const { from, to, ...info } = z;
    res.status(200).json({ date: d.toISOString().slice(0, 10), ...info });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
