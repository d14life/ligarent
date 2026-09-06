/* LIGARENT — liquid-glass-js integration.

   dashersw/liquid-glass-js renders true refractive glass: it snapshots the page
   with html2canvas and samples that texture in a WebGL shader, so what shows
   through the panel is genuinely bent, not just blurred.

   It is used for the floating "Request a machine" control only. The library
   opens its own WebGL context and re-rasterises the whole document, and this
   page already runs a three.js scene behind every section; spending that on one
   prominent control is worth it, spending it on every panel is not. Everything
   else keeps the CSS glass in assets/css/glass.css, which also stands in if the
   library fails to start.

   Loaded lazily and guarded: any failure leaves the CSS fallback visible and
   the page fully usable. */

const VENDOR = './assets/vendor/liquid-glass/';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });
}

function loadCss(href) {
  return new Promise((resolve) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = l.onerror = () => resolve();
    document.head.appendChild(l);
  });
}

let started = false;

/**
 * @param {object} opts
 * @param {() => string} opts.label  current translation of the button text
 * @param {() => void}   opts.onClick
 */
export async function initLiquidGlass(opts = {}) {
  if (started) return null;
  started = true;

  // Honour reduced motion and coarse pointers: the effect is decorative, and
  // on a phone the html2canvas pass is a real cost for no benefit.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if (matchMedia('(pointer: coarse)').matches) return null;
  if (innerWidth < 900) return null;

  try {
    await loadCss(VENDOR + 'glass.css');
    await loadScript(VENDOR + 'html2canvas.min.js');
    await loadScript(VENDOR + 'container.js');
    await loadScript(VENDOR + 'button.js');
  } catch (e) {
    console.warn('[ligarent] liquid-glass-js did not load, keeping the CSS glass:', e.message);
    return null;
  }

  // The library declares `class Button` at the top level of a classic script.
  // That creates a binding in the global LEXICAL scope, not a property on
  // window, so window.Button is undefined even though Button resolves.
  const GlassButton = (typeof Button !== 'undefined') ? Button : undefined;
  if (typeof GlassButton !== 'function') {
    console.warn('[ligarent] liquid-glass-js loaded but Button is not in scope');
    return null;
  }

  const host = document.querySelector('#liquidFab');
  const fallback = document.querySelector('.fab');
  if (!host) return null;

  let btn;
  try {
    btn = new GlassButton({
      text: opts.label ? opts.label() : 'Request a machine',
      size: 17,
      type: 'pill',
      tintOpacity: 0.26,
      warp: true,
      onClick: opts.onClick || (() => {
        document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
      })
    });
    host.appendChild(btn.element);
  } catch (e) {
    console.warn('[ligarent] liquid-glass-js failed to build the control:', e.message);
    return null;
  }

  // the real thing is up, so retire the CSS stand-in
  if (fallback) fallback.classList.add('fab--replaced');
  host.dataset.live = 'true';

  return {
    /** Keep the label in step with the language switcher. */
    setLabel(text) {
      try {
        const el = btn.element.querySelector('.glass-button-text');
        if (el) el.textContent = text;
      } catch { /* the library owns this node; ignore if its shape changes */ }
    },
    element: btn.element
  };
}
