// Notificaciones: ntfy (app gratis en el celular) y/o Telegram. Secretos en `wrangler secret`, nunca en el codigo.
export async function sendPush(env, { title, body, priority = 3, tags = [], click }) {
  const jobs = [];
  if (env.NTFY_TOPIC) {
    const server = (env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/$/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (env.NTFY_TOKEN) headers.Authorization = `Bearer ${env.NTFY_TOKEN}`;
    jobs.push(['ntfy', fetch(server, { method: 'POST', headers, body: JSON.stringify({ topic: env.NTFY_TOPIC, title, message: body, priority, tags, ...(click ? { click } : {}) }) })]);
  }
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push(['telegram', fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `${title}\n\n${body}`, disable_web_page_preview: true }) })]);
  }
  if (!jobs.length) return { sent: [], error: 'Sin canal de push configurado (NTFY_TOPIC o TELEGRAM_*)' };
  const res = await Promise.allSettled(jobs.map(([, p]) => p));
  const sent = [], failed = [];
  res.forEach((r, i) => (r.status === 'fulfilled' && r.value.ok ? sent : failed).push(jobs[i][0]));
  return { sent, failed };
}
