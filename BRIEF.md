# LIGARENT — complete brief

Everything needed to rebuild, redesign or extend this site, in one file. Paste
it into a design tool, hand it to a designer, or keep it as the source of truth.

---

## The business

**LIGARENT** (Cyrillic: ЛИГАРЕНТ), at **ligarent.ru**. A bulldozer rental
company. Not a broker and not a large fleet: they own **three Caterpillar
crawler dozers** and hire them out with an operator, by the shift or by the
month.

The whole proposition is that a customer describes a job in plain words and
LIGARENT tells them which machine to take. Everything on the site should push
toward one action: send an enquiry.

## The three machines

| | Cat D6R | Cat D7R | Cat D8R |
|---|---|---|---|
| Variant | XL, Power Shift | XR Series II | Series II |
| Operating weight | 19 010 kg | 25 880 kg | 37 630 kg |
| Net power | 175 hp / 130 kW | 240 hp / 179 kW | 310 hp / 231 kW **gross** |
| Engine | Cat 3306 T | Cat 3176C | Cat 3406E TA |
| Blade capacity | 5.66 m³ | 6.88 m³ | 8.72 m³ |
| Blade width | 3.26 m | 3.69 m | 3.96 m |
| Length with blade | 5.33 m | 6.03 m | 6.57 m |

Every figure is manufacturer-published, converted from imperial. Sources and
the raw values are in `FLEET-SOURCES.md`. The D8R power figure is gross while
the other two are net; that is how the source publishes them and the site says
so rather than quietly mixing the two.

## Brand

| Role | Value | Notes |
|---|---|---|
| Yellow | `#f9b000` | from the logo; primary accent, buttons, headline emphasis |
| Dark red | `#9e1b23` | logo bars only, plus the scroll progress gradient |
| Ink | `#0a0a0b` | page background |
| Surfaces | `#0d0d0f`, `#131317`, `#1a1a1f` | cards, panels, form |
| Hairlines | `#1f1f26`, `#2c2c34` | borders and dividers |
| Text | `#f4f4f2`, `#a8a8b0`, `#6f6f7a` | primary, secondary, tertiary |

Colours were sampled by eye from a logo image, not from a vector file. Check
them against the original.

**Logo**: black heavy italic wordmark on a yellow field, with a dark red bar
across the top and bottom. Rebuilt as inline SVG in `index.html`. If a vector
original exists, use it instead.

**Type**: Roboto Condensed for display (heavy, italic), Inter for body. Both are
self-hosted, both carry Latin and Cyrillic. Chinese falls through to the system
CJK stack. Archivo was the first choice and was dropped because it has no
Cyrillic, which would have left Russian and Tatar headings in a fallback face.

**Tone**: plain, concrete, no marketing froth. "Nineteen tonnes trims a pad and
finishes a driveway" rather than "world-class solutions". Short sentences.
Numbers where numbers help.

## Page structure

One page, seven sections, each of which owns the interface while it is on
screen:

1. **Hero** — live 3D machine, headline, two calls to action
2. **Stat strip** — four figures: 3 machines, 19–38 t, under 2 h to a price, 24/7
3. **Machines** — a chip per machine, live spec table, photo, "best for"
4. **Sizing** — darkened background video with copy over it, three points
5. **What we do** — six job types
6. **On site** — darkened photo gallery with captions over each image
7. **How it works** — four steps
8. **Enquiry form** — five fields, then the footer

## The behaviour that matters

**The interface rebuilds itself as you scroll.** Every persistent widget
declares the sections it belongs to, and animates out in its own direction when
it leaves rather than just fading:

| Widget | On screen during |
|---|---|
| Section nav | everything except the hero |
| Left section index | machines through how-it-works |
| Floating spec panel | machines only, and only above 1600 px |
| Floating request button | sizing onward, gone at the form |
| Scroll hint, live-model badge | hero only |

**The 3D hands over to video** at the sizing band: the canvas fades out, the
video fades in, and the render loop stops so it is not burning battery behind
an invisible canvas.

## The enquiry

Five fields, because five is what it takes to price a job:

1. Contact phone
2. WhatsApp number, separately (defaulted to the same, one tick to change)
3. The job, in words, and which dozer if they know
4. Roughly what size machine, as a weight class tied to the three machines
5. Site location

Plus an optional name. It posts to an endpoint that formats a Telegram message
and delivers it to the dispatcher. The bot token lives on the server and never
reaches the browser.

## Languages

Six, all complete, switchable from the header: **English, Russian, Spanish,
French, Tatar, Chinese**. All copy lives in `assets/js/i18n.js`, one block per
language with identical keys. Tatar and Chinese were machine-written and want a
native reader.

## What still needs doing

- Real site photographs. Drop them into `assets/media/photos/` using the names
  in that folder's README and the page picks them up with no code change.
- A properly textured machine model. The current one is built from primitives
  and is dimensionally right but has no dirt, decals or wear. Any FBX, OBJ or
  GLB goes in through `tools/build_glb.py`. A `.max` file cannot be used by
  anything except 3ds Max.
- Privacy and Terms pages. The footer links go nowhere.
- Confirm the brand colours against the vector logo.

## Legal

Cat® and Caterpillar® are trademarks of Caterpillar Inc. LIGARENT is an
independent rental company, not affiliated with or endorsed by Caterpillar. The
disclaimer is in the footer in all six languages and should stay there. The 3D
machine is a Cat-*style* dozer built from published dimensions; it carries no
Caterpillar branding and is not Caterpillar CAD.
