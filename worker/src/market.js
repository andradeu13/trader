// Reloj NYSE (mismos feriados que .claude/skills/trader-alerts/alerts.py) y hora de Bogota.
export const HOLIDAYS = new Set([
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24',
]);
export const EARLY_CLOSE = new Set(['2026-11-27', '2026-12-24', '2027-11-26']); // cierre 13:00 ET

const part = (d, tz) => {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(d);
  const o = Object.fromEntries(f.map((p) => [p.type, p.value]));
  return { date: `${o.year}-${o.month}-${o.day}`, minutes: (+o.hour % 24) * 60 + +o.minute, weekday: o.weekday };
};

export function marketStatus(now = new Date()) {
  const ny = part(now, 'America/New_York');
  const weekend = ny.weekday === 'Sat' || ny.weekday === 'Sun';
  const holiday = HOLIDAYS.has(ny.date);
  const close = EARLY_CLOSE.has(ny.date) ? 13 * 60 : 16 * 60;
  const tradingDay = !weekend && !holiday;
  return { date: ny.date, tradingDay, open: tradingDay && ny.minutes >= 9 * 60 + 30 && ny.minutes < close,
    holiday: holiday || null, knownYear: /^202[67]/.test(ny.date) };
}

export const bogota = (now = new Date(), opts = { dateStyle: 'short', timeStyle: 'short' }) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', ...opts }).format(now);
