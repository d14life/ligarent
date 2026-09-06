/**
 * LIGARENT — enquiry endpoint (Cloudflare Worker).
 *
 * The site POSTs JSON here; this forwards it to a Telegram bot.
 * The bot token is a Worker SECRET and never reaches the browser.
 *
 * Deploy
 * ------
 *   npm i -g wrangler
 *   wrangler login
 *   wrangler deploy                      # uses api/wrangler.toml
 *   wrangler secret put TELEGRAM_BOT_TOKEN
 *   wrangler secret put TELEGRAM_CHAT_ID
 *
 * Then put the deployed URL into window.LIGARENT_CONFIG.leadEndpoint
 * in index.html.
 *
 * Getting the two secrets is described in api/README.md.
 */

const REQUIRED = ['phone', 'whatsapp', 'job', 'tons', 'location'];

const LABELS = {
  name:     'Name',
  phone:    'Phone',
  whatsapp: 'WhatsApp',
  job:      'Job',
  tons:     'Size',
  location: 'Location'
};

/** Telegram HTML parse_mode only allows a small tag set; escape everything else. */
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function digits(s) {
  return String(s || '').replace(/[^\d]/g, '');
}

/**
 * Build the Telegram message. Exported so it can be unit-tested without
 * touching the network — see api/test-message.mjs.
 */
export function buildMessage(d) {
  const lines = [];
  lines.push('🚜 <b>NEW ENQUIRY — LIGARENT</b>');
  lines.push('');

  if (d.name) lines.push(`👤 <b>${LABELS.name}:</b> ${esc(d.name)}`);

  const tel = digits(d.phone);
  lines.push(`📞 <b>${LABELS.phone}:</b> <a href="tel:+${tel}">${esc(d.phone)}</a>`);

  const wa = digits(d.whatsapp);
  lines.push(`💬 <b>${LABELS.whatsapp}:</b> <a href="https://wa.me/${wa}">${esc(d.whatsapp)}</a>`);

  lines.push('');
  lines.push(`🏗 <b>${LABELS.job}:</b>`);
  lines.push(esc(d.job));
  lines.push('');
  lines.push(`⚖️ <b>${LABELS.tons}:</b> ${esc(d.tons)}`);
  lines.push(`📍 <b>${LABELS.location}:</b> ${esc(d.location)}`);

  const meta = [];
  if (d.lang) meta.push(`lang ${esc(d.lang)}`);
  if (d.ts) meta.push(esc(d.ts));
  if (d.ref) meta.push(`from ${esc(d.ref)}`);
  if (meta.length) {
    lines.push('');
    lines.push(`<i>${meta.join(' · ')}</i>`);
  }

  return lines.join('\n');
}

function cors(origin, allowed) {
  const ok = !allowed || allowed === '*' ||
    allowed.split(',').map(s => s.trim()).includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

const json = (body, status, headers) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const head = cors(origin, env.ALLOWED_ORIGIN);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: head });
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, head);

    let d;
    try {
      d = await request.json();
    } catch {
      return json({ error: 'bad json' }, 400, head);
    }

    // Honeypot: a hidden field a human never fills. Accept silently so bots
    // do not learn they were caught.
    if (d.company) return json({ ok: true }, 200, head);

    const missing = REQUIRED.filter(k => !String(d[k] || '').trim());
    if (missing.length) return json({ error: 'missing', fields: missing }, 400, head);

    // clamp field lengths so a flood cannot blow past Telegram's 4096-char limit
    for (const k of Object.keys(d)) {
      if (typeof d[k] === 'string') d[k] = d[k].slice(0, k === 'job' ? 1500 : 300);
    }

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set');
      return json({ error: 'not configured' }, 500, head);
    }

    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: buildMessage(d),
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('telegram rejected the message:', res.status, body);
      return json({ error: 'delivery failed' }, 502, head);
    }

    return json({ ok: true }, 200, head);
  }
};
