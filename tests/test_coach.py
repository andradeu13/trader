import importlib.util
import json
import os
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("coach", os.path.join(ROOT, ".claude/skills/trader-coach/coach.py"))
coach = importlib.util.module_from_spec(spec)
spec.loader.exec_module(coach)


def C(o, h, l, c, v=1000, t=0):
    return {"o": o, "h": h, "l": l, "c": c, "v": v, "t": t}


def chart_json(rows):
    q = {k: [r[i] for r in rows] for k, i in (("open", 0), ("high", 1), ("low", 2), ("close", 3), ("volume", 4))}
    return json.dumps({"chart": {"result": [{"meta": {"currency": "USD"},
                                             "timestamp": [1700000000 + 86400 * i for i in range(len(rows))],
                                             "indicators": {"quote": [q]}}]}})


def zigzag(n=120):
    rows, p = [], 100.0
    for i in range(n):
        p += 1.0 if (i // 10) % 2 == 0 else -1.0
        rows.append((p - 0.3, p + 0.8, p - 0.8, p, 1000))
    return rows


class Indicators(unittest.TestCase):
    def test_sma_ema(self):
        self.assertEqual(coach.sma([1, 2, 3, 4], 2), [None, 1.5, 2.5, 3.5])
        self.assertEqual(coach.ema([1, 2, 3, 4], 2)[1], 1.5)

    def test_rsi_extremes(self):
        up = [float(i) for i in range(1, 40)]
        self.assertEqual(coach.rsi(up)[-1], 100.0)
        self.assertLess(coach.rsi(list(reversed(up)))[-1], 1)

    def test_atr_constant_range(self):
        cs = [C(10, 11, 9, 10) for _ in range(30)]
        self.assertAlmostEqual(coach.atr(cs)[-1], 2.0)

    def test_bollinger_flat(self):
        lo, mid, up = coach.bollinger([5.0] * 25)
        self.assertEqual((lo[-1], mid[-1], up[-1]), (5.0, 5.0, 5.0))


class Candles(unittest.TestCase):
    def names(self, cs):
        return [p["name"] for p in coach.detect_patterns(cs, len(cs) - 1)]

    def down(self):
        return [C(110 - i, 110.5 - i, 109 - i, 109.2 - i) for i in range(8)]

    def test_hammer_after_decline(self):
        cs = self.down() + [C(101.5, 101.7, 99.0, 101.6)]
        self.assertIn("Martillo", self.names(cs))

    def test_shooting_star_after_rise(self):
        cs = [C(100 + i, 101 + i, 99.8 + i, 100.8 + i) for i in range(8)] + [C(108.2, 111, 108.1, 108.3)]
        self.assertIn("Estrella fugaz", self.names(cs))

    def test_bullish_engulfing(self):
        cs = self.down() + [C(102, 102.2, 100.5, 100.8), C(100.5, 103.5, 100.3, 103.2)]
        self.assertIn("Envolvente alcista", self.names(cs))

    def test_bearish_engulfing(self):
        cs = [C(100 + i, 101.2 + i, 99.9 + i, 101 + i) for i in range(8)] + [C(108.2, 109.2, 108.0, 109.0), C(109.4, 109.6, 107.0, 107.5)]
        self.assertIn("Envolvente bajista", self.names(cs))

    def test_doji(self):
        cs = self.down() + [C(100, 101, 99, 100.05)]
        self.assertIn("Doji", self.names(cs))

    def test_inside_bar(self):
        cs = self.down() + [C(100, 104, 99, 103), C(101, 102, 100, 101.5)]
        self.assertIn("Barra interior", self.names(cs))

    def test_three_white_soldiers(self):
        cs = self.down() + [C(100, 102.2, 99.9, 102), C(101.5, 104.2, 101.4, 104), C(103.5, 106.2, 103.4, 106)]
        self.assertIn("Tres soldados blancos", self.names(cs))

    def test_anatomy_fractions_sum(self):
        a = coach.anatomy(C(10, 14, 8, 12))
        self.assertAlmostEqual(a["body_pct"] + a["upper_pct"] + a["lower_pct"], 1.0)


class Levels(unittest.TestCase):
    def test_support_below_resistance_above(self):
        cs = [dict(zip("ohlcv", r), t=i) for i, r in enumerate(zigzag())]
        at = coach.atr(cs)[-1]
        sup, res = coach.levels(cs, at)
        price = cs[-1]["c"]
        self.assertTrue(all(x["level"] < price for x in sup))
        self.assertTrue(all(x["level"] > price for x in res))
        self.assertTrue(sup and sup[0]["level"] > sup[-1]["level"] or len(sup) <= 1)


class Analysis(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        with open(os.path.join(self.tmp, "yahoo-chart-ZZZ.json"), "w") as fh:
            fh.write(chart_json(zigzag(260)))

    def test_parse_skips_null_rows(self):
        text = chart_json([(1, 2, 0.5, 1.5, 10), (None, None, None, None, None), (1, 2, 0.5, 1.8, 10)])
        self.assertEqual(len(coach.parse_chart(text, "x")["candles"]), 2)

    def test_full_analysis_shape_and_plan_math(self):
        s = coach.load_series("ZZZ", offline=self.tmp)
        r = coach.analyze_series(s, account=10000, risk_pct=1)
        bp = r["buy_plan"]
        self.assertLess(bp["stop"], bp["buy_zone"][0])
        self.assertLessEqual(bp["buy_zone"][0], bp["buy_zone"][1])
        sz = bp["sizing"]
        risk = bp["entry"] - bp["stop"]
        self.assertLessEqual(sz["max_loss_usd"], 100.0 + 1e-6)
        self.assertEqual(sz["shares_by_risk"], int(100 // risk))
        self.assertLessEqual(sz["cost_usd"], 2500.0 + bp["entry"])
        self.assertIn("verdict", r)
        text = coach.render_analysis(r)
        for needle in ("Donde COMPRAR", "Donde VENDER", "no es consejo financiero"):
            self.assertIn(needle, text)

    def test_too_few_candles(self):
        s = {"symbol": "X", "candles": [dict(zip("ohlcv", r), t=i) for i, r in enumerate(zigzag(10))]}
        with self.assertRaises(ValueError):
            coach.analyze_series(s)

    def test_cli_scan_and_brief_offline(self):
        self.assertEqual(coach.main(["scan", "ZZZ", "--offline", self.tmp]), 0)
        cwd = os.getcwd()
        os.chdir(self.tmp)
        try:
            self.assertEqual(coach.main(["brief", "ZZZ", "--offline", self.tmp, "--write"]), 0)
            self.assertTrue(os.path.isfile(os.path.join("trader", "coach", "latest.json")))
        finally:
            os.chdir(cwd)

    def test_lessons_and_quiz(self):
        self.assertEqual(coach.main(["lesson", "rr"]), 0)
        self.assertEqual(coach.main(["lesson", "nope"]), 1)
        self.assertEqual(coach.main(["quiz", "--seed", "1", "--show"]), 0)


class Xtb(unittest.TestCase):
    def test_symbol_suffix(self):
        self.assertEqual(coach.xtb_symbol("AAPL"), "AAPL.US")
        self.assertEqual(coach.xtb_symbol("BRK.B"), "BRK.B")
        self.assertEqual(coach.xtb_symbol("US100"), "US100")
        self.assertEqual(coach.yahoo_symbol("us100"), "^NDX")
        self.assertIn("%5ENDX", coach.yahoo_url("US100", "1y", "1d"))

    def test_hours_in_bogota(self):
        import datetime as d
        winter = d.datetime(2026, 11, 4, 15, tzinfo=d.timezone.utc)
        summer = d.datetime(2027, 7, 1, 15, tzinfo=d.timezone.utc)
        self.assertIn("abre 09:30 y cierra 16:00", coach.market_hours_bogota(winter))
        self.assertIn("abre 08:30 y cierra 15:00", coach.market_hours_bogota(summer))


class Safety(unittest.TestCase):
    def test_coach_never_touches_orders(self):
        src = open(os.path.join(ROOT, ".claude/skills/trader-coach/coach.py"), encoding="utf-8").read()
        for bad in ("orders.json", "place_order", "submit_order"):
            self.assertNotIn(bad, src)


if __name__ == "__main__":
    unittest.main()
