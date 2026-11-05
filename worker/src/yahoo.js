// Velas de Yahoo (gratis, con retraso, no oficial). Una peticion por ticker.
export const xtbSymbol = (s) => (s.includes('.') ? s : s + '.US');

export function parseChart(doc, sym) {
  const r = doc?.chart?.result?.[0];
  if (!r) throw new Error(`${sym}: sin datos (${doc?.chart?.error?.description ?? 'respuesta vacía'})`);
  const q = r.indicators.quote[0], out = [];
  (r.timestamp ?? []).forEach((t, i) => {
    const [o, h, l, c] = [q.open[i], q.high[i], q.low[i], q.close[i]];
    if ([o, h, l, c].some((x) => x === null || x === undefined)) return;
    out.push({ t, o, h, l, c, v: q.volume?.[i] ?? 0 });
  });
  if (!out.length) throw new Error(`${sym}: ninguna vela válida`);
  return out;
}

export async function fetchCandles(sym, range = '1y', interval = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym.toUpperCase().replace('.', '-'))}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; trader-coach/1.0)' } });
  if (!res.ok) throw new Error(`${sym}: Yahoo respondió ${res.status}`);
  return parseChart(await res.json(), sym);
}
