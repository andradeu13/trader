// Corto plazo (swing de 2 a 10 sesiones): "comprar el retroceso dentro de una tendencia alcista".
// La regla es publica y simple a proposito; el backtest dice honestamente si le ha funcionado a CADA activo.
// No es una promesa de ganancias: el pasado no garantiza nada y la muestra suele ser chica.
import { sma, rsi, atr } from './coach.js';

export const RULE = { stopAtr: 1.5, targetAtr: 3, maxHold: 10, costR: 0.05, minTrades: 8 };
const LABELS = [
  ['trend', 'Tendencia alcista: precio sobre la media de 50 y la de 50 sobre la de 200'],
  ['dip', 'Hubo retroceso: el RSI cayó bajo 45 en los últimos 5 días'],
  ['turn', 'Ya gira: el RSI sube y hoy cierra por encima del cierre de ayer'],
  ['room', 'Sin persecución: el RSI sigue bajo 60 (todavía hay recorrido)'],
];

function conds(c, s50, s200, r, i) {
  const rr = [r[i - 4], r[i - 3], r[i - 2], r[i - 1], r[i]];
  if (s200[i] === null || rr.some((x) => x === null || x === undefined)) return null;
  return {
    trend: c[i] > s50[i] && s50[i] > s200[i],
    dip: Math.min(...rr) < 45,
    turn: r[i] > r[i - 1] && c[i] > c[i - 1],
    room: r[i] < 60,
  };
}

export function shortTerm(cs) {
  if (cs.length < 230) return { ok: false, reason: `faltan velas (${cs.length}); hacen falta ~230 para la media de 200` };
  const c = cs.map((x) => x.c), s50 = sma(c, 50), s200 = sma(c, 200), r = rsi(c), at = atr(cs);
  const trades = [];
  for (let i = 205; i < cs.length - 1; i++) {
    const k = conds(c, s50, s200, r, i);
    if (!k || !(k.trend && k.dip && k.turn && k.room) || !at[i]) continue;
    const entry = cs[i + 1].o, a = at[i], stop = entry - RULE.stopAtr * a, target = entry + RULE.targetAtr * a, risk = entry - stop;
    let out = null;
    for (let j = i + 1; j <= Math.min(i + RULE.maxHold, cs.length - 1); j++) {
      if (cs[j].l <= stop) { out = { j, px: Math.min(stop, cs[j].o), why: 'stop' }; break; } // si abre bajo el stop, sale a la apertura
      if (cs[j].h >= target) { out = { j, px: target, why: 'objetivo' }; break; }
      if (j === i + RULE.maxHold) out = { j, px: cs[j].c, why: 'tiempo' };
    }
    if (!out) break; // operacion aun abierta al final de los datos: no cuenta
    trades.push({ t: cs[i + 1].t, r: (out.px - entry) / risk - RULE.costR, why: out.why });
    i = out.j; // sin operaciones superpuestas
  }
  const n = trades.length, rs = trades.map((t) => t.r), wins = rs.filter((x) => x > 0).length;
  const gain = rs.filter((x) => x > 0).reduce((a, b) => a + b, 0), loss = -rs.filter((x) => x <= 0).reduce((a, b) => a + b, 0);
  let cum = 0, peak = 0, dd = 0;
  const curve = rs.map((x) => { cum += x; peak = Math.max(peak, cum); dd = Math.max(dd, peak - cum); return Math.round(cum * 100) / 100; });
  const avgR = n ? cum / n : 0, winRate = n ? wins / n : 0;
  const edge = n < RULE.minTrades ? 'small' : avgR >= 0.15 && winRate >= 0.4 ? 'hist' : avgR > 0 ? 'marginal' : 'none';
  const i = cs.length - 1, k = conds(c, s50, s200, r, i) || { trend: false, dip: false, turn: false, room: false };
  const entry = c[i], a = at[i];
  return {
    ok: true,
    now: { active: k.trend && k.dip && k.turn && k.room, met: Object.values(k).filter(Boolean).length,
      conds: LABELS.map(([key, label]) => ({ key, label, ok: !!k[key] })),
      entry: Math.round(entry * 100) / 100, stop: Math.round((entry - RULE.stopAtr * a) * 100) / 100, target: Math.round((entry + RULE.targetAtr * a) * 100) / 100,
      atr: Math.round(a * 100) / 100 },
    bt: { n, wins, winRate: Math.round(winRate * 1000) / 1000, avgR: Math.round(avgR * 100) / 100, totalR: Math.round(cum * 100) / 100,
      pf: loss > 0 ? Math.round(gain / loss * 100) / 100 : null, maxDD: Math.round(dd * 100) / 100, edge, curve,
      last: trades.slice(-6).map((t) => ({ t: t.t, r: Math.round(t.r * 100) / 100, why: t.why })),
      from: new Date(cs[0].t * 1000).toISOString().slice(0, 10), to: new Date(cs[cs.length - 1].t * 1000).toISOString().slice(0, 10) },
  };
}
