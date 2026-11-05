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

const hhmm = (m) => String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0') + ':' + String(((m % 60) + 60) % 60).padStart(2, '0');

export function marketStatus(now = new Date()) {
  const ny = part(now, 'America/New_York'), bo = part(now, 'America/Bogota');
  const weekend = ny.weekday === 'Sat' || ny.weekday === 'Sun';
  const holiday = HOLIDAYS.has(ny.date);
  const close = EARLY_CLOSE.has(ny.date) ? 13 * 60 : 16 * 60;
  const openMin = 9 * 60 + 30;
  const tradingDay = !weekend && !holiday;
  const open = tradingDay && ny.minutes >= openMin && ny.minutes < close;
  const shift = ((bo.minutes - ny.minutes + 1440 + 720) % 1440) - 720; // minutos Bogota - Nueva York (0 o -60)
  const out = { date: ny.date, tradingDay, open, holiday: holiday || null, knownYear: /^202[67]/.test(ny.date),
    session: { open: hhmm(openMin + shift), close: hhmm(close + shift) } };
  if (open) out.closesInMin = close - ny.minutes;
  else if (tradingDay && ny.minutes < openMin) { out.opensInMin = openMin - ny.minutes; out.nextOpen = { date: ny.date, days: 0 }; }
  else {
    for (let k = 1; k <= 10; k++) {
      const d = part(new Date(now.getTime() + k * 86400000), 'America/New_York');
      if (d.weekday !== 'Sat' && d.weekday !== 'Sun' && !HOLIDAYS.has(d.date)) { out.nextOpen = { date: d.date, days: k }; break; }
    }
  }
  return out;
}

export const bogota = (now = new Date(), opts = { dateStyle: 'short', timeStyle: 'short' }) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', ...opts }).format(now);
