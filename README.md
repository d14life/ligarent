# LIGARENT — bulldozer rental site

A dark, single-page site for a Caterpillar dozer rental business. Six
languages, a live 3D machine in the hero, a darkened video band, a darkened
photo gallery, and an enquiry form that drops straight into Telegram.

No build step. No framework. Upload the folder to any static host and it runs.

---

## Quick start

1. **Open `index.html`** and edit the config block near the top:

   ```js
   window.LIGARENT_CONFIG = {
     leadEndpoint : '/api/lead',          // see api/README.md
     phone        : '+7 700 000 00 00',
     whatsapp     : '+7 700 000 00 00',
     email        : 'info@ligarent.com',
   };
   ```

2. **Set up the Telegram endpoint** — follow `api/README.md`. Ten minutes.
   Until you do, the form will show its error state on submit.

3. **Upload** everything except `source/`, `tools/` and `node_modules`
   (see *What to upload* below).

That is the whole deployment.

---

## What to upload

Upload these:

```
index.html
assets/          css, js, fonts, media, models, img
api/             only if you are using the PHP endpoint
```

There is also `BRIEF.md`, a single-file brief covering the brand, the machines,
the page structure and what still needs doing. Hand that to a designer or paste
it into a design tool rather than re-explaining the project.

Do **not** upload:

| Folder | Why |
|---|---|
| `source/` | The original 59 MB FBX and texture pack. Keep it, do not serve it. |
| `tools/` | Build and test scripts. Not needed at runtime. |
| `node_modules` | A junction used only by the test script. |

Total uploaded size is about **5 MB**, most of it three.js and the 3D model.

---

## Editing the content

### Text, in any of the six languages

All copy is in **`assets/js/i18n.js`**, one block per language:
English, Russian, Spanish, French, Tatar, Chinese.

Each block has the same set of keys. Change the text on the right of the colon
and leave the key on the left alone. After editing, check nothing was dropped:

```bash
node tools/check_i18n.mjs
```

It prints a pass or tells you exactly which keys are missing from which
language.

> The Tatar and Chinese copy was written by AI. Have a native speaker read it
> before you rely on it commercially.

### Machine specifications

All the numbers live in **`assets/js/fleet.js`** — nowhere else. Change a
weight there and it updates the chips, the spec table and the floating panel
together. Sources for every published figure are in `FLEET-SOURCES.md`.

### Photographs

**Where the pictures come from.** The photographs on the page are
**AI-generated**, unbranded and illustrative — they are not photographs of
LIGARENT's own machines or jobs. The 2048 px masters are kept in
`source/generated/` and can be regenerated with `tools/gen_assets.py`. The
background video is rendered from the 3D model. Replace all of it with real
site photographs as they become available:

| File | Where it appears |
|---|---|
| `assets/media/gal_01_strip.jpg` | Large gallery card, D8R spec image, social preview |
| `assets/media/gal_02_road.jpg` | Gallery, D7R spec image |
| `assets/media/gal_03_bench.jpg` | Gallery |
| `assets/media/gal_04_plot.jpg` | Gallery, D6R spec image |
| `assets/media/gal_05_rip.jpg` | Gallery |
| `assets/media/gal_06_winter.jpg` | Gallery |
| `assets/media/mach_d6r.jpg` | Card beside the D6R specs |
| `assets/media/mach_d7r.jpg` | Card beside the D7R specs |
| `assets/media/mach_d8r.jpg` | Card beside the D8R specs |
| `assets/media/site-loop.mp4` | The video behind the "sizing" section |

**The easier route:** drop your own photographs into
`assets/media/photos/` using the names listed in the README file already in
that folder (`site-1.jpg` … `site-6.jpg`, `machine-d6r.jpg`, and so on). The
page checks for them on load and uses them if they are there, falling back to
the render for any slot you have not filled. No code change and no need to
match the render filenames.

Use **1600 × 1000** or larger. The page darkens them itself, so supply normally
exposed photographs rather than pre-darkened ones.

The captions that sit over each photo are the `site.1.t` … `site.6.b` keys in
`assets/js/i18n.js`.

### Logo

The logo is drawn as inline SVG in `index.html` (twice: header and footer) and
in `assets/img/favicon.svg`. The colours were sampled by eye from the supplied
logo image:

| | |
|---|---|
| Yellow | `#f9b000` |
| Dark red | `#9e1b23` |
| Black | `#0a0a0b` |

**Check these against your original vector file** and correct them in
`assets/css/site.css` (`--yellow`, `--red`) and in the two SVG blocks if they
are off. If you have the logo as SVG or PNG, dropping it in is better than the
rebuild — replace the `<svg>…</svg>` inside `<a class="brand">` with an `<img>`.

---

## How the page behaves

**The interface rebuilds itself as you scroll.** Each section owns a "stage",
and every persistent widget declares which stages it belongs to:

| Widget | Visible during |
|---|---|
| Section nav in the top bar | everything except the hero |
| Left section index | machines through FAQ |
| Floating spec panel (≥1600 px screens) | machines only |
| Floating "Request a machine" button | which-machine onward, gone at the form |
| Scroll hint and "live model" badge | hero only |

There are eleven sections in all: hero, machines, which machine, sizing,
what we do, rates, on site, how it works, about, FAQ and the enquiry form.

Anything leaving animates out in its own direction rather than just fading, so
the chrome visibly changes rather than scrolling past. To move a widget to
different sections, edit its `data-show="…"` attribute in `index.html`. No
JavaScript changes needed.

**The hero is a real 3D model**, not a video. It is a Cat-style D6R crawler
dozer built procedurally to the published D6R dimensions in
`tools/build_dozer.py` — elevated sprocket, 41-shoe tracks, semi-universal
blade on a C-frame, three-shank ripper. Every dimension is a sourced figure,
not an estimate, and the build prints its own measured-versus-published error
table so a change cannot silently drift. It is lit, it drifts, it tracks
the pointer, and the camera reframes as you scroll and when you pick a machine.
It falls back to a static dark background if WebGL is unavailable, and holds
still if the visitor has "reduce motion" turned on.

**At the sizing band the 3D hands over to video.** The canvas fades out, the
video fades in and plays, and the 3D animation loop stops so it is not burning
battery behind an invisible canvas.

---

## Checking your changes

```bash
node tools/verify_site.mjs
```

Starts a local server, drives the page in a real headless browser, and checks
37 things: no console errors, the 3D actually draws, scrolling changes the
scene, every language renders with no missing text, the form blocks empty
submits and sends all five fields, text over the video clears the 4.5:1
contrast standard, nothing overflows sideways at 390 / 768 / 1440 px, and no
Telegram token has leaked into a client file.

It writes screenshots to `tools/shots/` — look at them.

```bash
node tools/check_i18n.mjs      # language key parity across both copy files
node api/test-message.mjs      # Telegram message formatting
python tools/gen_assets.py source/generated   # regenerate the photography
```

### The interactive parts

| Feature | Where it lives |
|---|---|
| Machine picker, four questions to a recommendation | `assets/js/sections.js` |
| Side-by-side comparison table | built from `fleet.js`, so it never drifts |
| Rate cards | figures come from `LIGARENT_CONFIG.rates`; empty shows "on request" |
| FAQ accordion | one open at a time |
| Gallery lightbox | click, or keyboard with arrows and Escape |
| Liquid glass panels | `assets/css/glass.css` |

The picker scores each machine against the answers rather than reading a fixed
table, and will tell a visitor the cheaper machine also fits when it does.

### Liquid glass

Built with CSS `backdrop-filter`, a masked gradient border and one SVG
displacement filter, rather than with `liquid-glass-js`. That library runs its
own WebGL context and re-rasterises the page with html2canvas; this page already
has a three.js scene behind everything, and two WebGL contexts plus repeated
full-page rasterisation is a poor trade for an effect that composites natively.
Same look, near-zero cost, and it degrades to a plain translucent panel where
`backdrop-filter` is unsupported.

---

## Rebuilding the 3D model and the imagery

Only needed if you swap the machine model. Requires Blender 4.5.

```bash
# the three machines, each to its own published dimensions, about 950 KB each
blender -b -noaudio -P tools/build_dozer.py -- assets/models/dozer-d6r.glb d6r
blender -b -noaudio -P tools/build_dozer.py -- assets/models/dozer-d7r.glb d7r
blender -b -noaudio -P tools/build_dozer.py -- assets/models/dozer-d8r.glb d8r

# one dark card per machine, framed so the D8R reads bigger than the D6R
blender -b -noaudio -P tools/render_cards.py -- assets/media \
  assets/models/dozer-d6r.glb assets/models/dozer-d7r.glb assets/models/dozer-d8r.glb

# ANY supplied machine model goes through this one: point it at the .fbx and
# its texture folder
blender -b -noaudio -P tools/build_glb.py -- \
  source/wheel-loader/source/volvo_test.fbx \
  source/wheel-loader/textures \
  assets/models/loader-wheel.glb 1024

# look at what you just built, including a straight-down view
blender -b -noaudio -P tools/verify_glb.py -- assets/models/dozer.glb tools/dozer_check

# re-render the six stills and the video loop from whichever model is in use
blender -b -noaudio -P tools/render_media.py -- assets/models/dozer.glb assets/media all
```

`tools/render_media.py` computes camera distance from the machine's measured
footprint and the lens, so a shot cannot silently crop the machine off the
edge. Machine headings are fixed constants, never derived from `hash()`, which
is randomised per process in Python and would make renders unreproducible.

---

## Swapping the hero machine

`heroModel` at the top of `index.html` picks which GLB the hero loads:

| File | What it is |
|---|---|
| `assets/models/dozer.glb` | the D6R, currently in the hero |
| `assets/models/dozer-d6r.glb` | same machine, explicitly named |
| `assets/models/dozer-d7r.glb` | the D7R, at its own published dimensions |
| `assets/models/dozer-d8r.glb` | the D8R, at its own published dimensions |
| `assets/models/loader-wheel.glb` | the wheel loader supplied first, kept as a fallback |

All three dozers come from the same script; the machine is chosen by argument:

```bash
blender -b -noaudio -P tools/build_dozer.py -- assets/models/dozer-d8r.glb d8r
```

To use a different model, export it as **FBX, OBJ or GLB** and run
`tools/build_glb.py` on it, then point `heroModel` at the result.

A **`.max` file cannot be used.** It is 3ds Max's native format and only 3ds
Max can open it — Blender, and every free converter, cannot. If a model is only
offered as `.max`, go back to where it came from and download the FBX or OBJ
version of the same model instead.

## Known limitations

- **The hero dozer is stylised, not photoreal.** It is dimensionally correct
  and clearly a Cat-style crawler dozer, but it is built from primitives with
  flat PBR materials, so it has no dirt, no decals and no surface history. A
  properly textured model dropped through `tools/build_glb.py` would look
  better; the pipeline is ready for one.
- **It is a Cat-*style* machine, not a Caterpillar model.** The dimensions come
  from the published D6R spec and the paint is the LIGARENT yellow. No
  Caterpillar branding, trade dress or CAD is used.
- **Tatar and Chinese copy is machine-written** and wants a native check.
- **The brand colours were sampled by eye** from a logo image, not from a
  vector file.
- **Privacy and Terms links in the footer go nowhere.** They need real pages
  before you take live traffic in the EU or the UK.

---

## Trademarks

Cat® and Caterpillar® are trademarks of Caterpillar Inc. LIGARENT is an
independent rental company and is not affiliated with, endorsed by, or
sponsored by Caterpillar Inc. That disclaimer is already in the footer in all
six languages — leave it there.
