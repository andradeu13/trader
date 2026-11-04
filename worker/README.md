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

## Despliegue

### Opción A: conectado a GitHub (recomendada, se despliega solo en cada push a `main`)

1. Fusiona el PR a `main` (Cloudflare construye desde `main`).
2. En Cloudflare: **Workers & Pages → Create → Import a repository** (Workers Builds) y autoriza la app de GitHub sobre `andradeu13/trader`.
3. Configura el build:
   - **Root directory:** `worker`
   - **Build command:** `npm ci`
   - **Deploy command:** `npx wrangler deploy`
   - El nombre del Worker debe ser `trader-coach` (el de `wrangler.toml`).
4. El primer despliegue crea solo el KV `STATE` y programa los cron (están en `wrangler.toml`).
5. Pon los secretos en **Workers → trader-coach → Settings → Variables and Secrets** (tipo *Secret*): `DASH_PASSWORD` y `NTFY_TOPIC` (y opcionalmente `NTFY_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`). Los secretos **no** van en el repo y un despliegue nuevo no los borra.
6. Opcional: define `DASH_URL` (la URL `https://trader-coach.<tu-subdominio>.workers.dev`) como variable para que el push abra el dashboard.

### Opción B: desde tu computador

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put DASH_PASSWORD         # contraseña del dashboard (usuario: cualquiera)
npx wrangler secret put NTFY_TOPIC            # un nombre largo e impredecible, ej. coach-9f3k2x7q-bogota
npx wrangler deploy                           # crea el KV la primera vez
```

Opcional: en `wrangler.toml` descomenta `DASH_URL`, `ACCOUNT` y `RISK_PCT` (también se editan desde Ajustes del dashboard).

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
