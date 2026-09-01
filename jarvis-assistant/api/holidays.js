// GET /api/holidays?start=YYYY-MM-DD&end=YYYY-MM-DD
// Holidays and parshiot in a Gregorian date range (defaults to the next
// year from today). See api/hebrew-date.js for why this is a plain
// Vercel function instead of an Express route.
import { HebrewCalendar, Location } from '@hebcal/core';

function parseDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: "${value}". Use YYYY-MM-DD.`);
  }
  return d;
}

const ISRAEL = new Location(31.7683, 35.2137, true, 'Asia/Jerusalem', 'Jerusalem', 'IL');

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

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

    res.status(200).json(
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
}
