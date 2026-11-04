# Trader Coach en Cloudflare Workers

Dashboard + pushes de compra/venta. Usa el mismo motor que `coach.py` (el test compara los dos con datos reales de AAPL y KO: mismo puntaje, indicadores, niveles y plan).

- **Dashboard** (`/`): tarjetas por acción ordenadas por señal, velas con soportes, resistencias, zona de compra/venta y stop, el porqué de cada punto, plan de compra/venta, acciones según tu riesgo, una mini-lección. Se refresca solo cada minuto. Horas en Bogotá. Ajustes para tus acciones, tu cuenta XTB, riesgo % y tus posiciones abiertas.
- **Pushes** (por ntfy y/o Telegram):
  - 🟢 una acción pasó a *ZONA DE COMPRA* · 🔴 pasó a *ZONA DE VENTA / REDUCIR* · 🟡 entró a su zona de compra con R:R ≥ 1,5
  - 🛑 tu posición tocó el stop · 🎯 llegó al objetivo · ⚠️ tu posición se debilita
  - ☀️ resumen 7:40 (Bogotá) y 🌙 resumen 17:20.
  - Cada alerta suena **una vez por día** y el cambio de veredicto se confirma en 2 lecturas seguidas (la vela de hoy puede estar abierta).
- **Agenda** (cron, UTC): 12:40 pre-apertura, cada 15 min de 13:00 a 21:59 (solo actúa con NYSE abierto, incluidos feriados y cierres a la 1 p. m.), 22:20 post-cierre. Bogotá es UTC-5 todo el año.

El Worker **no coloca órdenes** y no tiene acceso a XTB: las ejecutas tú a mano en xStation. Datos de Yahoo con retraso. No es consejo financiero.

## Despliegue (5 minutos)

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create STATE        # copia el id a wrangler.toml
```

Secretos (nunca en el repo):

```bash
npx wrangler secret put DASH_PASSWORD         # contraseña del dashboard (usuario: cualquiera)
npx wrangler secret put NTFY_TOPIC            # un nombre largo e impredecible, ej. coach-9f3k2x7q-bogota
```

```bash
npx wrangler deploy
```

Opcional: en `wrangler.toml` descomenta `DASH_URL` con la URL de tu Worker para que al tocar el push abra el dashboard, y `ACCOUNT`/`RISK_PCT` (también se editan desde Ajustes).

### Recibir los pushes en el celular
1. Instala la app **ntfy** (iOS o Android) y suscríbete al mismo nombre que pusiste en `NTFY_TOPIC`.
2. Abre el dashboard → **Ajustes → Probar push**.

El topic de ntfy.sh es público para quien conozca el nombre: usa uno largo y aleatorio. Para más privacidad, aloja tu propio ntfy y define `NTFY_SERVER` y el secreto `NTFY_TOKEN`.

**Telegram** (alternativa o complemento): crea un bot con @BotFather y define los secretos `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.

## Local

```bash
cp .dev.vars.example .dev.vars
npm run dev            # http://localhost:8787
npm test
```

## Límites a tener en cuenta
- Máximo 25 tickers (ver `MAX_TICKERS`). Cada ejecución hace una petición a Yahoo por ticker; Yahoo es un endpoint no oficial y puede fallar o limitar: el dashboard marca «datos viejos» y no se cae.
- Cálculo de ~25 tickers por ejecución: si el plan gratis de Workers corta por CPU, pasa a Workers Paid ($5/mes) o reduce la lista.
- Seguridad: Basic Auth con comparación en tiempo constante, CSP estricta, cabecera anti-CSRF en toda escritura. Usa siempre la URL `https`.
