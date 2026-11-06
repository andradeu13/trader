#!/usr/bin/env python3
"""Coach de trading: velas, indicadores, zonas de compra y venta. Solo libreria estandar.

    python3 coach.py analyze AAPL                 # analisis completo + plan de compra/venta
    python3 coach.py analyze AAPL --account 5000 --risk-pct 1
    python3 coach.py candles AAPL --last 10       # anatomia de cada vela + patrones
    python3 coach.py scan AAPL KO BAC             # resumen de varios tickers
    python3 coach.py scan --holdings              # los de trader/portfolio.json y targets.json
    python3 coach.py lesson [tema]                # mini-clase (sin tema = lista)
    python3 coach.py quiz                         # pregunta de practica sobre velas
    python3 coach.py brief --holdings --write     # reporte diario -> trader/coach/AAAA-MM-DD.md

Datos: Yahoo chart JSON (gratis, con retraso, no oficial), un ticker por peticion.
--offline DIR lee DIR/yahoo-chart-<TICKER>.json en vez de la red.
Es educacion y aritmetica, no consejo financiero. Nunca coloca ordenes.
"""

import argparse
import datetime
import json
import os
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (compatible; trader-coach/1.0)"
PAUSE = 0.5
INTERVALS = ("1m", "5m", "15m", "30m", "60m", "1d", "1wk", "1mo")


# ---------------------------------------------------------------- datos

# Indices de XTB (CFD) -> simbolo de Yahoo. Mantener igual que worker/src/yahoo.js.
INDEX_ALIASES = {"US100": "^NDX", "US500": "^GSPC", "US30": "^DJI", "DE40": "^GDAXI", "GOLD": "GC=F"}


def yahoo_symbol(sym):
    s = sym.upper()
    return INDEX_ALIASES.get(s) or s.replace(".", "-")


def yahoo_url(sym, rng, interval):
    return ("https://query1.finance.yahoo.com/v8/finance/chart/%s?range=%s&interval=%s"
            % (urllib.parse.quote(yahoo_symbol(sym)), rng, interval))


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def parse_chart(text, sym):
    """Yahoo chart JSON -> {symbol, currency, candles:[{t,o,h,l,c,v}]}; filas con huecos se saltan."""
    doc = json.loads(text)
    res = (doc.get("chart") or {}).get("result")
    if not res:
        err = (doc.get("chart") or {}).get("error") or {}
        raise ValueError("%s: sin datos (%s)" % (sym, err.get("description", "respuesta vacia")))
    r = res[0]
    q = r["indicators"]["quote"][0]
    candles = []
    for i, t in enumerate(r.get("timestamp") or []):
        o, h, l, c = (q[k][i] for k in ("open", "high", "low", "close"))
        if None in (o, h, l, c):
            continue
        v = q["volume"][i] or 0
        candles.append({"t": t, "o": float(o), "h": float(h), "l": float(l), "c": float(c), "v": int(v)})
    if not candles:
        raise ValueError("%s: ninguna vela valida" % sym)
    meta = r.get("meta", {})
    return {"symbol": sym.upper(), "currency": meta.get("currency"), "candles": candles}


def load_series(sym, rng="1y", interval="1d", offline=None):
    if offline:
        with open(os.path.join(offline, "yahoo-chart-%s.json" % sym.upper()), encoding="utf-8") as fh:
            return parse_chart(fh.read(), sym)
    return parse_chart(fetch(yahoo_url(sym, rng, interval)), sym)


# ------------------------------------------------------------ indicadores

def sma(vals, n):
    out = [None] * len(vals)
    s = 0.0
    for i, v in enumerate(vals):
        s += v
        if i >= n:
            s -= vals[i - n]
        if i >= n - 1:
            out[i] = s / n
    return out


def ema(vals, n):
    out = [None] * len(vals)
    if len(vals) < n:
        return out
    k = 2.0 / (n + 1)
    e = sum(vals[:n]) / n
    out[n - 1] = e
    for i in range(n, len(vals)):
        e = vals[i] * k + e * (1 - k)
        out[i] = e
    return out


def rsi(closes, n=14):
    """RSI de Wilder."""
    out = [None] * len(closes)
    if len(closes) <= n:
        return out
    gains = losses = 0.0
    for i in range(1, n + 1):
        d = closes[i] - closes[i - 1]
        gains += max(d, 0)
        losses += max(-d, 0)
    ag, al = gains / n, losses / n
    out[n] = 100.0 if al == 0 else 100 - 100 / (1 + ag / al)
    for i in range(n + 1, len(closes)):
        d = closes[i] - closes[i - 1]
        ag = (ag * (n - 1) + max(d, 0)) / n
        al = (al * (n - 1) + max(-d, 0)) / n
        out[i] = 100.0 if al == 0 else 100 - 100 / (1 + ag / al)
    return out


def atr(candles, n=14):
    """ATR de Wilder: cuanto se mueve el precio por vela, en dolares."""
    out = [None] * len(candles)
    if len(candles) <= n:
        return out
    trs = []
    for i, c in enumerate(candles):
        if i == 0:
            trs.append(c["h"] - c["l"])
        else:
            pc = candles[i - 1]["c"]
            trs.append(max(c["h"] - c["l"], abs(c["h"] - pc), abs(c["l"] - pc)))
    a = sum(trs[1:n + 1]) / n
    out[n] = a
    for i in range(n + 1, len(candles)):
        a = (a * (n - 1) + trs[i]) / n
        out[i] = a
    return out


def macd(closes, fast=12, slow=26, sig=9):
    ef, es = ema(closes, fast), ema(closes, slow)
    line = [None if a is None or b is None else a - b for a, b in zip(ef, es)]
    valid = [x for x in line if x is not None]
    sg = ema(valid, sig)
    signal, j = [None] * len(line), 0
    for i, x in enumerate(line):
        if x is not None:
            signal[i] = sg[j]
            j += 1
    hist = [None if a is None or b is None else a - b for a, b in zip(line, signal)]
    return line, signal, hist


def bollinger(closes, n=20, k=2.0):
    mid = sma(closes, n)
    up, lo = [None] * len(closes), [None] * len(closes)
    for i in range(n - 1, len(closes)):
        w = closes[i - n + 1:i + 1]
        m = mid[i]
        sd = (sum((x - m) ** 2 for x in w) / n) ** 0.5
        up[i], lo[i] = m + k * sd, m - k * sd
    return lo, mid, up


# ------------------------------------------------------------------ velas

def anatomy(c):
    rng = c["h"] - c["l"]
    body = abs(c["c"] - c["o"])
    top, bot = max(c["o"], c["c"]), min(c["o"], c["c"])
    upper, lower = c["h"] - top, bot - c["l"]
    d = rng if rng > 0 else 1e-9
    return {"range": rng, "body": body, "upper": upper, "lower": lower,
            "body_pct": body / d, "upper_pct": upper / d, "lower_pct": lower / d,
            "color": "verde" if c["c"] > c["o"] else ("roja" if c["c"] < c["o"] else "neutra")}


def _trend(candles, i, n=5):
    """Contexto previo: 'baja', 'sube' o 'lateral' segun las n velas anteriores a i."""
    if i < n:
        return "lateral"
    a, b = candles[i - n]["c"], candles[i - 1]["c"]
    ch = (b - a) / a if a else 0
    return "sube" if ch > 0.02 else ("baja" if ch < -0.02 else "lateral")


def detect_patterns(candles, i):
    """Patrones que TERMINAN en la vela i. Devuelve [{name, bias, why}]."""
    out = []
    c = candles[i]
    a = anatomy(c)
    prev = candles[i - 1] if i >= 1 else None
    pa = anatomy(prev) if prev else None
    tr = _trend(candles, i)
    small = a["body_pct"] <= 0.30

    if a["body_pct"] <= 0.10 and a["range"] > 0:
        out.append({"name": "Doji", "bias": "indecision",
                    "why": "Abrio y cerro casi igual: compradores y vendedores empataron. Importa donde aparece."})
    if small and a["lower_pct"] >= 0.60 and a["upper_pct"] <= 0.15:
        if tr == "baja":
            out.append({"name": "Martillo", "bias": "alcista",
                        "why": "Tras una caida, los vendedores empujaron abajo pero los compradores devolvieron el precio arriba (mecha larga inferior). Posible suelo."})
        elif tr == "sube":
            out.append({"name": "Hombre colgado", "bias": "bajista",
                        "why": "Tras una subida, la mecha inferior larga avisa de que ya hay vendedores. Necesita confirmacion de la vela siguiente."})
    if small and a["upper_pct"] >= 0.60 and a["lower_pct"] <= 0.15:
        if tr == "sube":
            out.append({"name": "Estrella fugaz", "bias": "bajista",
                        "why": "Tras una subida, el precio subio mucho pero los vendedores lo devolvieron (mecha larga superior). Posible techo."})
        elif tr == "baja":
            out.append({"name": "Martillo invertido", "bias": "alcista",
                        "why": "Tras una caida, los compradores intentaron subir. Necesita confirmacion de la vela siguiente."})
    if a["body_pct"] >= 0.90 and a["range"] > 0:
        out.append({"name": "Marubozu " + a["color"], "bias": "alcista" if a["color"] == "verde" else "bajista",
                    "why": "Casi sin mechas: un solo bando mando toda la sesion. Es fuerza, no agotamiento."})
    if prev and pa["body"] > 0 and a["body"] > 0:
        pu, pd = prev["c"] > prev["o"], prev["c"] < prev["o"]
        cu, cd = c["c"] > c["o"], c["c"] < c["o"]
        if pd and cu and c["o"] <= prev["c"] and c["c"] >= prev["o"] and a["body"] > pa["body"]:
            out.append({"name": "Envolvente alcista", "bias": "alcista",
                        "why": "Una vela verde cubre por completo el cuerpo de la roja anterior: los compradores tomaron el control."})
        if pu and cd and c["o"] >= prev["c"] and c["c"] <= prev["o"] and a["body"] > pa["body"]:
            out.append({"name": "Envolvente bajista", "bias": "bajista",
                        "why": "Una vela roja cubre por completo el cuerpo de la verde anterior: los vendedores tomaron el control."})
        mid = (prev["o"] + prev["c"]) / 2
        if pd and cu and c["o"] < prev["c"] and mid < c["c"] < prev["o"] and pa["body_pct"] > 0.5:
            out.append({"name": "Linea penetrante", "bias": "alcista",
                        "why": "Abre con hueco a la baja y recupera mas de la mitad de la vela roja anterior."})
        if pu and cd and c["o"] > prev["c"] and prev["o"] < c["c"] < mid and pa["body_pct"] > 0.5:
            out.append({"name": "Nube oscura", "bias": "bajista",
                        "why": "Abre con hueco al alza y devuelve mas de la mitad de la vela verde anterior."})
        if c["h"] < prev["h"] and c["l"] > prev["l"]:
            out.append({"name": "Barra interior", "bias": "indecision",
                        "why": "Toda la vela cabe dentro de la anterior: el precio se comprime antes de una salida. Opera la ruptura, no la espera."})
    if i >= 2:
        p2, p1 = candles[i - 2], candles[i - 1]
        a2, a1 = anatomy(p2), anatomy(p1)
        if p2["c"] < p2["o"] and a2["body_pct"] > 0.5 and a1["body_pct"] < 0.3 and c["c"] > c["o"] \
                and c["c"] > (p2["o"] + p2["c"]) / 2:
            out.append({"name": "Estrella de la manana", "bias": "alcista",
                        "why": "Roja grande, vela pequena de duda, verde grande: giro de bajista a alcista en tres tiempos."})
        if p2["c"] > p2["o"] and a2["body_pct"] > 0.5 and a1["body_pct"] < 0.3 and c["c"] < c["o"] \
                and c["c"] < (p2["o"] + p2["c"]) / 2:
            out.append({"name": "Estrella de la tarde", "bias": "bajista",
                        "why": "Verde grande, vela pequena de duda, roja grande: giro de alcista a bajista en tres tiempos."})
        tri = candles[i - 2:i + 1]
        if all(x["c"] > x["o"] for x in tri) and tri[0]["c"] < tri[1]["c"] < tri[2]["c"] \
                and all(anatomy(x)["body_pct"] > 0.5 for x in tri):
            out.append({"name": "Tres soldados blancos", "bias": "alcista",
                        "why": "Tres verdes seguidas con cierres cada vez mas altos: empuje comprador sostenido."})
        if all(x["c"] < x["o"] for x in tri) and tri[0]["c"] > tri[1]["c"] > tri[2]["c"] \
                and all(anatomy(x)["body_pct"] > 0.5 for x in tri):
            out.append({"name": "Tres cuervos negros", "bias": "bajista",
                        "why": "Tres rojas seguidas con cierres cada vez mas bajos: presion vendedora sostenida."})
    return out


# ------------------------------------------------------ soporte / resistencia

def swing_points(candles, w=3):
    highs, lows = [], []
    for i in range(w, len(candles) - w):
        seg = candles[i - w:i + w + 1]
        if candles[i]["h"] == max(x["h"] for x in seg):
            highs.append((i, candles[i]["h"]))
        if candles[i]["l"] == min(x["l"] for x in seg):
            lows.append((i, candles[i]["l"]))
    return highs, lows


def cluster(points, tol):
    """Agrupa precios cercanos (tol en dolares) -> niveles con numero de toques."""
    pts = sorted(p for _, p in points)
    groups = []
    for p in pts:
        if groups and p - groups[-1][-1] <= tol:
            groups[-1].append(p)
        else:
            groups.append([p])
    return [{"level": sum(g) / len(g), "touches": len(g)} for g in groups]


def levels(candles, atr_now):
    price = candles[-1]["c"]
    tol = max(atr_now * 0.5, price * 0.003)
    highs, lows = swing_points(candles)
    allv = cluster(highs + lows, tol)  # un nivel es soporte o resistencia segun donde este el precio
    sup = sorted((x for x in allv if x["level"] < price), key=lambda x: -x["level"])
    res = sorted((x for x in allv if x["level"] > price), key=lambda x: x["level"])
    return sup, res


# --------------------------------------------------------------- analisis

def last(seq):
    return seq[-1]


def analyze_series(series, account=None, risk_pct=1.0, held=None, closed_only=False):
    cs = series["candles"]
    live = False
    if cs and _day(cs[-1]["t"]) == datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d") \
            and datetime.datetime.now(datetime.timezone.utc).hour < 21:
        live = True  # la sesion de EEUU aun puede estar abierta: la ultima vela no esta cerrada
        if closed_only:
            cs = cs[:-1]
            series = dict(series, candles=cs)
    if len(cs) < 35:
        raise ValueError("%s: faltan velas (%d); hacen falta al menos 35" % (series["symbol"], len(cs)))
    closes = [c["c"] for c in cs]
    vols = [c["v"] for c in cs]
    s20, s50, s200 = sma(closes, 20), sma(closes, 50), sma(closes, 200)
    e9 = ema(closes, 9)
    rs = rsi(closes)
    at = atr(cs)
    ml, ms, mh = macd(closes)
    bl, bm, bu = bollinger(closes)
    price = closes[-1]
    a_now = last(at)
    sup, res = levels(cs, a_now)
    i = len(cs) - 1
    pats = detect_patterns(cs, i)
    vol_avg = sum(vols[-21:-1]) / 20 if len(vols) > 21 else None
    vol_ratio = (vols[-1] / vol_avg) if vol_avg else None
    hi52 = max(c["h"] for c in cs[-252:])
    lo52 = min(c["l"] for c in cs[-252:])

    score, reasons = 0, []

    def add(pts, text):
        nonlocal score
        score += pts
        reasons.append((pts, text))

    # tendencia
    if s50[-1] is not None:
        if price > s50[-1]:
            add(1, "Precio por encima de la media de 50 dias (tendencia de corto/medio plazo alcista).")
        else:
            add(-1, "Precio por debajo de la media de 50 dias (tendencia de corto/medio plazo bajista).")
    if s200[-1] is not None and s50[-1] is not None:
        if s50[-1] > s200[-1]:
            add(1, "Media de 50 por encima de la de 200 (tendencia grande alcista).")
        else:
            add(-1, "Media de 50 por debajo de la de 200 (tendencia grande bajista).")
    # momentum
    if rs[-1] is not None:
        if rs[-1] < 30:
            add(1, "RSI %.0f: sobreventa. Ha caido mucho y rapido; zona donde suelen aparecer rebotes." % rs[-1])
        elif rs[-1] > 70:
            add(-1, "RSI %.0f: sobrecompra. Ha subido mucho y rapido; riesgo de pausa o correccion." % rs[-1])
    if mh[-1] is not None and mh[-2] is not None:
        if mh[-1] > 0 and mh[-1] > mh[-2]:
            add(1, "MACD positivo y creciendo: el impulso alcista se acelera.")
        elif mh[-1] < 0 and mh[-1] < mh[-2]:
            add(-1, "MACD negativo y cayendo: el impulso bajista se acelera.")
    if bl[-1] is not None:
        if price < bl[-1]:
            add(1, "Precio bajo la banda de Bollinger inferior: estirado a la baja, posible rebote a la media.")
        elif price > bu[-1]:
            add(-1, "Precio sobre la banda de Bollinger superior: estirado al alza, posible retroceso a la media.")
    # niveles
    near_sup = sup[0] if sup and price - sup[0]["level"] <= a_now * 1.0 else None
    near_res = res[0] if res and res[0]["level"] - price <= a_now * 1.0 else None
    if near_sup and near_res:
        near_sup = near_res = None
        add(0, "Soporte y resistencia a menos de 1 ATR de distancia: rango comprimido, el R:R es malo. Espera la ruptura.")
    if near_sup:
        add(1, "Precio pegado a un soporte (%.2f, %d toques): zona logica de compra con stop corto." % (near_sup["level"], near_sup["touches"]))
    if near_res:
        add(-1, "Precio pegado a una resistencia (%.2f, %d toques): zona logica para vender o no perseguir." % (near_res["level"], near_res["touches"]))
    # velas
    for p in pats:
        if p["bias"] == "alcista":
            add(2 if near_sup else 1, "Vela/patron %s%s." % (p["name"], " sobre soporte (mucho mas fiable)" if near_sup else " (sin soporte cerca: fiabilidad media)"))
        elif p["bias"] == "bajista":
            add(-2 if near_res else -1, "Vela/patron %s%s." % (p["name"], " bajo resistencia (mucho mas fiable)" if near_res else " (sin resistencia cerca: fiabilidad media)"))
    if vol_ratio and vol_ratio >= 1.5 and cs[-1]["c"] != cs[-1]["o"]:
        add(1 if cs[-1]["c"] > cs[-1]["o"] else -1,
            "Volumen %.1fx el promedio: el movimiento de hoy tiene conviccion." % vol_ratio)

    # plan de compra
    buy_lo = sup[0]["level"] if sup else price - a_now
    buy_hi = buy_lo + 0.25 * a_now
    entry = min(price, buy_hi) if price <= buy_hi * 1.0 else buy_hi
    stop = buy_lo - 0.5 * a_now
    risk = entry - stop
    at_highs = not res
    r1 = res[0]["level"] if res else entry + 2 * risk
    plan = {
        "buy_zone": [round(buy_lo, 2), round(buy_hi, 2)],
        "entry": round(entry, 2),
        "stop": round(stop, 2),
        "target1": round(r1, 2),
        "target2": round(entry + 2 * risk, 2),
        "rr_target1": round((r1 - entry) / risk, 2) if risk > 0 else None,
        "price_is_in_buy_zone": buy_lo - 0.1 * a_now <= price <= buy_hi,
        "no_resistance_above": at_highs,
    }
    sell_hi = res[0]["level"] if res else max(hi52, price)
    sell_lo = sell_hi - 0.25 * a_now
    sell = {
        "sell_zone": [round(sell_lo, 2), round(sell_hi, 2)],
        "trailing_stop": round(max(closes[-10:]) - 2 * a_now, 2),
        "break_even_stop_hint": "Cuando el precio avance 1R, sube el stop al precio de entrada.",
        "price_is_in_sell_zone": price >= sell_lo,
    }
    rr1 = plan["rr_target1"]
    if score >= 3 and rr1 is not None and not at_highs and rr1 < 1.5:
        verdict = "COMPRA DEBIL - R:R %.1f insuficiente, espera un retroceso" % rr1
    elif score >= 3 and at_highs:
        verdict = "FUERTE PERO EN MAXIMOS - no persigas, espera retroceso"
    elif score >= 3:
        verdict = "ZONA DE COMPRA"
    elif score <= -3:
        verdict = "ZONA DE VENTA / REDUCIR"
    elif score >= 1:
        verdict = "SESGO ALCISTA - esperar mejor precio"
    elif score <= -1:
        verdict = "SESGO BAJISTA - no comprar todavia"
    else:
        verdict = "ESPERAR - sin ventaja clara"
    if account and risk > 0:
        shares = int((account * risk_pct / 100.0) // risk)
        cost = shares * entry
        cap = int((account * 0.25) // entry) if entry > 0 else 0
        plan["sizing"] = {"account": account, "risk_pct": risk_pct,
                          "max_loss_usd": round(shares * risk, 2),
                          "shares_by_risk": shares, "shares_capped_25pct": min(shares, cap),
                          "cost_usd": round(min(shares, cap) * entry, 2)}
    if held:
        sell["held"] = held

    return {
        "symbol": series["symbol"], "currency": series.get("currency"),
        "as_of": _day(cs[-1]["t"]),
        "price": round(price, 2), "change_pct": round((price / closes[-2] - 1) * 100, 2),
        "indicators": {
            "sma20": _r(s20[-1]), "sma50": _r(s50[-1]), "sma200": _r(s200[-1]), "ema9": _r(e9[-1]),
            "rsi14": _r(rs[-1], 1), "atr14": _r(a_now), "atr_pct": round(a_now / price * 100, 2),
            "macd": _r(ml[-1], 3), "macd_signal": _r(ms[-1], 3), "macd_hist": _r(mh[-1], 3),
            "boll_low": _r(bl[-1]), "boll_mid": _r(bm[-1]), "boll_up": _r(bu[-1]),
            "volume_ratio": _r(vol_ratio, 2), "hi52": round(hi52, 2), "lo52": round(lo52, 2),
        },
        "last_candle": dict(anatomy(cs[-1]), o=cs[-1]["o"], h=cs[-1]["h"], l=cs[-1]["l"], c=cs[-1]["c"]),
        "patterns": pats,
        "supports": [{"level": round(x["level"], 2), "touches": x["touches"]} for x in sup[:3]],
        "resistances": [{"level": round(x["level"], 2), "touches": x["touches"]} for x in res[:3]],
        "live_candle": live and not closed_only,
        "score": score, "verdict": verdict,
        "reasons": [{"points": p, "text": t} for p, t in reasons],
        "buy_plan": plan, "sell_plan": sell,
    }


def _day(t):
    return datetime.datetime.fromtimestamp(t, datetime.timezone.utc).strftime("%Y-%m-%d")


def _r(x, nd=2):
    return None if x is None else round(x, nd)


# ----------------------------------------------------------------- render

BOGOTA = datetime.timezone(datetime.timedelta(hours=-5))  # Colombia no usa horario de verano


def xtb_symbol(sym):
    """Acciones reales de EEUU en XTB llevan sufijo .US (AAPL.US). ETFs/CFD pueden variar: verifica en xStation."""
    return sym if "." in sym or sym.upper() in INDEX_ALIASES else sym + ".US"


def market_hours_bogota(now=None):
    """Horario NYSE (9:30-16:00 Nueva York) expresado en hora de Bogota, con el horario de verano de EEUU."""
    import importlib.util
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "trader-alerts", "alerts.py")
    now = now or datetime.datetime.now(datetime.timezone.utc)
    try:
        spec = importlib.util.spec_from_file_location("trader_alerts", path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        ny = mod.eastern_offset(now.replace(tzinfo=None))
        off = int(ny.total_seconds() // 3600) if hasattr(ny, "total_seconds") else int(ny)
    except Exception:
        off = -5
    shift = off - (-5)  # horas que Nueva York va por delante de Bogota
    return "NYSE abre %02d:30 y cierra %02d:00 hora Bogota" % (9 - shift, 16 - shift)


def money(x):
    return "n/d" if x is None else "$%s" % format(x, ",.2f")


def render_analysis(r):
    ind, bp, sp = r["indicators"], r["buy_plan"], r["sell_plan"]
    L = []
    L.append("## %s  (XTB: %s)  %s  (%+.2f%% hoy, datos al %s)" % (r["symbol"], xtb_symbol(r["symbol"]), money(r["price"]), r["change_pct"], r["as_of"]))
    L.append("**Veredicto del coach: %s**  (puntaje %+d)" % (r["verdict"], r["score"]))
    if r.get("live_candle"):
        L.append("_La vela de hoy puede estar formandose (datos con retraso). Un patron solo es firme cuando la vela cierra; usa --closed-only para ignorarla._")
    L.append("")
    c = r["last_candle"]
    L.append("### Ultima vela: %s" % c["color"])
    L.append("O %.2f  H %.2f  L %.2f  C %.2f. Cuerpo %.0f%% del rango, mecha superior %.0f%%, inferior %.0f%%."
             % (c["o"], c["h"], c["l"], c["c"], c["body_pct"] * 100, c["upper_pct"] * 100, c["lower_pct"] * 100))
    if r["patterns"]:
        for p in r["patterns"]:
            L.append("- **%s** (%s): %s" % (p["name"], p["bias"], p["why"]))
    else:
        L.append("- Sin patron clasico hoy. Una vela normal tambien cuenta: no fuerces una senal.")
    L.append("")
    L.append("### Por que ese veredicto")
    for x in r["reasons"]:
        L.append("- [%+d] %s" % (x["points"], x["text"]))
    if not r["reasons"]:
        L.append("- Ninguna senal activa. Eso tambien es informacion: esperar es una posicion.")
    L.append("")
    L.append("### Indicadores")
    L.append("| indicador | valor | como leerlo |")
    L.append("| --- | --- | --- |")
    L.append("| Medias 20/50/200 | %s / %s / %s | precio sobre ellas = tendencia sana; la 200 es la 'linea de vida' |"
             % (money(ind["sma20"]), money(ind["sma50"]), money(ind["sma200"])))
    L.append("| RSI 14 | %s | <30 sobreventa, >70 sobrecompra, 40-60 neutro |" % ind["rsi14"])
    L.append("| MACD / senal / hist | %s / %s / %s | histograma > 0 = impulso alcista |"
             % (ind["macd"], ind["macd_signal"], ind["macd_hist"]))
    L.append("| Bollinger inf/med/sup | %s / %s / %s | tocar una banda no es senal por si solo |"
             % (money(ind["boll_low"]), money(ind["boll_mid"]), money(ind["boll_up"])))
    L.append("| ATR 14 | %s (%.2f%% del precio) | cuanto se mueve por vela: base de tu stop |" % (money(ind["atr14"]), ind["atr_pct"]))
    L.append("| Volumen hoy / promedio | %sx | >1.5x = hay conviccion |" % ind["volume_ratio"])
    L.append("| Maximo / minimo 52 sem | %s / %s | |" % (money(ind["hi52"]), money(ind["lo52"])))
    L.append("")
    L.append("### Mapa de precios")
    if r["resistances"]:
        L.append("Resistencias (techos): " + ", ".join("%s (%d toques)" % (money(x["level"]), x["touches"]) for x in r["resistances"]))
    else:
        L.append("Resistencias: ninguna a la vista (maximos historicos o sin swing arriba).")
    L.append("Soportes (suelos): " + (", ".join("%s (%d toques)" % (money(x["level"]), x["touches"]) for x in r["supports"]) or "ninguno claro"))
    L.append("")
    L.append("### Donde COMPRAR (plan, no orden)")
    flag = "  <- el precio YA esta aqui" if bp["price_is_in_buy_zone"] else "  (el precio aun no llego; esperar)"
    L.append("- Zona de compra: %s a %s%s" % (money(bp["buy_zone"][0]), money(bp["buy_zone"][1]), flag))
    L.append("- Entrada de referencia %s | Stop %s (bajo el soporte, con 0.5 ATR de margen)" % (money(bp["entry"]), money(bp["stop"])))
    rr = bp["rr_target1"]
    if bp.get("no_resistance_above"):
        L.append("- Sin resistencia por encima (zona de maximos): los objetivos son matematicos, 2R %s | 3R mas arriba. Aqui perseguir el precio es lo peligroso: compra retrocesos, no maximos." % money(bp["target1"]))
    else:
        L.append("- Objetivo 1 %s (proxima resistencia, R:R %s) | Objetivo 2 %s (2R)" % (money(bp["target1"]), rr if rr is not None else "n/d", money(bp["target2"])))
    if rr is not None and rr < 1.5:
        L.append("- Aviso: R:R menor a 1.5. Aunque se vea bonito, la matematica no compensa. Pasa o espera un precio mejor.")
    if "sizing" in bp:
        z = bp["sizing"]
        L.append("- Tamano: con cuenta %s arriesgando %.1f%% (%s max de perdida) = %d acciones por riesgo; tope 25%% de la cuenta = %d acciones (%s)."
                 % (money(z["account"]), z["risk_pct"], money(z["max_loss_usd"]), z["shares_by_risk"], z["shares_capped_25pct"], money(z["cost_usd"])))
    L.append("")
    L.append("### Donde VENDER")
    flag = "  <- el precio YA esta aqui" if sp["price_is_in_sell_zone"] else ""
    L.append("- Zona de toma de ganancias: %s a %s%s" % (money(sp["sell_zone"][0]), money(sp["sell_zone"][1]), flag))
    L.append("- Stop de seguimiento (maximo de 10 velas - 2 ATR): %s. %s" % (money(sp["trailing_stop"]), sp["break_even_stop_hint"]))
    L.append("- Vende todo o parte si: una vela bajista fuerte (envolvente/estrella) aparece EN la resistencia, o cierra bajo tu stop.")
    L.append("")
    L.append("**En XTB:** el precio de XTB (con su spread) manda, no el de Yahoo. Antes de abrir en xStation revisa: spread, comision, que sea accion real o CFD (el CFD cobra swap nocturno), y pon tu stop y take-profit en la orden. Confirma que el stop sigue valiendo la pena con el spread incluido.")
    L.append("")
    L.append("_Educacion y aritmetica sobre datos con retraso; no es consejo financiero. El coach no coloca ordenes._")
    return "\n".join(L)


def render_candles(series, last_n):
    cs = series["candles"]
    n = min(last_n, len(cs))
    L = ["## Velas de %s (ultimas %d)" % (series["symbol"], n), "",
         "| fecha | O | H | L | C | color | cuerpo | m.sup | m.inf | patron |",
         "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for i in range(len(cs) - n, len(cs)):
        c, a = cs[i], anatomy(cs[i])
        pats = ", ".join(p["name"] for p in detect_patterns(cs, i)) or "-"
        d = _day(c["t"])
        L.append("| %s | %.2f | %.2f | %.2f | %.2f | %s | %.0f%% | %.0f%% | %.0f%% | %s |"
                 % (d, c["o"], c["h"], c["l"], c["c"], a["color"], a["body_pct"] * 100, a["upper_pct"] * 100, a["lower_pct"] * 100, pats))
    L += ["", "Cuerpo = |cierre-apertura| / rango. Mecha = lo que el precio visito y rechazo."]
    return "\n".join(L)


def scan_row(r):
    pat = ", ".join(p["name"] for p in r["patterns"]) or "-"
    bz = r["buy_plan"]["buy_zone"]
    sz = r["sell_plan"]["sell_zone"]
    return "| %s | %s | %s | %s | %+d | %s | %s-%s | %s-%s | %s |" % (
        r["symbol"], money(r["price"]), "%+.2f%%" % r["change_pct"], r["indicators"]["rsi14"], r["score"],
        r["verdict"], bz[0], bz[1], sz[0], sz[1], pat)


SCAN_HEAD = ["| ticker | precio | hoy | RSI | pts | veredicto | comprar | vender | patron |",
             "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]


# -------------------------------------------------------------- lecciones

LESSONS = {
    "vela": ("Anatomia de una vela",
             "Cada vela resume una sesion con 4 precios: Apertura, Maximo, Minimo, Cierre (OHLC).\n"
             "- El CUERPO va de apertura a cierre. Verde: cerro arriba de donde abrio. Roja: cerro abajo.\n"
             "- Las MECHAS son lo que el precio visito y fue rechazado. Mecha larga = rechazo fuerte.\n"
             "- Cuerpo grande y mechas chicas = un bando domino. Cuerpo chico y mechas largas = duda.\n"
             "Regla: una vela sola cuenta poco. Cuenta donde aparece (soporte/resistencia) y quien confirma despues."),
    "soporte": ("Soporte y resistencia",
                "Soporte = precio donde los compradores aparecieron antes (suelo). Resistencia = donde los vendedores aparecieron (techo).\n"
                "- Mas toques = nivel mas respetado, pero tambien mas cerca de romperse.\n"
                "- Un soporte roto suele convertirse en resistencia, y viceversa.\n"
                "- Compras cerca del soporte porque tu stop queda corto (poco riesgo). Vendes cerca de la resistencia porque ahi el subir cuesta mas.\n"
                "Esto es el corazon de 'donde comprar y donde vender'."),
    "atr": ("ATR y el stop",
            "ATR = rango promedio por vela. Si una accion se mueve $3 por dia, un stop a $0.50 saltara por puro ruido.\n"
            "- Stop = soporte menos 0.5-1 ATR. Fuera del ruido, dentro de la logica.\n"
            "- Tamano de posicion = (cuenta x % de riesgo) / (entrada - stop). Asi una perdida siempre cuesta lo mismo, sea la accion que sea."),
    "rr": ("Riesgo / beneficio (R:R)",
           "R = lo que arriesgas (entrada - stop). Si el objetivo esta a 2R, ganas el doble de lo que arriesgas.\n"
           "- Con R:R 2:1 puedes acertar solo 40% y aun ganar dinero.\n"
           "- Si R:R < 1.5 la operacion rara vez vale la pena aunque el grafico se vea bien.\n"
           "- Arriesga 0.5-1% de la cuenta por operacion. Cinco perdidas seguidas deben doler poco."),
    "rsi": ("RSI",
            "RSI (0-100) compara las subidas y bajadas recientes. <30 sobreventa, >70 sobrecompra.\n"
            "- En tendencia fuerte el RSI puede quedarse >70 semanas: sobrecompra no es 'vende ya'.\n"
            "- Funciona mejor como filtro: sobreventa + soporte + vela de giro = alineacion de tres cosas."),
    "macd": ("MACD",
             "MACD = media rapida (12) menos media lenta (26). El histograma es MACD menos su senal (9).\n"
             "- Histograma sobre 0 y creciendo: el impulso alcista gana fuerza. Bajo 0 y cayendo: el bajista.\n"
             "- Es un indicador que llega tarde. Util para confirmar, no para adivinar."),
    "medias": ("Medias moviles",
               "SMA 20/50/200 = promedio de los ultimos 20/50/200 cierres. Muestran la tendencia sin ruido.\n"
               "- Precio sobre la 50 y la 50 sobre la 200: tendencia alcista sana. Buscas compras en retrocesos.\n"
               "- Precio bajo la 200: no compres 'por barato'; es un cuchillo cayendo hasta que gire.\n"
               "- Cruce de la 50 sobre la 200 ('cruz dorada') es lento; sirve de contexto, no de timing."),
    "volumen": ("Volumen",
                "El volumen es la conviccion detras del movimiento.\n"
                "- Ruptura de resistencia con volumen 1.5x o mas: creible. Sin volumen: sospecha de falsa ruptura.\n"
                "- Una vela de giro con volumen alto pesa mucho mas que la misma vela con volumen bajo."),
    "patrones": ("Patrones de velas que reconoce el coach",
                 "Alcistas: Martillo, Martillo invertido, Envolvente alcista, Linea penetrante, Estrella de la manana, Tres soldados blancos.\n"
                 "Bajistas: Hombre colgado, Estrella fugaz, Envolvente bajista, Nube oscura, Estrella de la tarde, Tres cuervos negros.\n"
                 "Neutros: Doji, Barra interior, Marubozu (fuerza).\n"
                 "Regla de oro: patron alcista SOBRE soporte, bajista BAJO resistencia. En medio de la nada, fiabilidad media."),
    "disciplina": ("Disciplina y psicologia",
                   "1. Escribe el plan ANTES de entrar: entrada, stop, objetivo. Sin plan no hay operacion.\n"
                   "2. El stop no se mueve en contra. Solo a favor (a break-even cuando llevas 1R).\n"
                   "3. No promedies a la baja una operacion perdedora.\n"
                   "4. Perder una operacion no es fallar; romper tus reglas si lo es.\n"
                   "5. Lleva un diario: ticker, razon, resultado, que aprendiste. Ahi esta tu ventaja real."),
}

QUIZ = [
    ("Una vela con cuerpo pequeno arriba y mecha inferior 3 veces mas larga que el cuerpo aparece tras 5 dias de caida y justo en un soporte. Que es y que significa?",
     "Martillo. Los vendedores empujaron abajo pero los compradores devolvieron el precio. Posible suelo; esperas que la vela siguiente cierre arriba antes de entrar."),
    ("Compras a $50 con stop en $48. Tu objetivo esta en $53. Cual es el R:R y lo tomas?",
     "Arriesgas $2 para ganar $3 = 1.5:1. Es el minimo aceptable; mejor si encuentras entrada con >= 2:1."),
    ("Cuenta de $10,000, riesgo 1%, entrada $50, stop $48. Cuantas acciones?",
     "Riesgo = $100. $100 / $2 = 50 acciones ($2,500 de capital)."),
    ("El RSI marca 78 en una accion que sube con fuerza sobre su media de 50. Vendes todo?",
     "No automaticamente. En tendencia fuerte el RSI aguanta alto. Busca confirmacion: vela bajista en resistencia o cierre bajo tu stop de seguimiento."),
    ("Una envolvente bajista aparece en medio del rango, lejos de cualquier resistencia. Tanta fiabilidad como en una resistencia?",
     "No. Sin resistencia cerca los patrones valen la mitad. El contexto pesa mas que la forma."),
    ("Una accion rompe su resistencia con volumen 0.6x el promedio. Compras la ruptura?",
     "Con cautela: volumen bajo sugiere falsa ruptura. Espera un retesteo de la resistencia como nuevo soporte."),
    ("Tu operacion va 1R a favor. Que haces con el stop?",
     "Lo subes al precio de entrada (break-even). Ya no puedes perder dinero y dejas correr la ganancia."),
]


# -------------------------------------------------------------- comandos

def holdings_tickers(root="trader"):
    syms = []
    for name, key in (("portfolio.json", "positions"), ("targets.json", "targets")):
        p = os.path.join(root, name)
        if not os.path.isfile(p):
            continue
        try:
            doc = json.load(open(p, encoding="utf-8"))
        except (OSError, ValueError):
            continue
        rows = doc.get(key) or doc.get("holdings") or (doc if isinstance(doc, list) else [])
        for row in rows:
            s = row.get("symbol") or row.get("ticker") if isinstance(row, dict) else None
            if s:
                syms.append(s.upper())
    wl = os.path.join(root, "watchlist.json")
    if os.path.isfile(wl):
        try:
            syms += [str(x).upper() for x in json.load(open(wl, encoding="utf-8")).get("tickers", [])]
        except (OSError, ValueError, AttributeError):
            pass
    seen, out = set(), []
    for s in syms:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


def get_many(symbols, a):
    results, errors = [], []
    for k, s in enumerate(symbols):
        try:
            results.append(load_series(s, a.range, a.interval, a.offline))
        except (ValueError, KeyError, OSError, urllib.error.URLError) as e:
            errors.append("%s: %s" % (s, e))
        if k < len(symbols) - 1 and not a.offline:
            time.sleep(PAUSE)
    return results, errors


def tickers_from(a):
    syms = [s.upper() for s in a.tickers]
    if getattr(a, "holdings", False):
        syms += holdings_tickers()
    seen, out = set(), []
    for s in syms:
        if s not in seen:
            seen.add(s)
            out.append(s)
    if not out:
        sys.exit("Dime al menos un ticker (o usa --holdings con trader/portfolio.json).")
    return out


def cmd_analyze(a):
    series, errors = get_many(tickers_from(a), a)
    out = [render_analysis(analyze_series(s, a.account, a.risk_pct, closed_only=a.closed_only)) for s in series]
    print("\n\n".join(out + ["Errores: " + "; ".join(errors)] * bool(errors)))
    return 0 if series else 2


def cmd_candles(a):
    series, errors = get_many(tickers_from(a), a)
    for s in series:
        print(render_candles(s, a.last))
        print()
    for e in errors:
        print("Error:", e)
    return 0 if series else 2


def cmd_scan(a):
    series, errors = get_many(tickers_from(a), a)
    rs = [analyze_series(s, closed_only=a.closed_only) for s in series]
    rs.sort(key=lambda r: -abs(r["score"]))
    print("\n".join(SCAN_HEAD + [scan_row(r) for r in rs]))
    for e in errors:
        print("Error:", e)
    return 0 if series else 2


def cmd_brief(a):
    syms = tickers_from(a)
    series, errors = get_many(syms, a)
    rs = [analyze_series(s, closed_only=a.closed_only) for s in series]
    rs.sort(key=lambda r: -abs(r["score"]))
    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    now_b = datetime.datetime.now(BOGOTA).strftime("%Y-%m-%d %H:%M")
    L = ["# Reporte del coach - %s" % today, "",
         "_Generado %s hora Bogota (UTC-5). %s._" % (now_b, market_hours_bogota()), ""]
    buys = [r for r in rs if r["score"] >= 3 or r["buy_plan"]["price_is_in_buy_zone"]]
    sells = [r for r in rs if r["score"] <= -3 or r["sell_plan"]["price_is_in_sell_zone"]]
    L.append("**En zona de compra:** " + (", ".join(r["symbol"] for r in buys) or "ninguno"))
    L.append("**En zona de venta:** " + (", ".join(r["symbol"] for r in sells) or "ninguno"))
    L += [""] + SCAN_HEAD + [scan_row(r) for r in rs] + [""]
    for r in rs[:a.detail]:
        L += [render_analysis(r), ""]
    if rs:
        topic = random.Random(today).choice(sorted(LESSONS))
        t, body = LESSONS[topic]
        L += ["---", "### Leccion del dia: %s" % t, body, ""]
    for e in errors:
        L.append("Error: " + e)
    L.append("_No es consejo financiero. Ninguna orden fue colocada._")
    text = "\n".join(L)
    print(text)
    if a.write:
        d = os.path.join("trader", "coach")
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, today + ".md"), "w", encoding="utf-8") as fh:
            fh.write(text + "\n")
        with open(os.path.join(d, "latest.json"), "w", encoding="utf-8") as fh:
            json.dump({"date": today, "results": rs}, fh, indent=2, ensure_ascii=False)
    return 0 if series else 2


def cmd_lesson(a):
    if not a.topic:
        print("Temas: " + ", ".join(sorted(LESSONS)))
        return 0
    key = a.topic.lower()
    hit = [k for k in LESSONS if k.startswith(key) or key in k]
    if not hit:
        print("No tengo esa leccion. Temas: " + ", ".join(sorted(LESSONS)))
        return 1
    t, body = LESSONS[hit[0]]
    print("## %s\n\n%s" % (t, body))
    return 0


def cmd_quiz(a):
    rnd = random.Random(a.seed) if a.seed is not None else random
    q, ans = rnd.choice(QUIZ)
    print("PREGUNTA: " + q)
    if a.show:
        print("RESPUESTA: " + ans)
    else:
        print("(contesta en el chat; usa --show para ver la respuesta)")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def data(p, holdings=True):
        p.add_argument("tickers", nargs="*")
        if holdings:
            p.add_argument("--holdings", action="store_true", help="incluye trader/portfolio.json y targets.json")
        p.add_argument("--range", default="1y", help="rango de Yahoo (3mo, 6mo, 1y, 2y); 1y da la media de 200")
        p.add_argument("--interval", default="1d", choices=INTERVALS)
        p.add_argument("--offline", metavar="DIR")
        p.add_argument("--closed-only", action="store_true", help="ignora la vela de hoy si aun no cerro")

    p = sub.add_parser("analyze"); data(p)
    p.add_argument("--account", type=float, help="tamano de cuenta en USD para calcular acciones")
    p.add_argument("--risk-pct", type=float, default=1.0)
    p.set_defaults(fn=cmd_analyze)
    p = sub.add_parser("candles"); data(p); p.add_argument("--last", type=int, default=10)
    p.set_defaults(fn=cmd_candles)
    p = sub.add_parser("scan"); data(p); p.set_defaults(fn=cmd_scan)
    p = sub.add_parser("brief"); data(p)
    p.add_argument("--detail", type=int, default=3, help="analisis completo de los N tickers con mas senal")
    p.add_argument("--write", action="store_true")
    p.set_defaults(fn=cmd_brief)
    p = sub.add_parser("lesson"); p.add_argument("topic", nargs="?"); p.set_defaults(fn=cmd_lesson)
    p = sub.add_parser("quiz"); p.add_argument("--show", action="store_true")
    p.add_argument("--seed", type=int); p.set_defaults(fn=cmd_quiz)

    a = ap.parse_args(argv)
    return a.fn(a)


if __name__ == "__main__":
    sys.exit(main())
