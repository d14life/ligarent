# LIGARENT — product requirements

What the site is for, what it must do, and how each requirement traces back to
what was asked for. Written after the fact from the voice notes and messages,
so it is a record as much as a spec.

---

## 1. Goal

**Turn a stranger who needs earth moved into a phone call with the dispatcher,
within two minutes of landing on the page.**

Everything else is in service of that. The site is not a brochure and not a
catalogue. It has one conversion: the enquiry form, backed up by a phone number
and a WhatsApp link for people who would rather talk.

Secondary goals, in order:

1. Make the visitor confident these are real machines with real operators, not
   a broker reselling someone else's plant.
2. Answer "which machine do I need?" before they have to ask.
3. Work for a Russian-speaking customer, an English-speaking one, and four
   other languages besides.

**Not goals.** Online booking. Payments. Accounts. A blog. Any of those would
add a maintenance burden the business cannot carry.

## 2. Who it is for

| Visitor | What they want | What the site gives them |
|---|---|---|
| Small contractor with a plot to clear | A price and a date, fast | Rates band, the form, a phone number in the header |
| Site manager on a bigger job | Proof of capability and the right size machine | Spec tables, the machine picker, the work section |
| Someone who does not know what a dozer is | To not feel stupid | "Which machine do I need" picker, plain-language copy |
| A Russian or Tatar speaker | The site in their language | Six-language switcher, no half-translated pages |

## 3. Requirements, and where they came from

Traced to the source. "VN1" is the first voice note, "VN2" the second, the rest
are chat messages.

| # | Requirement | Source | Status |
|---|---|---|---|
| R1 | Styled like caterpillar.com, dark tones | VN1 | done |
| R2 | Photos and video, both darkened | VN1 | done |
| R3 | Named LIGARENT, using the supplied logo | VN1 + logo image | done |
| R4 | A landing page that converts to enquiries | VN1 | done |
| R5 | Enquiries arrive in a Telegram bot | VN1 | done |
| R6 | Enquiry carries phone, WhatsApp, job description, tonnage, location | VN1 | done, all five verified |
| R7 | 3D animation on load | VN1 | done |
| R8 | 3D animation on scroll | VN1 | done |
| R9 | Handover from 3D to a darkened background video | VN1 | done |
| R10 | Then darkened photos with information over them | VN1 | done |
| R11 | Information about the machines and what they can do | VN1 | done |
| R12 | Five languages: EN, RU, ES, FR, Tatar | VN1 | done |
| R13 | Add Chinese | chat | done, six total |
| R14 | Interface elements swap in and out as you scroll | chat | done, seven stages |
| R15 | The real fleet is D6R, D7R, D8R | VN2 | done, published specs with sources |
| R16 | The hero must be a bulldozer, not a loader | chat | done |
| R17 | More image assets per machine and for backgrounds | chat | in progress |
| R18 | Use the three site photographs supplied | chat | blocked: files not on disk |
| R19 | A brief that can be handed to a design tool | chat | done, `BRIEF.md` |
| R20 | More sections, more interactivity | chat | in progress |
| R21 | Liquid-glass treatment across the interface | chat | in progress |
| R22 | About and contact content, and a stated goal | chat | this document, plus new sections |

### Requirements that could not be met

| # | Requirement | Why |
|---|---|---|
| R23 | Use the supplied `.max` bulldozer model | 3ds Max native format. Only 3ds Max reads it; no importer or converter exists. The file was opened and inspected to confirm this, not assumed. An FBX or OBJ of the same model would drop straight in. |

## 4. Content requirements

### About

Must answer, in under 120 words: who owns the machines, how long they have been
doing this, and why a customer should believe the machine will actually turn up.
No founder story, no mission statement.

### Contact

Phone, WhatsApp and email must be reachable from the header, the contact section
and the footer. Dispatch hours stated. The phone number is the single most
important element on the page after the form.

### Rates

A band, not a price list. "From X per shift, all in" with a clear statement of
what is included (operator, fuel, transport, servicing, insurance) and what is
not (standing time, out-of-hours mobilisation). A rental business cannot publish
firm prices, but it loses enquiries by publishing nothing.

### Machine picker

Given a job type, an area and a ground condition, recommend one of the three
machines and say why in one sentence. It must be able to answer "the smaller one
is enough" — that is the trust-building answer.

### FAQ

Six to eight questions, the ones a dispatcher actually gets asked: how quickly
can you get here, do you supply the operator, what if it breaks, what area do
you cover, how do I pay, what do I need to have ready on site.

## 5. Non-functional requirements

| | Requirement | Verified by |
|---|---|---|
| Performance | Under 5 MB total, no build step, any static host | packaged size check |
| Accessibility | Text over imagery clears 4.5:1 | measured contrast check |
| Responsive | No horizontal overflow at 390 / 768 / 1440 px | automated at three widths |
| Robustness | Works with WebGL unavailable and with reduced motion on | fallback paths in `scene.js` |
| Security | The Telegram bot token never reaches the browser | grep over every client file |
| Correctness | Every locale renders with no missing strings | key-parity and DOM checks |
| Honesty | Every published machine figure has a source | `FLEET-SOURCES.md` |

All of the above run from `node tools/verify_site.mjs`.

## 6. Content provenance

Worth being straight about, because it affects what can be claimed:

- **Machine specifications** — manufacturer-published, sourced in `FLEET-SOURCES.md`.
- **The 3D machine** — built from those published dimensions. Cat-*style*, not a
  Caterpillar model, carries no Caterpillar branding.
- **Photography** — AI-generated, unbranded, illustrative. It is not photography
  of LIGARENT's own machines or jobs. Replace it with real site photographs as
  they become available; `assets/media/photos/` is set up for exactly that.
- **Copy** — written for this project. Tatar and Chinese are machine-translated
  and want a native reader before commercial use.

The gallery captions describe the *kind* of work each machine does. They should
not be read as claims about specific completed contracts until they are backed
by the client's own photographs.
