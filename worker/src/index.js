import { analyze } from './coach.js';
import { fetchCandles } from './yahoo.js';
import { evaluate } from './rules.js';
import { sendPush } from './push.js';
import { marketStatus, bogota } from './market.js';
import { DASHBOARD_HTML, MANIFEST, ICON_SVG } from './dashboard.js';

const MAX_TICKERS = 25;
const SYM = /^[A-Z0-9][A-Z0-9.\-]{0,9}$/;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

// ---- seguridad -------------------------------------------------------
async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const A = new Uint8Array(x), B = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < A.length; i++) d |= A[i] ^ B[i];
  return d === 0;
}
async function authorized(req, env) {
  if (!env.DASH_PASSWORD) return 'missing';
  const h = req.headers.get('Authorization') || '';
  if (!h.startsWith('Basic ')) return false;
  let pw = '';
  try { const dec = atob(h.slice(6)); pw = dec.slice(dec.indexOf(':') + 1); } catch { return false; }
  return safeEqual(pw, env.DASH_PASSWORD);
}

// ---- estado ------------------------------------------------------------
async function getCfg(env) {
  const saved = (await env.STATE.get('cfg', 'json')) || {};
  const wl = saved.watchlist || (env.WATCHLIST || 'AAPL,KO,BAC,AXP,GOOGL').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  return { watchlist: wl, positions: saved.positions || {},
    account: saved.account ?? (env.ACCOUNT ? +env.ACCOUNT : null), riskPct: saved.riskPct ?? (env.RISK_PCT ? +env.RISK_PCT : 1) };
}

async function mapLimit(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

export async function run(env, mode, now = new Date()) {
  const mk = marketStatus(now);
  if (mode === 'intraday' && !mk.open) return { skipped: 'mercado cerrado' };
  if ((mode === 'preopen' || mode === 'postclose') && !mk.tradingDay) return { skipped: mk.holiday ? `feriado NYSE (${mk.holiday})` : 'fin de semana' };
  const cfg = await getCfg(env);
  const tickers = [...new Set([...cfg.watchlist, ...Object.keys(cfg.positions)])].slice(0, MAX_TICKERS);
  const closedOnly = mode === 'preopen' || mode === 'postclose';
  const snap = (await env.STATE.get('snapshot', 'json')) || { items: {} };
  const alertState = (await env.STATE.get('alerts', 'json')) || {};
  const errors = {}, items = {};
  await mapLimit(tickers, 4, async (s) => {
    try {
      items[s] = analyze(s, await fetchCandles(s), { account: cfg.account, riskPct: cfg.riskPct, closedOnly, now: now.getTime() });
    } catch (e) { errors[s] = String(e.message || e); if (snap.items[s]) items[s] = { ...snap.items[s], stale: true }; }
  });
  const toSend = [];
  for (const s of tickers) {
    if (!items[s] || items[s].stale) continue;
    const { alerts, next } = evaluate(items[s], alertState[s] || {}, cfg.positions[s] || null, { date: mk.date, confirm: closedOnly });
    alertState[s] = next;
    toSend.push(...alerts);
  }
  for (const s of Object.keys(alertState)) if (!tickers.includes(s)) delete alertState[s];
  const pushes = [];
  if (mode !== 'manual') {
    for (const a of toSend) pushes.push({ id: a.id, ...(await sendPush(env, { ...a, click: env.DASH_URL })) });
    if (closedOnly) {
      const ok = Object.values(items).filter((x) => !x.stale);
      const buys = ok.filter((x) => x.kind === 'buy' || x.buy_plan.price_is_in_buy_zone).map((x) => x.symbol);
      const sells = ok.filter((x) => x.kind === 'sell' || x.sell_plan.price_is_in_sell_zone).map((x) => x.symbol);
      pushes.push({ id: 'summary', ...(await sendPush(env, {
        title: mode === 'preopen' ? '☀️ Coach: pre-apertura' : '🌙 Coach: post-cierre',
        body: `En zona de compra: ${buys.join(', ') || 'ninguno'}\nEn zona de venta: ${sells.join(', ') || 'ninguno'}\n${bogota(now)} hora Bogotá. No es consejo financiero.`, priority: 2, tags: ['bar_chart'], click: env.DASH_URL })) });
    }
  }
  await env.STATE.put('snapshot', JSON.stringify({ updated: now.toISOString(), mode, items, errors }));
  await env.STATE.put('alerts', JSON.stringify(alertState));
  return { updated: now.toISOString(), tickers: tickers.length, errors, pushes };
}

// ---- HTTP -----------------------------------------------------------------
async function handleApi(req, env, url) {
  const m = req.method, p = url.pathname;
  if (m === 'GET' && p === '/api/state') {
    const [cfg, snap] = await Promise.all([getCfg(env), env.STATE.get('snapshot', 'json')]);
    const mk = marketStatus();
    return json({ cfg, snapshot: snap || { items: {}, errors: {} }, market: mk, now: new Date().toISOString(),
      push: { ntfy: !!env.NTFY_TOPIC, telegram: !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) } });
  }
  if (m !== 'POST' && m !== 'DELETE') return json({ error: 'no encontrado' }, 404);
  // anti-CSRF: Basic auth viaja solo en el navegador; exigimos cabecera propia y mismo origen
  const origin = req.headers.get('Origin');
  if (req.headers.get('X-Requested-With') !== 'dashboard' || (origin && origin !== url.origin)) return json({ error: 'solicitud rechazada' }, 403);
  const body = m === 'POST' ? await req.json().catch(() => ({})) : {};
  const cfg = await getCfg(env);
  if (m === 'POST' && p === '/api/refresh') return json(await run(env, 'manual'));
  if (m === 'POST' && p === '/api/test-push') return json(await sendPush(env, { title: '✅ Prueba del coach', body: 'Si ves esto, los pushes funcionan.', priority: 3, tags: ['white_check_mark'], click: env.DASH_URL }));
  if (m === 'POST' && p === '/api/config') {
    const wl = [...new Set((body.watchlist || cfg.watchlist).map((s) => String(s).trim().toUpperCase().replace(/\.US$/, '')))];
    if (wl.some((s) => !SYM.test(s))) return json({ error: 'ticker inválido' }, 400);
    if (wl.length > MAX_TICKERS) return json({ error: `máximo ${MAX_TICKERS} tickers` }, 400);
    const account = body.account === '' || body.account == null ? null : +body.account;
    const riskPct = body.riskPct == null ? cfg.riskPct : +body.riskPct;
    if ((account !== null && !(account > 0)) || !(riskPct > 0 && riskPct <= 5)) return json({ error: 'cuenta o riesgo inválidos (riesgo 0–5 %)' }, 400);
    await env.STATE.put('cfg', JSON.stringify({ ...cfg, watchlist: wl, account, riskPct }));
    return json({ ok: true });
  }
  if (m === 'POST' && p === '/api/positions') {
    const s = String(body.symbol || '').trim().toUpperCase().replace(/\.US$/, '');
    const n = (x) => (x === '' || x == null ? null : +x);
    const pos = { entry: n(body.entry), stop: n(body.stop), target: n(body.target), shares: n(body.shares) };
    if (!SYM.test(s) || !(pos.shares > 0) || !(pos.entry > 0) || [pos.stop, pos.target].some((x) => x !== null && !(x > 0))) return json({ error: 'posición inválida (ticker, acciones y entrada son obligatorios)' }, 400);
    if (Object.keys(cfg.positions).length >= MAX_TICKERS && !cfg.positions[s]) return json({ error: 'demasiadas posiciones' }, 400);
    cfg.positions[s] = pos;
    await env.STATE.put('cfg', JSON.stringify(cfg));
    return json({ ok: true });
  }
  if (m === 'DELETE' && p === '/api/positions') {
    delete cfg.positions[(url.searchParams.get('symbol') || '').toUpperCase()];
    await env.STATE.put('cfg', JSON.stringify(cfg));
    return json({ ok: true });
  }
  return json({ error: 'no encontrado' }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const auth = await authorized(req, env);
    if (auth === 'missing') return new Response('Falta el secreto DASH_PASSWORD. Ejecuta: npx wrangler secret put DASH_PASSWORD', { status: 503 });
    if (!auth) return new Response('Autenticación requerida', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Trader Coach", charset="UTF-8"' } });
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(req, env, url);
      if (req.method === 'GET' && url.pathname === '/') {
        return new Response(DASHBOARD_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
          'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
      }
      if (req.method === 'GET' && url.pathname === '/manifest.webmanifest') return new Response(JSON.stringify(MANIFEST), { headers: { 'Content-Type': 'application/manifest+json' } });
      if (req.method === 'GET' && url.pathname === '/icon.svg') return new Response(ICON_SVG, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' } });
      return new Response('No encontrado', { status: 404 });
    } catch (e) { return json({ error: String(e.message || e) }, 500); }
  },
  async scheduled(event, env, ctx) {
    const mode = event.cron.startsWith('40 12') ? 'preopen' : event.cron.startsWith('20 22') ? 'postclose' : 'intraday';
    ctx.waitUntil(run(env, mode, new Date(event.scheduledTime)));
  },
};
