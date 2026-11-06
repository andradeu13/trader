// Puerto a JavaScript de .claude/skills/trader-coach/coach.py (mismos calculos, mismas reglas).
// Educacion y aritmetica; no es consejo financiero. Nada aqui coloca ordenes.

export const sma = (v, n) => {
  const out = Array(v.length).fill(null);
  let s = 0;
  v.forEach((x, i) => {
    s += x;
    if (i >= n) s -= v[i - n];
    if (i >= n - 1) out[i] = s / n;
  });
  return out;
};

export const ema = (v, n) => {
  const out = Array(v.length).fill(null);
  if (v.length < n) return out;
  const k = 2 / (n + 1);
  let e = v.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = e;
  for (let i = n; i < v.length; i++) { e = v[i] * k + e * (1 - k); out[i] = e; }
  return out;
};

export const rsi = (c, n = 14) => {
  const out = Array(c.length).fill(null);
  if (c.length <= n) return out;
  let g = 0, l = 0;
  for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; g += Math.max(d, 0); l += Math.max(-d, 0); }
  let ag = g / n, al = l / n;
  out[n] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = n + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    ag = (ag * (n - 1) + Math.max(d, 0)) / n;
    al = (al * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
};

export const atr = (cs, n = 14) => {
  const out = Array(cs.length).fill(null);
  if (cs.length <= n) return out;
  const trs = cs.map((c, i) => {
    if (i === 0) return c.h - c.l;
    const pc = cs[i - 1].c;
    return Math.max(c.h - c.l, Math.abs(c.h - pc), Math.abs(c.l - pc));
  });
  let a = trs.slice(1, n + 1).reduce((x, y) => x + y, 0) / n;
  out[n] = a;
  for (let i = n + 1; i < cs.length; i++) { a = (a * (n - 1) + trs[i]) / n; out[i] = a; }
  return out;
};

export const macd = (c, fast = 12, slow = 26, sig = 9) => {
  const ef = ema(c, fast), es = ema(c, slow);
  const line = ef.map((a, i) => (a === null || es[i] === null ? null : a - es[i]));
  const valid = line.filter((x) => x !== null);
  const sg = ema(valid, sig);
  let j = 0;
  const signal = line.map((x) => (x === null ? null : sg[j++]));
  const hist = line.map((a, i) => (a === null || signal[i] === null ? null : a - signal[i]));
  return [line, signal, hist];
};

export const bollinger = (c, n = 20, k = 2) => {
  const mid = sma(c, n);
  const up = Array(c.length).fill(null), lo = Array(c.length).fill(null);
  for (let i = n - 1; i < c.length; i++) {
    const w = c.slice(i - n + 1, i + 1), m = mid[i];
    const sd = Math.sqrt(w.reduce((s, x) => s + (x - m) ** 2, 0) / n);
    up[i] = m + k * sd; lo[i] = m - k * sd;
  }
  return [lo, mid, up];
};

export const anatomy = (c) => {
  const rng = c.h - c.l, body = Math.abs(c.c - c.o);
  const top = Math.max(c.o, c.c), bot = Math.min(c.o, c.c);
  const upper = c.h - top, lower = bot - c.l, d = rng > 0 ? rng : 1e-9;
  return { range: rng, body, upper, lower, body_pct: body / d, upper_pct: upper / d, lower_pct: lower / d,
    color: c.c > c.o ? 'verde' : c.c < c.o ? 'roja' : 'neutra' };
};

const trendBefore = (cs, i, n = 5) => {
  if (i < n) return 'lateral';
  const a = cs[i - n].c, b = cs[i - 1].c, ch = a ? (b - a) / a : 0;
  return ch > 0.02 ? 'sube' : ch < -0.02 ? 'baja' : 'lateral';
};

export const detectPatterns = (cs, i) => {
  const out = [], c = cs[i], a = anatomy(c);
  const prev = i >= 1 ? cs[i - 1] : null, pa = prev ? anatomy(prev) : null;
  const tr = trendBefore(cs, i), small = a.body_pct <= 0.30;
  const P = (name, bias, why) => out.push({ name, bias, why });
  if (a.body_pct <= 0.10 && a.range > 0) P('Doji', 'indecision', 'Abrió y cerró casi igual: compradores y vendedores empataron. Importa dónde aparece.');
  if (small && a.lower_pct >= 0.60 && a.upper_pct <= 0.15) {
    if (tr === 'baja') P('Martillo', 'alcista', 'Tras una caída, los vendedores empujaron abajo pero los compradores devolvieron el precio arriba (mecha inferior larga). Posible suelo.');
    else if (tr === 'sube') P('Hombre colgado', 'bajista', 'Tras una subida, la mecha inferior larga avisa de que ya hay vendedores. Necesita confirmación.');
  }
  if (small && a.upper_pct >= 0.60 && a.lower_pct <= 0.15) {
    if (tr === 'sube') P('Estrella fugaz', 'bajista', 'Tras una subida, el precio subió mucho pero los vendedores lo devolvieron (mecha superior larga). Posible techo.');
    else if (tr === 'baja') P('Martillo invertido', 'alcista', 'Tras una caída, los compradores intentaron subir. Necesita confirmación.');
  }
  if (a.body_pct >= 0.90 && a.range > 0) P('Marubozu ' + a.color, a.color === 'verde' ? 'alcista' : 'bajista', 'Casi sin mechas: un solo bando mandó toda la sesión. Es fuerza, no agotamiento.');
  if (prev && pa.body > 0 && a.body > 0) {
    const pu = prev.c > prev.o, pd = prev.c < prev.o, cu = c.c > c.o, cd = c.c < c.o;
    if (pd && cu && c.o <= prev.c && c.c >= prev.o && a.body > pa.body) P('Envolvente alcista', 'alcista', 'Una vela verde cubre por completo el cuerpo de la roja anterior: los compradores tomaron el control.');
    if (pu && cd && c.o >= prev.c && c.c <= prev.o && a.body > pa.body) P('Envolvente bajista', 'bajista', 'Una vela roja cubre por completo el cuerpo de la verde anterior: los vendedores tomaron el control.');
    const mid = (prev.o + prev.c) / 2;
    if (pd && cu && c.o < prev.c && mid < c.c && c.c < prev.o && pa.body_pct > 0.5) P('Línea penetrante', 'alcista', 'Abre con hueco a la baja y recupera más de la mitad de la vela roja anterior.');
    if (pu && cd && c.o > prev.c && prev.o < c.c && c.c < mid && pa.body_pct > 0.5) P('Nube oscura', 'bajista', 'Abre con hueco al alza y devuelve más de la mitad de la vela verde anterior.');
    if (c.h < prev.h && c.l > prev.l) P('Barra interior', 'indecision', 'Toda la vela cabe dentro de la anterior: el precio se comprime antes de una salida. Opera la ruptura, no la espera.');
  }
  if (i >= 2) {
    const p2 = cs[i - 2], p1 = cs[i - 1], a2 = anatomy(p2), a1 = anatomy(p1);
    if (p2.c < p2.o && a2.body_pct > 0.5 && a1.body_pct < 0.3 && c.c > c.o && c.c > (p2.o + p2.c) / 2) P('Estrella de la mañana', 'alcista', 'Roja grande, vela pequeña de duda, verde grande: giro de bajista a alcista en tres tiempos.');
    if (p2.c > p2.o && a2.body_pct > 0.5 && a1.body_pct < 0.3 && c.c < c.o && c.c < (p2.o + p2.c) / 2) P('Estrella de la tarde', 'bajista', 'Verde grande, vela pequeña de duda, roja grande: giro de alcista a bajista en tres tiempos.');
    const tri = cs.slice(i - 2, i + 1);
    if (tri.every((x) => x.c > x.o) && tri[0].c < tri[1].c && tri[1].c < tri[2].c && tri.every((x) => anatomy(x).body_pct > 0.5)) P('Tres soldados blancos', 'alcista', 'Tres verdes seguidas con cierres cada vez más altos: empuje comprador sostenido.');
    if (tri.every((x) => x.c < x.o) && tri[0].c > tri[1].c && tri[1].c > tri[2].c && tri.every((x) => anatomy(x).body_pct > 0.5)) P('Tres cuervos negros', 'bajista', 'Tres rojas seguidas con cierres cada vez más bajos: presión vendedora sostenida.');
  }
  return out;
};

export const swingPoints = (cs, w = 3) => {
  const highs = [], lows = [];
  for (let i = w; i < cs.length - w; i++) {
    const seg = cs.slice(i - w, i + w + 1);
    if (cs[i].h === Math.max(...seg.map((x) => x.h))) highs.push(cs[i].h);
    if (cs[i].l === Math.min(...seg.map((x) => x.l))) lows.push(cs[i].l);
  }
  return [highs, lows];
};

export const cluster = (pts, tol) => {
  const groups = [];
  [...pts].sort((a, b) => a - b).forEach((p) => {
    const g = groups[groups.length - 1];
    if (g && p - g[g.length - 1] <= tol) g.push(p); else groups.push([p]);
  });
  return groups.map((g) => ({ level: g.reduce((a, b) => a + b, 0) / g.length, touches: g.length }));
};

export const levels = (cs, atrNow) => {
  const price = cs[cs.length - 1].c, tol = Math.max(atrNow * 0.5, price * 0.003);
  const [h, l] = swingPoints(cs), all = cluster([...h, ...l], tol);
  return [all.filter((x) => x.level < price).sort((a, b) => b.level - a.level),
          all.filter((x) => x.level > price).sort((a, b) => a.level - b.level)];
};

const r2 = (x, nd = 2) => (x === null || x === undefined || Number.isNaN(x) ? null : Math.round(x * 10 ** nd) / 10 ** nd);
const last = (a) => a[a.length - 1];

export function dropLive(cs, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  return cs.length && new Date(cs[cs.length - 1].t * 1000).toISOString().slice(0, 10) === today && new Date(now).getUTCHours() < 21 ? cs.slice(0, -1) : cs;
}

export function analyze(symbol, candles, { account = null, riskPct = 1, closedOnly = false, now = Date.now() } = {}) {
  let cs = candles, live = false;
  const today = new Date(now).toISOString().slice(0, 10);
  if (cs.length && new Date(last(cs).t * 1000).toISOString().slice(0, 10) === today && new Date(now).getUTCHours() < 21) {
    live = true;
    if (closedOnly) cs = cs.slice(0, -1);
  }
  if (cs.length < 35) throw new Error(`${symbol}: faltan velas (${cs.length}); hacen falta al menos 35`);
  const closes = cs.map((c) => c.c), vols = cs.map((c) => c.v);
  const s20 = sma(closes, 20), s50 = sma(closes, 50), s200 = sma(closes, 200), e9 = ema(closes, 9);
  const rs = rsi(closes), at = atr(cs), [ml, ms, mh] = macd(closes), [bl, bm, bu] = bollinger(closes);
  const price = last(closes), aNow = last(at);
  const [sup, res] = levels(cs, aNow);
  const i = cs.length - 1, pats = detectPatterns(cs, i);
  let volRatio = null;
  if (vols.length > 21) { const avg = vols.slice(-21, -1).reduce((a, b) => a + b, 0) / 20; volRatio = avg ? last(vols) / avg : null; }
  const yr = cs.slice(-252), hi52 = Math.max(...yr.map((c) => c.h)), lo52 = Math.min(...yr.map((c) => c.l));

  let score = 0; const reasons = [];
  const add = (p, t) => { score += p; reasons.push({ points: p, text: t }); };
  if (last(s50) !== null) price > last(s50) ? add(1, 'Precio por encima de la media de 50 días (tendencia de corto/medio plazo alcista).') : add(-1, 'Precio por debajo de la media de 50 días (tendencia de corto/medio plazo bajista).');
  if (last(s200) !== null && last(s50) !== null) last(s50) > last(s200) ? add(1, 'Media de 50 por encima de la de 200 (tendencia grande alcista).') : add(-1, 'Media de 50 por debajo de la de 200 (tendencia grande bajista).');
  const rv = last(rs);
  if (rv !== null) { if (rv < 30) add(1, `RSI ${rv.toFixed(0)}: sobreventa. Ha caído mucho y rápido; zona donde suelen aparecer rebotes.`); else if (rv > 70) add(-1, `RSI ${rv.toFixed(0)}: sobrecompra. Ha subido mucho y rápido; riesgo de pausa o corrección.`); }
  const h1 = last(mh), h0 = mh[mh.length - 2];
  if (h1 !== null && h0 !== null) { if (h1 > 0 && h1 > h0) add(1, 'MACD positivo y creciendo: el impulso alcista se acelera.'); else if (h1 < 0 && h1 < h0) add(-1, 'MACD negativo y cayendo: el impulso bajista se acelera.'); }
  if (last(bl) !== null) { if (price < last(bl)) add(1, 'Precio bajo la banda de Bollinger inferior: estirado a la baja, posible rebote a la media.'); else if (price > last(bu)) add(-1, 'Precio sobre la banda de Bollinger superior: estirado al alza, posible retroceso a la media.'); }
  let nearSup = sup[0] && price - sup[0].level <= aNow ? sup[0] : null;
  let nearRes = res[0] && res[0].level - price <= aNow ? res[0] : null;
  if (nearSup && nearRes) { nearSup = nearRes = null; add(0, 'Soporte y resistencia a menos de 1 ATR de distancia: rango comprimido, el R:R es malo. Espera la ruptura.'); }
  if (nearSup) add(1, `Precio pegado a un soporte (${nearSup.level.toFixed(2)}, ${nearSup.touches} toques): zona lógica de compra con stop corto.`);
  if (nearRes) add(-1, `Precio pegado a una resistencia (${nearRes.level.toFixed(2)}, ${nearRes.touches} toques): zona lógica para vender o no perseguir.`);
  pats.forEach((p) => {
    if (p.bias === 'alcista') add(nearSup ? 2 : 1, `Vela/patrón ${p.name}${nearSup ? ' sobre soporte (mucho más fiable)' : ' (sin soporte cerca: fiabilidad media)'}.`);
    else if (p.bias === 'bajista') add(nearRes ? -2 : -1, `Vela/patrón ${p.name}${nearRes ? ' bajo resistencia (mucho más fiable)' : ' (sin resistencia cerca: fiabilidad media)'}.`);
  });
  const lc = last(cs);
  if (volRatio && volRatio >= 1.5 && lc.c !== lc.o) add(lc.c > lc.o ? 1 : -1, `Volumen ${volRatio.toFixed(1)}x el promedio: el movimiento de hoy tiene convicción.`);

  const buyLo = sup.length ? sup[0].level : price - aNow, buyHi = buyLo + 0.25 * aNow;
  const entry = price <= buyHi ? Math.min(price, buyHi) : buyHi;
  const stop = buyLo - 0.5 * aNow, risk = entry - stop, atHighs = res.length === 0;
  const r1 = res.length ? res[0].level : entry + 2 * risk;
  const plan = {
    buy_zone: [r2(buyLo), r2(buyHi)], entry: r2(entry), stop: r2(stop), target1: r2(r1), target2: r2(entry + 2 * risk),
    rr_target1: risk > 0 ? r2((r1 - entry) / risk) : null,
    price_is_in_buy_zone: buyLo - 0.1 * aNow <= price && price <= buyHi, no_resistance_above: atHighs,
  };
  let verdict, kind;
  const rr1 = plan.rr_target1;
  if (score >= 3 && rr1 !== null && !atHighs && rr1 < 1.5) { verdict = `COMPRA DÉBIL - R:R ${rr1.toFixed(1)} insuficiente, espera un retroceso`; kind = 'wait'; }
  else if (score >= 3 && atHighs) { verdict = 'FUERTE PERO EN MÁXIMOS - no persigas, espera retroceso'; kind = 'wait'; }
  else if (score >= 3) { verdict = 'ZONA DE COMPRA'; kind = 'buy'; }
  else if (score <= -3) { verdict = 'ZONA DE VENTA / REDUCIR'; kind = 'sell'; }
  else if (score >= 1) { verdict = 'SESGO ALCISTA - esperar mejor precio'; kind = 'wait'; }
  else if (score <= -1) { verdict = 'SESGO BAJISTA - no comprar todavía'; kind = 'wait'; }
  else { verdict = 'ESPERAR - sin ventaja clara'; kind = 'wait'; }
  if (account && risk > 0) {
    const shares = Math.floor((account * riskPct / 100) / risk), cap = entry > 0 ? Math.floor((account * 0.25) / entry) : 0, n = Math.min(shares, cap);
    plan.sizing = { account, risk_pct: riskPct, max_loss_usd: r2(shares * risk), shares_by_risk: shares, shares_capped_25pct: n, cost_usd: r2(n * entry) };
  }
  const sellHi = res.length ? res[0].level : Math.max(hi52, price), sellLo = sellHi - 0.25 * aNow;
  const sell = { sell_zone: [r2(sellLo), r2(sellHi)], trailing_stop: r2(Math.max(...closes.slice(-10)) - 2 * aNow), price_is_in_sell_zone: price >= sellLo };
  return {
    symbol: symbol.toUpperCase(), as_of: new Date(last(cs).t * 1000).toISOString().slice(0, 10),
    price: r2(price), change_pct: r2((price / closes[closes.length - 2] - 1) * 100),
    indicators: { sma20: r2(last(s20)), sma50: r2(last(s50)), sma200: r2(last(s200)), ema9: r2(last(e9)), rsi14: r2(rv, 1), atr14: r2(aNow),
      atr_pct: r2(aNow / price * 100), macd: r2(last(ml), 3), macd_signal: r2(last(ms), 3), macd_hist: r2(h1, 3),
      boll_low: r2(last(bl)), boll_mid: r2(last(bm)), boll_up: r2(last(bu)), volume_ratio: r2(volRatio), hi52: r2(hi52), lo52: r2(lo52) },
    last_candle: { ...anatomy(lc), o: lc.o, h: lc.h, l: lc.l, c: lc.c },
    patterns: pats, supports: sup.slice(0, 3).map((x) => ({ level: r2(x.level), touches: x.touches })),
    resistances: res.slice(0, 3).map((x) => ({ level: r2(x.level), touches: x.touches })),
    live_candle: live && !closedOnly, score, verdict, kind, reasons, buy_plan: plan, sell_plan: sell,
    candles: cs.slice(-120).map((c) => ({ t: c.t, o: c.o, h: c.h, l: c.l, c: c.c, v: c.v })),
    series: { sma20: s20.slice(-120).map((x) => r2(x)), sma50: s50.slice(-120).map((x) => r2(x)),
      bbl: bl.slice(-120).map((x) => r2(x)), bbu: bu.slice(-120).map((x) => r2(x)) },
  };
}
