/* LIGARENT — the interactive sections.
   Machine picker, rate bands, comparison table, FAQ accordion, gallery
   lightbox, and the pointer-tracked highlight on the glass panels. */

import { FLEET, SPEC_ORDER } from './fleet.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ═══════════════════════ which machine do I need ═══════════════════════════
   Scores each machine against the answers rather than looking up a fixed
   table, so the reasoning shown to the visitor is the reasoning that picked
   it. The honest answer "the smaller one is enough" is the one that earns
   trust, so nothing here is biased toward the big machine. */
const PICKER = {
  job: [
    { id: 'clear',  weight: [3, 2, 1] },
    { id: 'bulk',   weight: [1, 3, 3] },
    { id: 'road',   weight: [2, 3, 2] },
    { id: 'rock',   weight: [0, 1, 3] },
    { id: 'finish', weight: [3, 2, 0] },
  ],
  area: [
    { id: 'small',  weight: [3, 1, 0] },
    { id: 'medium', weight: [2, 3, 2] },
    { id: 'large',  weight: [0, 2, 3] },
  ],
  ground: [
    { id: 'soft',   weight: [3, 2, 2] },
    { id: 'mixed',  weight: [2, 3, 2] },
    { id: 'hard',   weight: [0, 1, 3] },
  ],
  access: [
    { id: 'tight',  weight: [3, 1, 0] },
    { id: 'open',   weight: [1, 2, 3] },
  ],
};

let t = (k) => k;   // replaced by app.js once i18n is up

export function setTranslator(fn) { t = fn; }

function pickerState() {
  const s = {};
  for (const group of Object.keys(PICKER)) {
    const sel = $(`.picker__opt[data-group="${group}"][aria-pressed="true"]`);
    s[group] = sel ? sel.dataset.value : null;
  }
  return s;
}

function scoreMachines(state) {
  const score = [0, 0, 0];
  let answered = 0;
  for (const [group, opts] of Object.entries(PICKER)) {
    const v = state[group];
    if (!v) continue;
    answered++;
    const opt = opts.find(o => o.id === v);
    if (!opt) continue;
    for (let i = 0; i < 3; i++) score[i] += opt.weight[i];
  }
  return { score, answered };
}

function renderPickerResult() {
  const out = $('#pickerResult');
  if (!out) return;
  const state = pickerState();
  const { score, answered } = scoreMachines(state);
  const total = Object.keys(PICKER).length;

  if (answered < total) {
    out.dataset.state = 'partial';
    out.innerHTML =
      `<p class="picker__hint">${esc(t('pick.hint').replace('{n}', total - answered))}</p>`;
    return;
  }

  const best = score.indexOf(Math.max(...score));
  const m = FLEET[best];
  // a close second is worth saying out loud: it usually means the cheaper
  // machine will also do the job
  const sorted = score.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const close = sorted[1].v >= sorted[0].v - 1 ? FLEET[sorted[1].i] : null;
  const cheaper = close && sorted[1].i < best ? close : null;

  out.dataset.state = 'done';
  out.innerHTML = `
    <p class="picker__label">${esc(t('pick.result'))}</p>
    <h3 class="picker__name">${esc(m.name)}</h3>
    <p class="picker__why">${esc(t('pick.why.' + state.job))}</p>
    <dl class="picker__specs">
      <div><dt>${esc(t('mach.spec.weight'))}</dt><dd>${esc(m.specs.weight.v)} ${esc(m.specs.weight.u)}</dd></div>
      <div><dt>${esc(t('mach.spec.blade'))}</dt><dd>${esc(m.specs.blade.v)} ${esc(m.specs.blade.u)}</dd></div>
      <div><dt>${esc(t('mach.spec.power'))}</dt><dd>${esc(m.specs.power.v)} ${esc(m.specs.power.u)}</dd></div>
    </dl>
    ${cheaper ? `<p class="picker__alt">${esc(t('pick.alt').replace('{m}', cheaper.name))}</p>` : ''}
    <a class="btn" href="#contact" data-picker-cta>${esc(t('pick.cta'))}</a>`;

  const cta = out.querySelector('[data-picker-cta]');
  if (cta) {
    cta.addEventListener('click', () => {
      // carry the answer into the form so the visitor does not retype it
      const job = $('#job');
      const tons = $('#tons');
      if (tons) {
        const map = { 0: '19t', 1: '26t', 2: '38t' };
        tons.value = map[best] || '';
        tons.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (job && !job.value.trim()) {
        job.value = t('pick.prefill').replace('{m}', m.name).replace('{j}', t('pick.job.' + state.job));
        job.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }
}

function initPicker() {
  const wrap = $('#pickerBox');
  if (!wrap) return;
  for (const btn of $$('.picker__opt', wrap)) {
    btn.addEventListener('click', () => {
      for (const sib of $$(`.picker__opt[data-group="${btn.dataset.group}"]`, wrap)) {
        sib.setAttribute('aria-pressed', String(sib === btn));
      }
      renderPickerResult();
    });
  }
  $('#pickerReset')?.addEventListener('click', () => {
    for (const b of $$('.picker__opt', wrap)) b.setAttribute('aria-pressed', 'false');
    renderPickerResult();
  });
  renderPickerResult();
}

/* ═══════════════════════════ comparison table ═════════════════════════════ */
function renderCompare() {
  const tbl = $('#compare');
  if (!tbl) return;
  const rows = SPEC_ORDER.map(k => `
    <tr>
      <th scope="row">${esc(t('mach.spec.' + k))}</th>
      ${FLEET.map(m => {
        const s = m.specs[k];
        return `<td>${s ? esc(s.v) + (s.u ? ' <em>' + esc(s.u) + '</em>' : '') : '—'}</td>`;
      }).join('')}
    </tr>`).join('');
  tbl.innerHTML = `
    <thead><tr><th scope="col"><span class="sr">${esc(t('cmp.spec'))}</span></th>
      ${FLEET.map(m => `<th scope="col">${esc(m.name)}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>`;
}

/* ═════════════════════════════ FAQ accordion ══════════════════════════════ */
function initFaq() {
  for (const item of $$('.faq__item')) {
    const btn = item.querySelector('.faq__q');
    const panel = item.querySelector('.faq__a');
    if (!btn || !panel) continue;
    btn.addEventListener('click', () => {
      const open = item.dataset.open === 'true';
      // one at a time: a wall of open answers is harder to scan than a list
      for (const other of $$('.faq__item')) {
        other.dataset.open = 'false';
        other.querySelector('.faq__q')?.setAttribute('aria-expanded', 'false');
      }
      item.dataset.open = String(!open);
      btn.setAttribute('aria-expanded', String(!open));
    });
  }
}

/* ═══════════════════════════ photo lightbox ═══════════════════════════════
   The separate "recent work" gallery was cut in the owner's review because it
   showed the same thing as the work categories. The lightbox now opens from
   the work photographs themselves.                                          */
const SHOTS = '#work .cards .card--img, .gal .shot';
function initLightbox() {
  const box = $('#lightbox');
  if (!box) return;
  const img = box.querySelector('img');
  const cap = box.querySelector('.lightbox__cap');
  let shots = [];
  let at = 0;

  const show = (i) => {
    shots = $$(SHOTS);
    at = (i + shots.length) % shots.length;
    const fig = shots[at];
    img.src = fig.querySelector('img').src;
    img.alt = fig.querySelector('h3')?.textContent || '';
    cap.innerHTML = `<strong>${esc(fig.querySelector('h3')?.textContent || '')}</strong>` +
                    `<span>${esc(fig.querySelector('p')?.textContent || '')}</span>`;
    box.dataset.open = 'true';
    document.documentElement.style.overflow = 'hidden';
    box.querySelector('.lightbox__close')?.focus();
  };
  const hide = () => {
    box.dataset.open = 'false';
    document.documentElement.style.overflow = '';
  };

  $$(SHOTS).forEach((fig, i) => {
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('role', 'button');
    fig.addEventListener('click', () => show(i));
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); }
    });
  });
  box.querySelector('.lightbox__close')?.addEventListener('click', hide);
  box.querySelector('.lightbox__prev')?.addEventListener('click', () => show(at - 1));
  box.querySelector('.lightbox__next')?.addEventListener('click', () => show(at + 1));
  box.addEventListener('click', (e) => { if (e.target === box) hide(); });
  document.addEventListener('keydown', (e) => {
    if (box.dataset.open !== 'true') return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });
}

/* ══════════════════════ pointer highlight on the glass ════════════════════ */
function initGlassTracking() {
  if (matchMedia('(pointer: coarse)').matches) return;
  const panes = $$('.glass--track');
  if (!panes.length) return;
  let queued = false;
  let last = null;
  addEventListener('pointermove', (e) => {
    last = e;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      for (const p of panes) {
        const r = p.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) continue;
        p.style.setProperty('--mx', ((last.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        p.style.setProperty('--my', ((last.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }
    });
  }, { passive: true });
}

/* ═════════════════════════════ counters ═══════════════════════════════════ */
function initCounters() {
  const els = $$('[data-count]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = target + suffix;
        continue;
      }
      const t0 = performance.now();
      const dur = 900;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
}

export function initSections() {
  initBeforeAfter();
  initLazyVideo();
  initPicker();
  renderCompare();
  initFaq();
  initLightbox();
  initGlassTracking();
  initCounters();
}

/** Re-render anything whose text comes from the translator. */
export function refreshSections() {
  renderPickerResult();
  renderCompare();
}

/* ══════════════════════ before / after comparison ═════════════════════════
   A range input drives a clip width. The input is the real control, so it
   works with a keyboard and a screen reader for free; the visible handle is
   decoration positioned from the same value. */
function initBeforeAfter() {
  for (const item of $$('[data-ba]')) {
    const clip = item.querySelector('.ba__clip');
    const handle = item.querySelector('.ba__handle');
    const range = item.querySelector('.ba__range');
    if (!clip || !range) continue;
    const sizeClip = () => {
      // the clipped image is inside a shrinking box, so its width has to be
      // pinned to the frame or the "before" half squashes as you drag
      const w = item.querySelector('.ba__frame').clientWidth;
      item.style.setProperty('--baw', w + 'px');
    };
    sizeClip();
    addEventListener('resize', sizeClip, { passive: true });
    const apply = () => {
      const v = Number(range.value);
      clip.style.width = v + '%';
      if (handle) handle.style.left = v + '%';
      item.style.setProperty('--ba', v + '%');
    };
    range.addEventListener('input', apply);
    apply();

    /* People do not always see that the frame is draggable. The first time an
       item comes on screen the divider sweeps once, then settles in the
       middle. It stops the moment the visitor touches it, and it never runs
       for anyone who asked for reduced motion. */
    let hinted = false;
    let touched = false;
    range.addEventListener('pointerdown', () => { touched = true; });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || hinted) continue;
          hinted = true;
          io.disconnect();
          const t0 = performance.now();
          const step = (now) => {
            if (touched) { range.value = 50; apply(); return; }
            const k = Math.min(1, (now - t0) / 1500);
            // out to the right, back past the middle, settle at 50
            const v = 50 + 22 * Math.sin(k * Math.PI * 1.5) * (1 - k);
            range.value = String(Math.round(v));
            apply();
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      }, { threshold: 0.45 });
      io.observe(item);
    }
  }
}

/* Videos below the fold only start once they are actually on screen, so a page
   with several clips does not fetch and decode all of them at load. */
function initLazyVideo() {
  const vids = $$('[data-lazyvideo]');
  if (!vids.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) {
        if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        v.pause();
      }
    }
  }, { rootMargin: '150px 0px', threshold: 0.15 });
  vids.forEach(v => io.observe(v));
}
