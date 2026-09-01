// Native Vercel serverless function (not wrapped in Express — a plain
// `export default` handler is Vercel's own, well-supported convention,
// used here instead of the earlier Express-wrapper approach which
// crashed at runtime on Vercel with FUNCTION_INVOCATION_FAILED).
//
// GET /api/hebrew-date?date=YYYY-MM-DD
// Hebrew date, Shabbat/Rosh-Chodesh flags, holidays and parsha for one day.
import { HDate, HebrewCalendar, getSedra, Locale } from '@hebcal/core';

function parseDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: "${value}". Use YYYY-MM-DD.`);
  }
  return d;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

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

    res.status(200).json({
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
}
