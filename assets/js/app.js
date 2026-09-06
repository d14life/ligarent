/* LIGARENT — page controller.
   Owns: language, the scroll-driven interface stages, the machine selector,
   the 3D hero handoff to video, and the enquiry form. */

import { T, LOCALES } from './i18n.js';
import { EXTRA } from './i18n-extra.js';
import { MORE } from './i18n-more.js';
import { BA } from './i18n-ba.js';
import { BRAND } from './i18n-brand.js';
import { WORK } from './i18n-work.js';
import { initSections, refreshSections, setTranslator } from './sections.js';
import { initLiquidGlass } from './liquid.js';
import { FLEET, SPEC_ORDER } from './fleet.js';

const CFG = window.LIGARENT_CONFIG || {};

// merge the added sections' copy into the main dictionary
for (const [loc, block] of Object.entries(EXTRA)) {
  if (T[loc]) Object.assign(T[loc], block);
}
for (const [loc, block] of Object.entries(MORE)) {
  if (T[loc]) Object.assign(T[loc], block);
}
for (const [loc, block] of Object.entries(BA)) {
  if (T[loc]) Object.assign(T[loc], block);
}
for (const [loc, block] of Object.entries(BRAND)) {
  if (T[loc]) Object.assign(T[loc], block);
}
for (const [loc, block] of Object.entries(WORK)) {
  if (T[loc]) Object.assign(T[loc], block);
}
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;

/* ════════════════════════════ language ════════════════════════════════════ */
// The business and its customers are Russian-speaking, so Russian is the
// default. A visitor whose browser asks for another supported language still
// gets it, and a saved choice always wins.
const DEFAULT_LANG = 'ru';
const FALLBACK = 'en';          // only used to fill a key a locale is missing
let lang = DEFAULT_LANG;

function pickLang() {
  // A visitor's own earlier choice wins. Otherwise the site opens in Russian
  // for everyone. It deliberately does NOT follow the browser language: the
  // customers are Russian-speaking, and an English browser in the office was
  // enough to open the whole site in English.
  const saved = (() => { try { return localStorage.getItem('ligarent.lang'); } catch { return null; } })();
  if (saved && LOCALES[saved]) return saved;
  return DEFAULT_LANG;
}

/** Never returns undefined: falls back to English, then to the key itself. */
function t(key) {
  const d = T[lang];
  if (d && key in d) return d[key];
  const f = T[FALLBACK];
  if (f && key in f) return f[key];
  return key;
}

function applyLang(next) {
  lang = LOCALES[next] ? next : DEFAULT_LANG;
  try { localStorage.setItem('ligarent.lang', lang); } catch { /* private mode */ }

  html.lang = lang;
  html.dir = LOCALES[lang].dir || 'ltr';

  for (const el of $$('[data-i18n]')) el.textContent = t(el.dataset.i18n);

  for (const el of $$('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(',')) {
      const i = pair.indexOf(':');
      if (i < 0) continue;
      el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
    }
  }

  document.title = t('meta.title');
  const md = $('meta[name="description"]');
  if (md) md.setAttribute('content', t('meta.desc'));

  for (const b of $$('.lang__menu button'))
    b.setAttribute('aria-selected', String(b.dataset.lang === lang));
  const cur = $('.lang__btn .lang__cur');
  if (cur) cur.textContent = LOCALES[lang].short;

  renderMachine(currentMachine, true);
  renderRates();
  refreshSections();
  if (liquid) liquid.setLabel(t('nav.cta'));
}

function buildLangMenu() {
  const menu = $('.lang__menu');
  const wrap = $('.lang');
  if (!menu || !wrap) return;
  menu.innerHTML = '';
  for (const [code, meta] of Object.entries(LOCALES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.lang = code;
    b.setAttribute('role', 'option');
    b.innerHTML = `<span>${meta.short}</span><span>${meta.label}</span>`;
    b.addEventListener('click', () => {
      applyLang(code);
      wrap.dataset.open = 'false';
    });
    menu.appendChild(b);
  }
  const btn = $('.lang__btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    wrap.dataset.open = wrap.dataset.open === 'true' ? 'false' : 'true';
  });
  document.addEventListener('click', () => { wrap.dataset.open = 'false'; });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') wrap.dataset.open = 'false';
  });
}

/* ═══════════════════ scroll-driven interface stages ═══════════════════════
   Each <section data-stage="x"> owns the interface while it covers the middle
   of the viewport. Chrome elements list the stages they belong to in
   data-show; anything not listed animates out. This is what makes the UI
   visibly rebuild as you scroll rather than just scrolling past.            */
const STAGE_ORDER = ['hero', 'process', 'machines', 'picker', 'work',
                     'coverage', 'faq', 'contact'];
// null, not 'hero': the first call must actually run so the chrome starts in
// its correct state. Seeding it with 'hero' made setStage('hero') an early
// return and left every widget visible over the hero.
let stage = null;

function setStage(next) {
  if (next === stage) return;
  stage = next;
  html.dataset.stage = stage;

  for (const el of $$('[data-show]')) {
    const list = el.dataset.show.split(/\s+/).filter(Boolean);
    const on = list.includes('*') || list.includes(stage);
    el.classList.toggle('is-in', on);
    el.classList.toggle('is-out', !on);
    el.setAttribute('aria-hidden', String(!on));
  }

  for (const a of $$('.rail a, .topbar__nav a')) {
    const id = (a.getAttribute('href') || '').replace('#', '');
    a.setAttribute('aria-current', String(id === stage));
  }
}

function initStages() {
  const sections = $$('section[data-stage]');
  if (!sections.length) return;

  // Whichever section covers the viewport centre owns the stage. An
  // IntersectionObserver ratio alone gets this wrong for tall sections.
  let ticking = false;
  const evaluate = () => {
    ticking = false;
    // getBoundingClientRect, not offsetTop: offsetTop is measured against the
    // nearest positioned ancestor, and sampling at 0.42 of the viewport put the
    // probe in the previous section at some boundaries. This is viewport-
    // relative and samples the middle of the screen.
    // Whichever section fills most of the screen owns the stage. Probing a
    // single midpoint tied whenever two sections met near that line, so
    // adjacent stages kept swapping under it.
    // The section whose centre sits nearest the middle of the screen wins,
    // among those actually on screen. Earlier attempts scored by visible
    // pixels, which let a tall neighbour out-vote a short section that was
    // fully in view, and by a single midpoint probe, which tied wherever two
    // sections met near that line. Nearest-centre is unambiguous and is
    // exactly what scrolling a section into view produces.
    const mid = innerHeight / 2;
    let best = sections[0], bestDist = Infinity;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= innerHeight) continue;   // off screen
      const dist = Math.abs((r.top + r.bottom) / 2 - mid);
      if (dist < bestDist) { bestDist = dist; best = s; }
    }
    setStage(best.dataset.stage);

    // progress bar across the whole document
    const max = document.body.scrollHeight - innerHeight;
    html.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : '0');

    // 3D camera progress: 0 at the top of the hero, 1 once machines is settled
    const hero = $('#hero');
    if (hero && scene3d) {
      const span = hero.offsetHeight * 1.35;
      scene3d.setProgress(span > 0 ? scrollY / span : 0);
    }
    handoff();
    if (plow) plow.refresh();
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(evaluate); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  evaluate();
}

/* ═══════════════ 3D → video handoff on the sizing band ════════════════════ */
let scene3d = null;
let video = null;
let videoOn = false;
let plow = null;
let liquid = null;

function handoff() {
  const band = $('#sizing');
  const canvas = $('#gl');
  if (!band || !video) return;
  const r = band.getBoundingClientRect();
  // fade the video in as the sizing band takes the screen
  const want = r.top < innerHeight * 0.62 && r.bottom > innerHeight * 0.18;
  if (want === videoOn) return;
  videoOn = want;
  video.style.opacity = want ? '1' : '0';
  if (canvas) canvas.style.opacity = want ? '0' : '1';
  if (scene3d) scene3d.setActive(!want);
  if (plow) plow.setEnabled(!want);
  if (want) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
  else video.pause();
}

/* ═══════════════════════════ machine selector ═════════════════════════════ */
let currentMachine = 0;

function renderMachine(i, quiet) {
  currentMachine = i;
  const m = FLEET[i];
  if (!m) return;

  for (const c of $$('.chip'))
    c.setAttribute('aria-selected', String(Number(c.dataset.i) === i));

  const nameEl = $('#machName');
  if (nameEl) nameEl.textContent = m.name;

  const blurbEl = $('#machBlurb');
  if (blurbEl) blurbEl.textContent = t(m.blurb);

  const specs = $('#machSpecs');
  if (specs) {
    specs.innerHTML = '';
    for (const k of SPEC_ORDER) {
      const s = m.specs[k];
      if (!s) continue;
      const d = document.createElement('div');
      d.className = 'spec';
      d.innerHTML =
        `<dt>${escape_(t('mach.spec.' + k))}</dt>` +
        `<dd>${escape_(s.v)}${s.u ? ' <em>' + escape_(s.u) + '</em>' : ''}` +
        `${s.note ? '<br><em>' + escape_(s.note) + '</em>' : ''}</dd>`;
      specs.appendChild(d);
    }
  }

  const useEl = $('#machUse');
  if (useEl) useEl.textContent = t(m.use);

  const hud = $('#hudList');
  if (hud) {
    hud.innerHTML = '';
    for (const k of ['weight', 'power', 'blade']) {
      const s = m.specs[k];
      if (!s) continue;
      const d = document.createElement('div');
      d.innerHTML = `<dt>${escape_(t('mach.spec.' + k))}</dt><dd>${escape_(s.v)} ${escape_(s.u)}</dd>`;
      hud.appendChild(d);
    }
  }
  const hudName = $('#hudName');
  if (hudName) hudName.textContent = m.name;

  loadMachineImage(i);
  for (const img of $$('.mach__viz img'))
    img.classList.toggle('on', Number(img.dataset.i) === i);

  const tag = $('#machTag');
  if (tag) tag.textContent = m.name;

  if (!quiet && scene3d) scene3d.focus(i);
}

/* Fetch one machine photograph, once, at the moment it is first shown. If the
   client has dropped a real photo into assets/media/photos/ for this machine,
   that is probed here rather than at boot, and wins over the render. */
const machineProbed = new Set();
async function loadMachineImage(i) {
  const img = document.querySelector(`.mach__viz img[data-i="${i}"]`);
  if (!img || img.getAttribute('src')) return;
  if (!machineProbed.has(i)) {
    machineProbed.add(i);
    const m = FLEET[i];
    if (m) {
      const real = await tryPhoto(`${PHOTO_DIR}machine-${m.id}.jpg`);
      if (real) { m.image = real; img.dataset.src = real; }
    }
  }
  if (img.getAttribute('src')) return;
  const src = img.dataset.src;
  if (src) img.setAttribute('src', src);
}

function escape_(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function initMachines() {
  const pick = $('#machPick');
  if (!pick) return;
  pick.innerHTML = '';
  FLEET.forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.i = String(i);
    b.setAttribute('role', 'tab');
    b.innerHTML = `${escape_(m.name)}<small>${escape_(m.specs.weight.note || '')}</small>`;
    b.addEventListener('click', () => renderMachine(i));
    pick.appendChild(b);
  });

  const viz = $('.mach__viz');
  if (viz) {
    FLEET.forEach((m, i) => {
      // width/height are the photographs' real 4:3, so the panel reserves its
      // space before the image decodes instead of jumping when it lands
      const img = new Image(1200, 900);
      // src is deliberately withheld: see loadMachineImage. All three used to
      // download at first paint for a section far below the fold.
      img.dataset.src = m.image;
      img.alt = m.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.setAttribute('width', '1200');
      img.setAttribute('height', '900');
      img.dataset.i = String(i);
      viz.insertBefore(img, viz.firstChild);
    });
  }
  renderMachine(0, true);
}

/* ═════════════════════════════ the form ═══════════════════════════════════ */
function initForm() {
  const form = $('#lead');
  if (!form) return;

  const waSame = $('#waSame');
  const wa = $('#wa');
  const phone = $('#phone');

  const syncWa = () => {
    if (!waSame || !wa) return;
    wa.disabled = waSame.checked;
    if (waSame.checked) { wa.value = phone.value; clearErr(wa); }
  };
  waSame?.addEventListener('change', syncWa);
  phone?.addEventListener('input', () => { if (waSame?.checked) wa.value = phone.value; });

  const setErr = (el, key) => {
    const f = el.closest('.field');
    if (!f) return;
    f.dataset.bad = 'true';
    const e = f.querySelector('.field__err');
    if (e) e.textContent = t(key);
    el.setAttribute('aria-invalid', 'true');
  };
  const clearErr = (el) => {
    const f = el.closest('.field');
    if (f) f.dataset.bad = 'false';
    el.removeAttribute('aria-invalid');
  };
  for (const el of $$('#lead input, #lead select, #lead textarea'))
    el.addEventListener('input', () => clearErr(el));

  // Loose on purpose: this has to accept every country the client works in.
  const phoneOk = (v) => (String(v).match(/\d/g) || []).length >= 7;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const fields = [
      ['phone', $('#phone'), 'phone'],
      ['whatsapp', $('#wa'), 'phone'],
      ['job', $('#job'), 'text'],
      ['tons', $('#tons'), 'text'],
      ['location', $('#loc'), 'text']
    ];

    let bad = null;
    for (const [, el, kind] of fields) {
      if (!el) continue;
      const v = el.value.trim();
      if (!v) { setErr(el, 'form.req'); bad = bad || el; continue; }
      if (kind === 'phone' && !phoneOk(v)) { setErr(el, 'form.phone.bad'); bad = bad || el; }
    }
    if (bad) { bad.focus(); bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }

    const btn = $('#leadSubmit');
    const label = btn.querySelector('span');
    const prev = label.textContent;
    btn.disabled = true;
    label.textContent = t('form.sending');

    const tonsSel = $('#tons');
    const payload = {
      name: $('#name')?.value.trim() || '',
      phone: $('#phone').value.trim(),
      whatsapp: $('#wa').value.trim(),
      job: $('#job').value.trim(),
      tons: tonsSel.options[tonsSel.selectedIndex]?.textContent.trim() || tonsSel.value,
      tonsKey: tonsSel.value,
      location: $('#loc').value.trim(),
      lang,
      page: location.href,
      ref: document.referrer || '',
      ts: new Date().toISOString()
    };

    try {
      if (!CFG.leadEndpoint) throw new Error('leadEndpoint is not configured');
      const res = await fetch(CFG.leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('endpoint returned ' + res.status);
      form.dataset.state = 'ok';
    } catch (err) {
      console.error('[ligarent] enquiry failed:', err);
      form.dataset.state = 'err';
    } finally {
      btn.disabled = false;
      label.textContent = prev;
    }
    form.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  $('#again')?.addEventListener('click', () => {
    form.reset();
    form.dataset.state = '';
    syncWa();
  });
  $('#retry')?.addEventListener('click', () => { form.dataset.state = ''; });

  syncWa();
}

/* ═══════════════════════════ small niceties ═══════════════════════════════ */
/* Real photographs, if the client has dropped any in.
   assets/media/photos/ overrides the 3D renders per slot, so site photos can be
   added one at a time with no code change. A slot with no file simply keeps the
   render, and a 404 here is expected rather than an error. */
const PHOTO_DIR = './assets/media/photos/';

function tryPhoto(url) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im.naturalWidth > 8 ? url : null);
    im.onerror = () => resolve(null);
    im.src = url;
  });
}

async function initPhotos() {
  const shots = $$('.gal .shot img');
  await Promise.all(shots.map(async (img, i) => {
    const url = await tryPhoto(`${PHOTO_DIR}site-${i + 1}.jpg`);
    if (url) img.src = url;
  }));

  // Only the machine on screen is probed at boot. tryPhoto downloads the file
  // to test it, so probing all three cost 628 KB before anyone had scrolled;
  // the other two are probed by loadMachineImage when their tab is pressed.
  // Nothing about the machines section is fetched until it is within a screen
  // of the viewport: at boot it cost 224 KB for a section nobody had reached.
  const machSec = $('#machines');
  if (machSec && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      loadMachineImage(currentMachine);
    }, { rootMargin: '900px' });
    io.observe(machSec);
  } else {
    loadMachineImage(0);
  }

  await Promise.all([].map(async (m, i) => {
    const url = await tryPhoto(`${PHOTO_DIR}machine-${m.id}.jpg`);
    if (!url) return;
    m.image = url;
    const el = $(`.mach__viz img[data-i="${i}"]`);
    // only replace the src of a photograph that is already on screen; the
    // others keep it in dataset until their tab is pressed
    if (el) { el.dataset.src = url; if (el.getAttribute('src')) el.setAttribute('src', url); }
  }));

}

/* Rate figures live in the config block so the client can set them without
   touching code. An empty value shows "on request" rather than a fake number,
   because publishing a wrong price costs more than publishing none. */
function renderRates() {
  const rates = CFG.rates || {};
  for (const el of $$('[data-rate]')) {
    const v = String(rates[el.dataset.rate] || '').trim();
    el.textContent = v || t('rate.ask');
    el.classList.toggle('rate__p--ask', !v);
  }
}

function initReveal() {
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
  for (const el of $$('.rise')) io.observe(el);
}

function initMenu() {
  const b = $('.burger');
  b?.addEventListener('click', () => {
    html.dataset.menu = html.dataset.menu === 'open' ? 'closed' : 'open';
  });
  for (const a of $$('.topbar__nav a'))
    a.addEventListener('click', () => { html.dataset.menu = 'closed'; });
}

function initPointer() {
  if (matchMedia('(pointer: coarse)').matches) return;
  addEventListener('pointermove', (e) => {
    if (!scene3d) return;
    scene3d.setPointer((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2);
  }, { passive: true });
}

function initContactLinks() {
  const digits = (s) => String(s || '').replace(/[^\d+]/g, '');
  for (const el of $$('[data-tel]')) {
    el.href = 'tel:' + digits(CFG.phone);
    if (el.dataset.fill === 'text') el.textContent = CFG.phone || '';
  }
  for (const el of $$('[data-wa]')) {
    el.href = 'https://wa.me/' + digits(CFG.whatsapp).replace(/^\+/, '');
    if (el.dataset.fill === 'text') el.textContent = CFG.whatsapp || '';
  }
  for (const el of $$('[data-mail]')) {
    el.href = 'mailto:' + (CFG.email || '');
    if (el.dataset.fill === 'text') el.textContent = CFG.email || '';
  }
  const y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());
}

/* ═══════════════════════════════ boot ═════════════════════════════════════ */
function boot() {
  buildLangMenu();
  initMenu();
  initMachines();
  initForm();
  initReveal();
  initContactLinks();
  applyLang(pickLang());

  video = $('#bgVideo');

  // Lean mode. Hidden rather than removed, and the section index, the stage
  // machine and the nav all read the DOM, so they follow automatically.
  if (CFG.lean) {
    for (const id of CFG.leanHides || []) {
      const el = document.getElementById(id);
      if (el) el.remove();
      for (const a of document.querySelectorAll(`a[href="#${id}"]`))
        a.closest('li') ? a.closest('li').remove() : a.remove();
    }
    document.body.classList.add('is-lean');
  }

  // The hero is the film clip. The 3D machine and the blade that pushed the
  // interface were removed at the client's request (2026-09-05); the build
  // tools and models are kept under source/3d-removed if it ever comes back.
  // One backdrop: the film. No poster and no still — the owner asked for the
  // photograph to go, so the scene's dark ground shows until the film starts.
  if (video) {
    video.style.opacity = '1';
    // Two films, one after the other, looping for ever. The loop attribute
    // cannot do this — it would replay the first clip and never reach the
    // second — so the playlist advances on 'ended'.
    // Pick the light copies on a small screen OR a slow line. Served through a
    // tunnel off a home upload, the 1440-wide file arrived so late that the
    // hero was still black when the loader gave up — the connection, not the
    // code, decides which file is the right one.
    // Measured on the live site: Chrome reported effectiveType '3g', downlink
    // 1.3 — so the old heuristic handed an 854px file to a 1440px screen and
    // the hero looked soft. Resolution follows the screen; the line only gets
    // a say when the visitor has explicitly asked to save data.
    const conn = navigator.connection || {};
    const small = matchMedia('(max-width: 900px)').matches || conn.saveData === true;
    const list = small ? (CFG.heroFilmsSm || CFG.heroFilms)
                       : (CFG.heroFilms || CFG.heroFilmsSm);
    const playlist = (Array.isArray(list) ? list.slice()
      : [CFG.heroVideo, CFG.heroVideo2]).filter(Boolean);
    let at = 0;
    // Autoplay only survives if the element is provably muted at the moment
    // play() is called — the attribute alone was not enough, and the rejected
    // promise used to be swallowed, so the hero sat frozen on frame 0 with the
    // whole film buffered. Measured on the live site 2026-09-06.
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    window.__heroFilm = { blocked: false, started: false, src: '' };
    const tryPlay = () => {
      const pl = video.play();
      window.__heroFilm.attempts = (window.__heroFilm.attempts || 0) + 1;
      if (pl && pl.catch) {
        pl.then(() => {
          window.__heroFilm.blocked = false;
          window.__heroFilm.started = true;
          window.__heroFilm.error = null;
        }).catch((e) => {
          // record WHY. Swallowing this is what hid a frozen hero for two days:
          // NotAllowedError is a policy refusal, AbortError is our own load()
          // interrupting a pending play, and they need different answers.
          window.__heroFilm.blocked = true;
          window.__heroFilm.error = { name: e && e.name, message: String(e && e.message).slice(0, 140) };
        });
      }
    };
    const playClip = (i) => {
      if (!playlist.length) return;
      at = (i + playlist.length) % playlist.length;
      video.src = playlist[at];
      window.__heroFilm.src = playlist[at];
      // no load() here: it interrupts the play() below with an AbortError,
      // which then reads as "autoplay blocked" when nothing was blocked
      tryPlay();
    };
    /* Chrome's own words for the refusal: "video-only background media was
       paused to save power" (AbortError). It applies to muted, audio-less
       video whenever the page is not being displayed — a tab opened in the
       background, an occluded window, a hidden panel. One play() call at load
       is therefore not enough; the film has to be nudged whenever the page
       becomes watchable again. */
    for (const ev of ['pointerdown', 'touchstart', 'keydown', 'scroll', 'mousemove', 'focus']) {
      addEventListener(ev, () => { if (video.paused) tryPlay(); }, { passive: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && video.paused) tryPlay();
    });
    // and a short poll: if it is on screen, visible and still parked, ask again
    let nudges = 0;
    const nudge = setInterval(() => {
      if (++nudges > 40) return clearInterval(nudge);
      if (document.hidden || !video.paused) return;
      tryPlay();
    }, 1500);
    video.addEventListener('playing', () => clearInterval(nudge));
    video.addEventListener('ended', () => playClip(at + 1));
    // a clip that fails for any reason must not stall the hero on a frozen frame
    video.addEventListener('error', () => { if (playlist.length > 1) playClip(at + 1); });
    const startFilm = () => {
      if (video.src) return;
      playClip(0);
    };
    // Start immediately, behind the loading screen. It used to wait for the
    // loader to clear, which is why the site looked half-loaded on arrival:
    // the screen lifted and only then did the film begin downloading.
    startFilm();
  }

  document.body.classList.add('is-ready', 'no-3d');

  setTranslator(t);
  initSections();
  if (CFG.liquidGlass) {
    initLiquidGlass({
      label: () => t('nav.cta'),
      onClick: () => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
    }).then((api) => { liquid = api; });
  }
  renderRates();
  initStages();
  initPointer();
  initPhotos();
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
else boot();
