// Notificaciones: ntfy y/o Telegram. Secretos en `wrangler secret` / panel de Cloudflare, nunca en el codigo.
// Cada envio devuelve el motivo EXACTO si falla, para que el panel lo muestre.
const TOPIC_OK = /^[A-Za-z0-9_-]{1,64}$/;

export function cleanTopic(raw) {
  // acepta "mi-canal", "https://ntfy.sh/mi-canal" o con espacios al borde
  return String(raw || '').trim().replace(/^https?:\/\/[^/]+\//, '').replace(/\/+$/, '');
}

function explain(ch, status, text) {
  if (ch === 'ntfy') {
    if (status === 429) return 'ntfy.sh limitó los envíos (cuota diaria). Los Workers comparten IP con muchas cuentas, así que el límite gratis se agota. Solución: usa Telegram, o crea una cuenta en ntfy.sh y guarda su token como secreto NTFY_TOKEN.';
    if (status === 401 || status === 403) return 'ntfy rechazó el envío (' + status + '): el canal está protegido o el token NTFY_TOKEN es inválido.';
    if (status === 400) return 'ntfy dijo que el nombre del canal es inválido. Usa solo letras, números, guiones y guion bajo.';
  }
  if (ch === 'telegram') {
    if (status === 401 || status === 404) return 'Telegram rechazó el token del bot (TELEGRAM_BOT_TOKEN). Cópialo de nuevo desde @BotFather.';
    if (status === 400 && /chat not found/i.test(text)) return 'Telegram no encuentra el chat: abre tu bot en Telegram y pulsa «Start», y revisa TELEGRAM_CHAT_ID.';
    if (status === 403) return 'Telegram: el bot no puede escribirte. Abre el bot y pulsa «Start».';
  }
  return ch + ' respondió ' + status + (text ? ': ' + text.slice(0, 140) : '');
}

async function post(ch, url, init) {
  try {
    const r = await fetch(url, init);
    if (r.ok) return { ch, ok: true };
    return { ch, ok: false, status: r.status, detail: explain(ch, r.status, await r.text().catch(() => '')) };
  } catch (e) { return { ch, ok: false, detail: ch + ': no se pudo conectar (' + String((e && e.message) || e) + ')' }; }
}

export async function sendPush(env, { title, body, priority = 3, tags = [], click }) {
  const jobs = [];
  const topic = cleanTopic(env.NTFY_TOPIC);
  if (env.NTFY_TOPIC) {
    if (!TOPIC_OK.test(topic)) jobs.push(Promise.resolve({ ch: 'ntfy', ok: false, detail: 'El secreto NTFY_TOPIC tiene caracteres no permitidos. Usa solo letras, números, guiones y guion bajo (sin espacios ni https://).' }));
    else {
      const server = (env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/$/, '');
      const headers = { 'Content-Type': 'application/json' };
      if (env.NTFY_TOKEN) headers.Authorization = `Bearer ${env.NTFY_TOKEN}`;
      jobs.push(post('ntfy', server, { method: 'POST', headers, body: JSON.stringify({ topic, title, message: body, priority, tags, ...(click ? { click } : {}) }) }));
    }
  }
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push(post('telegram', `https://api.telegram.org/bot${String(env.TELEGRAM_BOT_TOKEN).trim()}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: String(env.TELEGRAM_CHAT_ID).trim(), text: `${title}\n\n${body}`, disable_web_page_preview: true }) }));
  }
  if (!jobs.length) return { sent: [], failed: [], errors: [], error: 'No hay ningún canal de push configurado. Define NTFY_TOPIC, o TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID, como secretos en Cloudflare.' };
  const res = await Promise.all(jobs);
  return { sent: res.filter((r) => r.ok).map((r) => r.ch), failed: res.filter((r) => !r.ok).map((r) => r.ch), errors: res.filter((r) => !r.ok).map((r) => r.detail) };
}
