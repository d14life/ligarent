/* LIGARENT — контроллер минималистичной сборки.
   Держит язык, карточки машин, подбор по четырём вопросам и форму заявки.
   Словари и цифры машин не дублируются: берутся из тех же файлов, что и
   у прежней версии, поэтому спецификацию и перевод правят в одном месте. */

import { T, LOCALES } from './i18n.js';
import { EXTRA } from './i18n-extra.js';
import { MORE } from './i18n-more.js';
import { BA } from './i18n-ba.js';
import { BRAND } from './i18n-brand.js';
import { WORK } from './i18n-work.js';
import { FLEET, SPEC_ORDER } from './fleet.js';

for (const B of [EXTRA, MORE, BA, BRAND, WORK])
  for (const [loc, block] of Object.entries(B))
    if (T[loc]) Object.assign(T[loc], block);

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ── язык ─────────────────────────────────────────────────────────────────
   Клиенты русскоязычные, поэтому по умолчанию русский, а не язык браузера:
   английский браузер в офисе однажды открыл весь сайт по-английски.        */
const DEFAULT = 'ru', FALLBACK = 'en';
let lang = (() => {
  try { const s = localStorage.getItem('ligarent.lang'); if (s && LOCALES[s]) return s; } catch {}
  return DEFAULT;
})();

function t(key, vars) {
  let s = (T[lang] && key in T[lang]) ? T[lang][key]
        : (T[FALLBACK] && key in T[FALLBACK]) ? T[FALLBACK][key] : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(v);
  return s;
}

function applyLang() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  $$('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  const ttl = $('title'); if (ttl) ttl.textContent = t('meta.title');
  const md = $('meta[name="description"]'); if (md) md.content = t('meta.desc');
  $('#langNow').textContent = LOCALES[lang].short;
  $$('#langMenu button').forEach(b => b.setAttribute('aria-current', String(b.dataset.l === lang)));
  renderFleet();
  renderPick();
}

function setLang(l) {
  if (!LOCALES[l]) return;
  lang = l;
  try { localStorage.setItem('ligarent.lang', l); } catch {}
  applyLang();
}

/* ── машины ──────────────────────────────────────────────────────────────── */
const ACCENT = { d6r: '', d7r: 'mach--mid', d8r: 'mach--big' };

function renderFleet() {
  const host = $('#fleet');
  if (!host) return;
  host.innerHTML = FLEET.map(m => `
    <article class="mach ${ACCENT[m.id] || ''}">
      <div class="mach__ph"><img src="${m.image}" alt="${m.name}" loading="lazy" width="800" height="600"></div>
      <h3>${m.name}</h3>
      <div class="mach__var">${m.variant}</div>
      <p class="mach__blurb">${t(m.blurb)}</p>
      <dl class="spec">
        ${SPEC_ORDER.map(k => {
          const s = m.specs[k];
          return `<div><dt>${t('mach.spec.' + k)}</dt>
            <dd>${s.v}${s.u ? ' ' + s.u : ''}${s.note ? `<u>${s.note}</u>` : ''}</dd></div>`;
        }).join('')}
      </dl>
      <div class="mach__best"><b>${t('mach.best')}</b>${t(m.use)}</div>
      <a class="btn btn--ghost" href="#contact" data-machine="${m.name}">${t('mach.cta')}</a>
    </article>`).join('');
}

/* ── подбор машины ───────────────────────────────────────────────────────── */
const QS = [
  { id: 'job',    q: 'pick.q.job',    o: ['clear', 'bulk', 'road', 'finish', 'rock'] },
  { id: 'area',   q: 'pick.q.area',   o: ['small', 'medium', 'large'] },
  { id: 'ground', q: 'pick.q.ground', o: ['soft', 'mixed', 'hard'] },
  { id: 'access', q: 'pick.q.access', o: ['open', 'tight'] },
];
const ORDER = ['d6r', 'd7r', 'd8r'];
const NAME = { d6r: 'Cat D6R', d7r: 'Cat D7R', d8r: 'Cat D8R' };
const answers = {};

/* Те же правила, по которым диспетчер отвечает по телефону: работа задаёт
   базовую машину, площадь двигает на ступень вверх, тесный заезд — вниз,
   скальный грунт — вверх. Ступень никогда не выходит за края линейки. */
function decide() {
  const { job, area, ground, access } = answers;
  let i = { finish: 0, clear: 0, road: 1, bulk: 1, rock: 2 }[job] ?? 1;
  if (area === 'large' && job !== 'finish') i++;
  if (area === 'small' && job !== 'rock') i--;
  if (ground === 'hard') i++;
  if (access === 'tight') i--;
  i = Math.max(0, Math.min(2, i));
  const alt = job === 'finish' ? null : (i > 0 ? ORDER[i - 1] : null);
  return { pick: ORDER[i], alt };
}

function renderPick() {
  const host = $('#picker-qs');
  if (!host) return;
  host.innerHTML = QS.map(q => `
    <div class="q">
      <h3>${t(q.q)}</h3>
      <div class="opts">${q.o.map(o =>
        `<button type="button" class="opt" data-q="${q.id}" data-v="${o}"
           aria-pressed="${answers[q.id] === o}">${t(`pick.${q.id}.${o}`)}</button>`).join('')}</div>
    </div>`).join('');
  paintResult();
}

function paintResult() {
  const box = $('#picker-out');
  if (!box) return;
  const left = QS.filter(q => !answers[q.id]).length;
  if (left) {
    box.innerHTML = `<p class="result__wait">${t('pick.hint', { n: left })}</p>`;
    return;
  }
  const { pick, alt } = decide();
  box.innerHTML = `
    <div class="result__lab">${t('pick.result')}</div>
    <h3>${NAME[pick]}</h3>
    <p class="result__why">${t('pick.why.' + answers.job)}</p>
    ${alt ? `<p class="result__alt">${t('pick.alt', { m: NAME[alt] })}</p>` : ''}
    <a class="btn btn--y" href="#contact" data-machine="${NAME[pick]}">${t('pick.cta')}</a>
    <button class="reset" type="button" id="pickReset">${t('pick.reset')}</button>`;
}

document.addEventListener('click', e => {
  const opt = e.target.closest('.opt');
  if (opt) {
    answers[opt.dataset.q] = opt.dataset.v;
    $$(`.opt[data-q="${opt.dataset.q}"]`).forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.v === opt.dataset.v)));
    paintResult();
    return;
  }
  if (e.target.id === 'pickReset') {
    Object.keys(answers).forEach(k => delete answers[k]);
    renderPick();
    return;
  }
  // «Запросить эту машину» подставляет модель в описание объекта
  const req = e.target.closest('[data-machine]');
  if (req) {
    const job = $('#f-job');
    if (job && !job.value.trim()) job.value = t('pick.prefill', { j: '', m: req.dataset.machine }).trim();
  }
});

/* ── форма ───────────────────────────────────────────────────────────────── */
const form = $('#lead');
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    $$('.f-row', form).forEach(r => r.classList.remove('bad'));
    let bad = false;
    const phone = $('#f-phone'), job = $('#f-job');
    if (!/[\d][\d\s()+-]{7,}/.test(phone.value.trim())) { phone.closest('.f-row').classList.add('bad'); bad = true; }
    if (!job.value.trim()) { job.closest('.f-row').classList.add('bad'); bad = true; }
    if (bad) return;

    const btn = $('#f-send');
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = t('form.sending');
    try {
      const r = await fetch('/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (!r.ok) throw new Error('http ' + r.status);
      form.hidden = true; $('#f-ok').classList.add('on');
    } catch {
      // Воркер на Cloudflare ещё не развёрнут, поэтому отказ — ожидаемый
      // путь, а не редкость: показываем телефон, а не пустую ошибку.
      $('#f-err').classList.add('on');
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  });
}

/* ── шапка ───────────────────────────────────────────────────────────────── */
$('#burger')?.addEventListener('click', () => $('.hdr').classList.toggle('open'));
$$('.hdr nav a').forEach(a => a.addEventListener('click', () => $('.hdr').classList.remove('open')));

const langBox = $('#lang');
$('#langBtn')?.addEventListener('click', e => { e.stopPropagation(); langBox.classList.toggle('open'); });
$$('#langMenu button').forEach(b => b.addEventListener('click', () => {
  setLang(b.dataset.l); langBox.classList.remove('open');
}));
document.addEventListener('click', () => langBox?.classList.remove('open'));

applyLang();
