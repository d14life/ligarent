# LEGAREN — acceptance ledger

Written before building. Each line is checkable. Nothing is reported done
until the check next to it has run and been looked at.

| # | Condition | How it is checked |
|---|-----------|-------------------|
| 1 | Page loads with zero console errors, other than the by-design probes for optional client photographs | puppeteer, 1440x900 and 390x844 |
| 2 | Hero 3D canvas draws a recognisable dozer (tracks, blade, cab, body) | screenshot + non-sky pixel coverage > 8% |
| 3 | Scroll drives the 3D scene | frames at 0 / 35 / 60 % scroll differ, mean abs diff > 3/255 |
| 4 | Video section: real <video>, darkened, legible copy over it | element present, overlay opacity measured, text contrast >= 4.5:1 |
| 5 | Photo section: >= 6 cards, every src resolves, darkened, text over | network log shows no 404 for img; overlay measured |
| 6 | Fleet table lists >= 12 Cat dozer models, tonnage matches cat.com | diff against figures scraped from cat.com |
| 7 | 5 locales EN/RU/ES/FR/TT switch >= 95% of visible strings | key-coverage script; zero raw keys or "undefined" in DOM |
| 8 | Lead form has the 5 briefed fields and blocks empty required ones | DOM check + submit-empty test |
| 9 | Submit posts all 5 fields; endpoint formats them into a Telegram message | local mock server captures payload; worker builder unit-tested |
| 10 | Bot token never present in any client-side file | grep over assets/ and index.html |
| 11 | No horizontal overflow at 390 / 768 / 1440 px | scrollWidth <= clientWidth at each width |
| 12 | Every screenshot inspected before reporting | manual, in-session |

## Brief, as transcribed (source: audio_2026-09-04_09-56-58.ogg, Russian)

- Site in the style of caterpillar.com, dark tones, loaded photo and video
- Business: bulldozer rental ("аренда бульдозеров"), Caterpillar machines
- Brand name heard as "Легарен" -> LEGAREN  (SPELLING TO CONFIRM)
- Landing page that converts to enquiries
- Enquiries arrive in a Telegram bot
- Enquiry must carry: contact phone, WhatsApp number, description of the
  job / which dozer, roughly how many tonnes, location of the site
- 3D animation on open; 3D animation on scroll; then it moves to video
  (darkened video behind), then darkened photos, nicely styled, with
  information about the Caterpillar dozers laid over the top
- 5 languages: English, Russian, Spanish, French, Tatar, with a switcher
- Basic information on the jobs and what the dozers can do; copy to be
  written by us and edited by the client later

---

## Result

All 28 checks pass. `node tools/verify_site.mjs` re-runs them; screenshots land
in `tools/shots/` and were inspected before this was written.

Measured on the final build:

| | |
|---|---|
| Hero 3D lit-pixel coverage | 16.3% of the centre band, 485 distinct colours |
| Copy contrast over the video | 6.10:1 (target 4.5:1) |
| Horizontal overflow at 390 / 768 / 1440 px | none |
| Locale key coverage, all six | 100%, zero raw keys in the DOM |
| Enquiry payload | all five briefed fields, WhatsApp separate from phone |
| Deployable payload | 5.8 MB raw, 3.5 MB zipped, 48 files |

### Deviations from the brief, and why

- **Six languages, not five.** English, Russian, Spanish, French and Tatar were
  in the first voice note; Chinese was added on request afterwards.
- **The hero model is a wheel loader.** That is the model that was supplied.
  The three machines rented are crawler dozers, so the hero does not match the
  fleet. Noted in the README with the two commands that swap it.
- **Production years were dropped from the spec table.** They are not published
  on the source pages, so they were replaced with length over blade, which is.
- **The D8R power figure is gross, the other two are net.** That is how the
  source publishes them; each is labelled rather than silently mixed.


---

## Change: the hero machine (later request)

The hero originally used the wheel loader that was supplied, which did not match
the crawler dozers the company actually rents. Replaced with a Cat-style D6R
built procedurally in `tools/build_dozer.py`.

| Condition | How it is checked | Result |
|---|---|---|
| Machine dimensions match the published D6R spec | build prints measured vs published on every run | within 0.4% on width, length and height |
| The pulley ring is counter-clockwise | assertion on the signed area of the centre polygon | passes; a clockwise ring silently inverts the track |
| The machine sits on the ground, nothing below z=0 | measured in the build report | ground_z = 0.012 m |
| The exported GLB renders as a dozer | four Blender views inspected, including straight down | confirmed |
| The hero loads the dozer, not the loader | added to `tools/verify_site.mjs` | passes |

### Not delivered, and why

- **The supplied `200078_open3dmodel.com.rar` could not be used.** It contains
  `bulldozer.max`, a native 3ds Max scene (verified: OLE compound document), and
  eleven JPEG textures. No FBX, OBJ or GLB in the archive. Nothing but 3ds Max
  can open a `.max`, so it cannot be converted here. Separately, the textures are
  named `Archmodels_115_009_*`, which identifies it as Evermotion Archmodels
  vol. 115 — a commercial asset being redistributed. Both points are worth
  settling before it goes on a live commercial site.
- **The three site photographs were not saved to disk.** They arrived in the
  conversation only. `assets/media/photos/` is set up with a README naming each
  slot; dropping the files in makes the page use them with no code change.
- **The hero dozer is stylised, not photoreal.** Dimensionally correct and
  clearly a crawler dozer, but built from primitives with flat PBR materials, so
  no dirt, decals or surface history. A textured FBX or OBJ run through
  `tools/build_glb.py` would replace it directly.


---

## Request log

Every ask across the conversation, and where it stands.

| # | Request | Status |
|---|---|---|
| 1 | Site in the style of caterpillar.com, dark tones | done |
| 2 | Loaded photos and video, darkened | done |
| 3 | Bulldozer rental, brand LIGARENT, logo | done |
| 4 | Landing page that converts to enquiries | done |
| 5 | Enquiries into a Telegram bot | done, endpoint ships in two flavours |
| 6 | Enquiry carries phone, WhatsApp, job, tonnage, location | done, all five verified end to end |
| 7 | 3D animation on open and on scroll | done |
| 8 | Then it moves to video, darkened, copy over the top | done, contrast measured at 6.1:1 |
| 9 | Then darkened photos with information over them | done |
| 10 | Information on the machines and what they do | done |
| 11 | Languages: EN, RU, ES, FR, Tatar | done |
| 12 | Add Chinese | done, six locales at 100% key parity |
| 13 | Scrolling swaps the interface elements in and out | done, seven stages |
| 14 | The three real machines: D6R, D7R, D8R | done, published specs with sources |
| 15 | Wheel loader model in the hero | done, then superseded |
| 16 | Hero should be a real bulldozer | done, built to published D6R dimensions |
| 17 | Use the supplied `.max` model | **not possible** — 3ds Max native format |
| 18 | More image assets per machine and for the background | done from the 3D: three machine cards, six gallery frames, a video loop |
| 19 | Use the three photographs sent over | **waiting on the files** — they arrived in chat, not on disk |
| 20 | A brief and folder to hand to a design tool | done, `BRIEF.md` |
| 21 | The model looks bad on the website | fixed — see below |

### Why the model looked bad, and what changed

Captured at 2x with the page copy hidden, which showed it was the browser
rendering rather than the geometry:

| Problem | Cause | Fix |
|---|---|---|
| No highlights, everything flat | environment map was a 32x128 canvas | 512x256 with a bright horizon band, a hot spot and a cool counter-spot |
| Machine floated | the warm ground pool drew over the shadow plane | glossy ground that receives shadow, pool made additive and pushed behind |
| Yellow read as brown | ACES tone mapping rolls saturated yellows | switched to Khronos PBR Neutral |
| Then read as pale peach | over-exposed: a saturated yellow clips red first | exposure and key tuned against measured body pixels, not by eye |
| Warm key crushed the green | warm light multiplies an already-low green channel | neutral key, warmth left to the environment and the rim |

Measured on the shipped build: body p90 RGB 200 / 136 / 36 with 0.01% clipping.

### The blade bug

Rendering one machine large and bright exposed a real defect that three rounds
of small dark verification renders had missed: the moldboard's arc had x and z
swapped, so the blade was 1.3 m deep and 0.36 m tall — a horizontal plate. Fixed
by deriving the radius from the intended height. **Render the identifying
feature big before believing it.**


---

## Round three: video, liquid glass, and the machine moving the interface

| Item | State |
|---|---|
| Background video generated through NanoGPT | done, night take, 1.2 MB |
| liquid-glass-js used for real, not imitated | done, WebGL control confirmed live in-browser |
| The 3D machine physically moves the interface | done, 90 of 90 frames displaced |
| Whole page captured top to bottom | `tools/shots/WHOLE-PAGE.png`, 1440 x 11469 |

### Three defects found by checking rather than assuming

1. **liquid-glass-js appeared to load but never started.** It declares
   `class Button` at the top level of a classic script, which creates a binding
   in the global *lexical* scope, not a property on `window`. `window.Button`
   was undefined while `Button` resolved fine. Confirmed fixed by reading back
   `dataset.live`, the canvas count and the retired CSS fallback from the live
   page.
2. **The plough moved nothing.** It only pushed what lay ahead along the
   blade's travel axis, and the machine sits to the right of the copy facing
   further right, so nothing was ever in front of it. Changed to a radial shove
   measured to each element's nearest edge.
3. **The plough then drove the page to seventeen million pixels tall.** The
   transform was clamped but the spring state was not, so `measure()` removed
   the wrong displacement, the rest position drifted every frame and the spring
   integrated away to infinity. The state is clamped now, and page height is
   asserted stable across 120 frames.

The first video take came back as bright desert daylight with invented badging
on the machine's flank. "No logos" alone did not stop it; stating night as the
setting and repeating the blank-panel instruction did.
