# Trader

Repo de trading asistido con Claude. Contiene:

- `.claude/skills/trader-*`: el pack https://github.com/Jakeschincariol/trader-skill (commit 5189e79, MIT, 11 skills) mas `trader-coach`, el coach propio.
- `.claude/agents/trader-coach.md`: subagente coach (espanol).
- `tests/test_coach.py`: tests offline del coach. `python3 -m unittest discover -s tests -v`
- `trader/`: datos del usuario (portfolio, targets, alertas, reportes del coach). Se crea al usarlo.

Reglas: ninguna orden sale sin la ruta budget -> risk -> broker y un "yes" explicito del usuario para esa orden. Paper trading por defecto. No es consejo financiero. SEC pide identificarse: pon `sec_user_agent` en `trader/config.json` o la variable `SEC_USER_AGENT`.

Uso rapido: `/trader-coach analiza AAPL`, `python3 .claude/skills/trader-coach/coach.py scan --holdings`.

Usuario: opera en XTB (xStation, ordenes manuales; simbolos `AAPL.US`), zona horaria Bogota UTC-5. Mostrar horas en Bogota. El coach da el plan; el usuario ejecuta en XTB.
