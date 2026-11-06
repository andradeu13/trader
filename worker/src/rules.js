// Cuando suena un push. Funcion pura: (analisis, estado previo, posiciones) -> alertas.
// Una alerta es informacion, nunca una orden. El usuario decide y ejecuta a mano en XTB.
import { xtbSymbol } from './yahoo.js';

const money = (x) => (x === null || x === undefined ? 'n/d' : '$' + x.toFixed(2));

export function evaluate(a, prev = {}, position = null, { date, confirm = false } = {}) {
  const alerts = [], sent = { ...(prev.sent || {}) };
  const next = { sent };
  for (const k of Object.keys(sent)) if (!k.endsWith(date)) delete sent[k]; // solo se recuerda el dia de hoy
  const sym = `${a.symbol} (XTB: ${a.xtb || xtbSymbol(a.symbol)})`;
  const push = (key, title, body, priority, tags) => {
    const id = `${key}:${date}`;
    if (sent[id]) return;
    sent[id] = true;
    alerts.push({ id, symbol: a.symbol, title, body, priority, tags });
  };
  // el cambio de veredicto se confirma en 2 lecturas seguidas (la vela de hoy puede estar abierta)
  const cand = prev.cand && prev.cand.kind === a.kind ? { kind: a.kind, n: prev.cand.n + 1 } : { kind: a.kind, n: 1 };
  next.cand = cand;
  const stable = confirm || cand.n >= 2;
  // `kind`/`inBuy` guardan el ultimo estado CONFIRMADO; solo cambian cuando la lectura es estable
  next.kind = stable ? a.kind : prev.kind;
  next.inBuy = stable ? a.buy_plan.price_is_in_buy_zone : prev.inBuy;
  const bp = a.buy_plan, sp = a.sell_plan;
  if (stable && a.kind === 'buy' && prev.kind !== 'buy') {
    push(`${a.symbol}:buy`, `🟢 COMPRA a revisar: ${sym}`,
      `${a.verdict} (puntaje ${a.score >= 0 ? '+' : ''}${a.score}). Precio ${money(a.price)}.\nZona ${money(bp.buy_zone[0])}–${money(bp.buy_zone[1])} · stop ${money(bp.stop)} · objetivo ${money(bp.target1)} (R:R ${bp.rr_target1 ?? 'n/d'}).\nRevisa spread/swap en XTB. No es consejo financiero.`, 4, ['green_circle', 'chart_with_upwards_trend']);
  }
  if (stable && a.kind === 'sell' && prev.kind !== 'sell') {
    push(`${a.symbol}:sell`, `🔴 VENTA/REDUCIR a revisar: ${sym}`,
      `${a.verdict} (puntaje ${a.score}). Precio ${money(a.price)}.\nZona de venta ${money(sp.sell_zone[0])}–${money(sp.sell_zone[1])} · stop de seguimiento ${money(sp.trailing_stop)}.\nNo es consejo financiero.`, 4, ['red_circle', 'chart_with_downwards_trend']);
  }
  if (stable && a.buy_plan.price_is_in_buy_zone && !prev.inBuy && a.score >= 1 && a.kind !== 'buy' && (bp.rr_target1 ?? 0) >= 1.5) {
    push(`${a.symbol}:buyzone`, `🟡 Entró a su zona de compra: ${sym}`,
      `Precio ${money(a.price)} dentro de ${money(bp.buy_zone[0])}–${money(bp.buy_zone[1])}. Puntaje ${a.score >= 0 ? '+' : ''}${a.score}, R:R ${bp.rr_target1}. Espera una vela de confirmación.`, 3, ['yellow_circle']);
  }
  // corto plazo: avisa UNA vez cuando el setup se activa en un activo donde la regla ha funcionado en el historial
  const st = a.short && a.short.ok ? a.short : null, live = !!(st && st.now.active && st.bt.edge === 'hist');
  next.sn = live ? (prev.sn || 0) + 1 : 0;
  next.sdone = live ? !!prev.sdone : false;
  if (live && !prev.sdone && (confirm || next.sn >= 2)) {
    next.sdone = true;
    push(`${a.symbol}:short`, `⚡ Setup de corto plazo: ${sym}`,
      `Retroceso en tendencia alcista que ya gira. Entrada ref. ${money(st.now.entry)} · stop ${money(st.now.stop)} · objetivo ${money(st.now.target)} (2 a 1, máx. 10 sesiones).\nHistorial de esta regla aquí: ${st.bt.n} operaciones, ${Math.round(st.bt.winRate * 100)}% aciertos, ${st.bt.avgR >= 0 ? '+' : ''}${st.bt.avgR}R por operación. Sin garantías.${a.cfd ? '\nEs un CFD: revisa apalancamiento, spread y swap.' : ''}`, 4, ['zap']);
  }
  if (position && position.shares > 0) {
    if (position.stop && a.price <= position.stop) push(`${a.symbol}:stop`, `🛑 STOP tocado: ${sym}`,
      `Precio ${money(a.price)} ≤ tu stop ${money(position.stop)} (entrada ${money(position.entry)}). Tu plan dice salir. Ejecútalo a mano en XTB.`, 5, ['rotating_light']);
    if (position.target && a.price >= position.target) push(`${a.symbol}:target`, `🎯 OBJETIVO alcanzado: ${sym}`,
      `Precio ${money(a.price)} ≥ objetivo ${money(position.target)}. Considera tomar ganancias o subir el stop.`, 4, ['dart']);
    if (a.kind === 'sell' && !(position.stop && a.price <= position.stop)) push(`${a.symbol}:posweak`, `⚠️ Tu posición se debilita: ${sym}`,
      `${a.verdict}. Precio ${money(a.price)}, stop de seguimiento sugerido ${money(sp.trailing_stop)}.`, 3, ['warning']);
  }
  return { alerts, next };
}
