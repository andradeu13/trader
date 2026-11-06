// Velas de Yahoo (gratis, con retraso, no oficial). Una peticion por ticker.
// Indices de XTB (CFD) -> simbolo de Yahoo con velas diarias. El resto son acciones de EEUU (AAPL.US en XTB).
export const INDEX_ALIASES = { US100: '^NDX', US500: '^GSPC', US30: '^DJI', DE40: '^GDAXI', GOLD: 'GC=F' };
export const isCfd = (s) => Object.prototype.hasOwnProperty.call(INDEX_ALIASES, String(s).toUpperCase());
export const yahooSymbol = (s) => INDEX_ALIASES[String(s).toUpperCase()] || String(s).toUpperCase().replace('.', '-');
export const xtbSymbol = (s) => (isCfd(s) || s.includes('.') ? s : s + '.US');

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
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol(sym))}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; trader-coach/1.0)' } });
  if (!res.ok) throw new Error(`${sym}: Yahoo respondió ${res.status}`);
  return parseChart(await res.json(), sym);
}
