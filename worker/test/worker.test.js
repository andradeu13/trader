import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { analyze, sma, rsi, atr, detectPatterns } from '../src/coach.js';
import { parseChart } from '../src/yahoo.js';
import { evaluate } from '../src/rules.js';
import { marketStatus } from '../src/market.js';
import worker, { run } from '../src/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = (s) => JSON.parse(readFileSync(path.join(here, 'fixtures', `yahoo-chart-${s}.json`), 'utf8'));
const NOW = Date.parse('2026-11-05T03:00:00Z'); // de noche: la ultima vela ya cerro

test('el JS da lo mismo que el coach.py (AAPL y KO, datos reales)', (t) => {
  const coachPy = path.join(here, '../../.claude/skills/trader-coach');
  for (const s of ['AAPL', 'KO']) {
    const py = spawnSync('python3', ['-c', `
import sys, json; sys.path.insert(0, ${JSON.stringify(coachPy)})
import coach
r = coach.analyze_series(coach.load_series(${JSON.stringify(s)}, offline=${JSON.stringify(path.join(here, 'fixtures'))}), account=5000, risk_pct=1)
print(json.dumps(r))`], { encoding: 'utf8' });
    if (py.status !== 0) return t.skip('python3 no disponible: ' + py.stderr);
    const p = JSON.parse(py.stdout), j = analyze(s, parseChart(fx(s), s), { account: 5000, riskPct: 1, now: NOW });
    assert.equal(j.score, p.score, s + ' puntaje');
    assert.equal(j.price, p.price);
    assert.deepEqual(j.indicators, p.indicators, s + ' indicadores');
    assert.deepEqual(j.supports, p.supports);
    assert.deepEqual(j.resistances, p.resistances);
    assert.deepEqual(j.buy_plan, p.buy_plan, s + ' plan de compra');
    delete p.sell_plan.break_even_stop_hint;
    assert.deepEqual(j.sell_plan, p.sell_plan, s + ' plan de venta');
    assert.deepEqual(j.patterns.map((x) => x.name.normalize('NFD').replace(/\p{M}/gu, '')), p.patterns.map((x) => x.name));
    assert.deepEqual(j.reasons.map((x) => x.points), p.reasons.map((x) => x.points));
  }
});

test('indicadores basicos', () => {
  assert.deepEqual(sma([1, 2, 3, 4], 2), [null, 1.5, 2.5, 3.5]);
  assert.equal(rsi(Array.from({ length: 40 }, (_, i) => i + 1)).at(-1), 100);
  assert.equal(atr(Array.from({ length: 30 }, () => ({ o: 10, h: 11, l: 9, c: 10 }))).at(-1), 2);
});

test('martillo tras caida', () => {
  const cs = Array.from({ length: 8 }, (_, i) => ({ o: 110 - i, h: 110.5 - i, l: 109 - i, c: 109.2 - i }));
  cs.push({ o: 101.5, h: 101.7, l: 99, c: 101.6 });
  assert.ok(detectPatterns(cs, cs.length - 1).some((p) => p.name === 'Martillo'));
});

const base = (o = {}) => ({ symbol: 'AAPL', kind: 'wait', score: 0, verdict: 'x', price: 100,
  buy_plan: { price_is_in_buy_zone: false, buy_zone: [98, 99], stop: 95, target1: 110, rr_target1: 2 },
  sell_plan: { price_is_in_sell_zone: false, sell_zone: [109, 110], trailing_stop: 96 }, ...o });

test('alerta de compra: se confirma en 2 lecturas y no se repite el mismo dia', () => {
  const a = base({ kind: 'buy', score: 4 });
  const r1 = evaluate(a, {}, null, { date: '2026-11-05' });
  assert.equal(r1.alerts.length, 0);
  const r2 = evaluate(a, r1.next, null, { date: '2026-11-05' });
  assert.equal(r2.alerts.length, 1);
  assert.match(r2.alerts[0].title, /COMPRA.*AAPL.US/);
  const r3 = evaluate(base({ kind: 'wait' }), r2.next, null, { date: '2026-11-05' });
  const r4 = evaluate(a, evaluate(base({ kind: 'wait' }), r3.next, null, { date: '2026-11-05' }).next, null, { date: '2026-11-05' });
  assert.equal(r4.alerts.length + evaluate(a, r4.next, null, { date: '2026-11-05' }).alerts.length, 0, 'vuelve a buy el mismo dia: no repite');
  assert.equal(r3.alerts.length, 0, 'ya sono hoy');
});

test('con velas cerradas (confirm) suena de inmediato; venta incluye zona', () => {
  const r = evaluate(base({ kind: 'sell', score: -4 }), {}, null, { date: 'd', confirm: true });
  assert.equal(r.alerts.length, 1);
  assert.match(r.alerts[0].body, /Zona de venta/);
});

test('stop y objetivo de una posicion', () => {
  const pos = { entry: 100, stop: 95, target: 110, shares: 10 };
  assert.match(evaluate(base({ price: 94.5 }), {}, pos, { date: 'd' }).alerts[0].title, /STOP/);
  assert.match(evaluate(base({ price: 111 }), {}, pos, { date: 'd' }).alerts[0].title, /OBJETIVO/);
  assert.equal(evaluate(base({ price: 100 }), {}, pos, { date: 'd' }).alerts.length, 0);
  assert.equal(evaluate(base({ price: 90 }), {}, { ...pos, shares: 0 }, { date: 'd' }).alerts.length, 0);
});

test('reloj NYSE', () => {
  assert.equal(marketStatus(new Date('2026-11-04T15:00:00Z')).open, true);   // 10:00 ET
  assert.equal(marketStatus(new Date('2026-11-04T22:00:00Z')).open, false);  // 17:00 ET
  assert.equal(marketStatus(new Date('2026-11-07T15:00:00Z')).tradingDay, false); // sabado
  assert.equal(marketStatus(new Date('2026-11-26T15:00:00Z')).holiday, true); // Thanksgiving
  assert.equal(marketStatus(new Date('2027-07-01T13:45:00Z')).open, true);   // 9:45 EDT
  assert.equal(marketStatus(new Date('2027-07-01T13:15:00Z')).open, false);
});

// ---- Worker completo con KV y fetch falsos ----------------------------------
const kv = () => { const m = new Map(); return { get: async (k, t) => (m.has(k) ? (t === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null), put: async (k, v) => void m.set(k, v), m }; };
const mockFetch = (calls) => async (url, init) => {
  calls.push({ url: String(url), init });
  const m = String(url).match(/chart\/([A-Z\-]+)\?/);
  if (m) return new Response(JSON.stringify(fx(m[1])), { status: 200 });
  return new Response('ok', { status: 200 });
};
const auth = (pw) => 'Basic ' + btoa('u:' + pw);

test('API: exige contrasena, anti-CSRF y valida entradas', async () => {
  const env = { STATE: kv(), DASH_PASSWORD: 'secreto', WATCHLIST: 'AAPL' };
  assert.equal((await worker.fetch(new Request('https://x/api/state'), { STATE: kv() })).status, 503);
  assert.equal((await worker.fetch(new Request('https://x/'), env)).status, 401);
  assert.equal((await worker.fetch(new Request('https://x/', { headers: { Authorization: auth('mal') } }), env)).status, 401);
  const ok = await worker.fetch(new Request('https://x/', { headers: { Authorization: auth('secreto') } }), env);
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get('Content-Security-Policy'), /default-src 'none'/);
  const post = (p, b, h = {}) => worker.fetch(new Request('https://x' + p, { method: 'POST', body: JSON.stringify(b), headers: { Authorization: auth('secreto'), ...h } }), env);
  assert.equal((await post('/api/config', { watchlist: ['KO'] })).status, 403, 'sin cabecera anti-CSRF');
  assert.equal((await post('/api/config', { watchlist: ['KO'] }, { 'X-Requested-With': 'dashboard', Origin: 'https://evil' })).status, 403);
  const H = { 'X-Requested-With': 'dashboard' };
  assert.equal((await post('/api/config', { watchlist: ['<script>'] }, H)).status, 400);
  assert.equal((await post('/api/config', { watchlist: ['ko', 'AAPL.US'], account: 5000, riskPct: 1 }, H)).status, 200);
  assert.equal((await post('/api/config', { watchlist: ['KO'], riskPct: 50 }, H)).status, 400);
  assert.equal((await post('/api/positions', { symbol: 'KO', shares: 3 }, H)).status, 400);
  assert.equal((await post('/api/positions', { symbol: 'KO', shares: 3, entry: 60, stop: 55, target: 70 }, H)).status, 200);
  const st = await (await worker.fetch(new Request('https://x/api/state', { headers: { Authorization: auth('secreto') } }), env)).json();
  assert.deepEqual(st.cfg.watchlist, ['KO', 'AAPL']);
  assert.equal(st.cfg.positions.KO.stop, 55);
});

test('run(): analiza, guarda el snapshot, manda push y no repite', async () => {
  const calls = [], real = globalThis.fetch;
  globalThis.fetch = mockFetch(calls);
  try {
    const env = { STATE: kv(), WATCHLIST: 'AAPL,KO', NTFY_TOPIC: 'prueba', DASH_URL: 'https://x' };
    await env.STATE.put('cfg', JSON.stringify({ watchlist: ['AAPL', 'KO'], positions: { KO: { entry: 200, stop: 150, target: 300, shares: 5 } }, account: 5000, riskPct: 1 }));
    const day = new Date('2026-11-04T22:20:00Z'); // 17:20 Bogota, dia habil
    const r = await run(env, 'postclose', day);
    assert.equal(r.tickers, 2);
    const snap = await env.STATE.get('snapshot', 'json');
    assert.ok(snap.items.AAPL.buy_plan.sizing, 'calcula acciones con la cuenta');
    const pushes = calls.filter((c) => c.url === 'https://ntfy.sh');
    assert.ok(pushes.length >= 2, 'resumen + stop de KO (precio < 150? ' + snap.items.KO.price + ')');
    assert.ok(pushes.some((c) => JSON.parse(c.init.body).title.includes('post-cierre')));
    assert.ok(pushes.every((c) => JSON.parse(c.init.body).topic === 'prueba'));
    const n = pushes.length;
    await run(env, 'postclose', day);
    const again = calls.filter((c) => c.url === 'https://ntfy.sh').length - n;
    assert.equal(again, 1, 'solo el resumen; las alertas del dia no se repiten');
    const man = calls.length;
    await run(env, 'manual', day);
    assert.equal(calls.slice(man).filter((c) => c.url === 'https://ntfy.sh').length, 0, 'actualizar a mano no manda push');
    assert.deepEqual(await run(env, 'intraday', new Date('2026-11-04T23:30:00Z')), { skipped: 'mercado cerrado' });
    assert.match((await run(env, 'preopen', new Date('2026-11-26T12:40:00Z'))).skipped, /feriado/);
  } finally { globalThis.fetch = real; }
});

test('un ticker que falla no tumba a los demas', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async (u) => (String(u).includes('/ZZZ?') ? new Response('{}', { status: 404 }) : new Response(JSON.stringify(fx('AAPL')), { status: 200 }));
  try {
    const env = { STATE: kv() };
    await env.STATE.put('cfg', JSON.stringify({ watchlist: ['AAPL', 'ZZZ'], positions: {}, account: null, riskPct: 1 }));
    const r = await run(env, 'manual', new Date('2026-11-04T22:20:00Z'));
    assert.ok(r.errors.ZZZ);
    assert.ok((await env.STATE.get('snapshot', 'json')).items.AAPL);
  } finally { globalThis.fetch = real; }
});
