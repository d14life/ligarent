/* Verifies the Telegram message carries every field the brief asked for.
   Run: node api/test-message.mjs   */
import { buildMessage, esc } from './telegram-worker.js';

const sample = {
  name: 'Ivan <boss> & co',
  phone: '+7 900 123 45 67',
  whatsapp: '+7 900 765 43 21',
  job: 'Strip topsoil off 3 ha and form a pad. Probably a D6R.',
  tons: 'About 20 t · tight sites, finish work · D6R',
  location: 'Kazan, Sovetsky district',
  lang: 'ru',
  ts: '2026-09-04T09:00:00.000Z',
  ref: 'https://google.com'
};

const msg = buildMessage(sample);
console.log('--- message ---\n' + msg + '\n---------------\n');

const MUST = {
  'contact phone': sample.phone,
  'whatsapp number': sample.whatsapp,
  'job description': 'Strip topsoil off 3 ha',
  'tonnage': 'About 20 t',
  'site location': 'Kazan, Sovetsky district'
};

let fail = 0;
for (const [what, needle] of Object.entries(MUST)) {
  const ok = msg.includes(needle);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what} present`);
  if (!ok) fail++;
}

// injection: raw angle brackets from user input must be escaped
const escaped = msg.includes('Ivan &lt;boss&gt; &amp; co');
console.log(`${escaped ? 'ok  ' : 'FAIL'} user input is HTML-escaped`);
if (!escaped) fail++;

// tel: and wa.me links must carry digits only
const telOk = /href="tel:\+79001234567"/.test(msg);
const waOk  = /href="https:\/\/wa\.me\/79007654321"/.test(msg);
console.log(`${telOk ? 'ok  ' : 'FAIL'} tel link normalised`);
console.log(`${waOk  ? 'ok  ' : 'FAIL'} wa.me link normalised`);
if (!telOk) fail++;
if (!waOk) fail++;

// Telegram hard-limits messages to 4096 characters
const lenOk = msg.length < 4096;
console.log(`${lenOk ? 'ok  ' : 'FAIL'} under Telegram's 4096-char limit (${msg.length})`);
if (!lenOk) fail++;

console.log(fail ? `\nFAILED (${fail})` : '\nPASS');
process.exit(fail ? 1 : 0);
