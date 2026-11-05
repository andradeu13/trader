# Trader + Coach

Pack [trader-skill](https://github.com/Jakeschincariol/trader-skill) (11 skills, MIT) instalado en `.claude/skills/`, mas **`trader-coach`**: un coach en espanol que calcula velas e indicadores, te dice donde comprar y donde vender, y te explica el porque.

## Coach

```bash
python3 .claude/skills/trader-coach/coach.py analyze AAPL --account 5000 --risk-pct 1
python3 .claude/skills/trader-coach/coach.py candles AAPL --last 10
python3 .claude/skills/trader-coach/coach.py scan AAPL KO BAC AXP GOOGL
python3 .claude/skills/trader-coach/coach.py brief --holdings --write --closed-only
python3 .claude/skills/trader-coach/coach.py lesson soporte
python3 .claude/skills/trader-coach/coach.py quiz --show
```

En Claude Code: `/trader-coach analiza AAPL` o pide el agente `trader-coach`.

Cada analisis incluye: anatomia de la ultima vela y patrones (15), SMA 20/50/200, RSI, MACD, Bollinger, ATR, volumen, soportes y resistencias con toques, un puntaje con la razon de cada punto, el plan de compra (zona, stop, objetivos, R:R, acciones segun tu riesgo) y el plan de venta (zona, stop de seguimiento).

## Agenda diaria

El reporte `brief` se puede programar (antes de la apertura, 9:00 hora de Nueva York, dias habiles) para que te llegue la lista de tickers en zona de compra/venta y una leccion del dia. Escribe `trader/coach/AAAA-MM-DD.md`.

## Dashboard y pushes (Cloudflare Workers)

Carpeta `worker/`: dashboard que se actualiza solo y pushes de compra/venta/stop. Guía de despliegue en [`worker/README.md`](worker/README.md).

## Reglas

Nada coloca ordenes salvo `trader-broker`, y solo tras `trader-risk` y tu "yes" explicito. Paper trading por defecto. Datos gratis con retraso. **No es consejo financiero.**

Tests: `python3 -m unittest discover -s tests -v`. Licencia del pack original: `docs/trader-skill-LICENSE`.
