# Where the machine figures came from

Every number shown on the site for the three dozers is a manufacturer-published
specification, taken from RitchieSpecs and converted to metric here. Nothing is
estimated. If a figure was not published for a variant, it is not on the site.

The site says so in the fine print under the spec table: these are the
published specs for the **model**, and the exact blade and undercarriage on the
machine that turns up is confirmed in writing with the price.

---

## Cat D6R — XL, Power Shift

Source: <https://www.ritchiespecs.com/model/caterpillar-d6r-xl-crawler-tractor>

| Shown on site | Published | Conversion |
|---|---|---|
| 19 010 kg | 41 900 lb | × 0.45359 = 19 006 kg |
| 175 hp, 130 kW net | Net Power 175 hp | × 0.7457 = 130.5 kW |
| Cat 3306 T | "3306 T" | — |
| 5.66 m³, SU blade | 7.4 yd³ standard blade | × 0.76455 = 5.66 m³ |
| 3.26 m over blade | 10.7 ft | × 0.3048 = 3.26 m |
| 5.33 m with blade | 17.5 ft | × 0.3048 = 5.33 m |

The same page also lists a **Power PSDS** variant at 42 300 lb and a maximum
flywheel power of 189 hp. The site quotes the Power Shift weight and the **net**
power, which is the conservative pair.

## Cat D7R — XR Series II

Source: <https://www.ritchiespecs.com/model/caterpillar-d7r-xr-series-ii-crawler-tractor>

| Shown on site | Published | Conversion |
|---|---|---|
| 25 880 kg | 57 056 lb | × 0.45359 = 25 880 kg |
| 240 hp, 179 kW net | Net Power 240 hp | × 0.7457 = 179.0 kW |
| Cat 3176C | "3176C" | — |
| 6.88 m³ | 9 yd³ | × 0.76455 = 6.88 m³ |
| 3.69 m over blade | 12.1 ft | × 0.3048 = 3.69 m |
| 6.03 m with blade | 19.79 ft | × 0.3048 = 6.03 m |

Blade type is not stated on the page, so the site says "standard blade" rather
than naming an SU or U blade it cannot support.

## Cat D8R — Series II

Source: <https://www.ritchiespecs.com/model/caterpillar-d8r-series-ii-crawler-tractor>

| Shown on site | Published | Conversion |
|---|---|---|
| 37 630 kg | 82 960 lb | × 0.45359 = 37 630 kg |
| 310 hp, 231 kW **gross** | 310 hp at 2000 rpm, gross | × 0.7457 = 231.2 kW |
| Cat 3406E TA | "3406E TA" | — |
| 8.72 m³ | 11.4 yd³ | × 0.76455 = 8.72 m³ |
| 3.96 m over blade | 13 ft | × 0.3048 = 3.96 m |
| 6.57 m with blade | 21.56 ft | × 0.3048 = 6.57 m |

**The D8R power figure is gross, not net.** The page publishes gross for this
variant and net for the other two. Rather than quietly mix the two, the site
labels each one, and `assets/js/fleet.js` carries a comment saying why. If you
find the published net figure for your actual machine, put it in and change the
label to "net".

---

## Things deliberately not shown

- **Production years.** Not published on these pages. An earlier draft carried
  invented year ranges; they were removed and replaced with "length with
  blade", which is sourced.
- **Ground pressure.** Varies by shoe width, which differs machine to machine.
  Quote it per machine when you know the undercarriage.
- **Ripper specification.** The site refers to a single shank on the D8R in the
  marketing copy. Confirm the attachment on your actual machine before quoting
  it as a spec.

## Fleet-wide figures derived from the above

| Where | Value | From |
|---|---|---|
| "19–38 t" stat strip | 19.0 t to 37.6 t | D6R low, D8R high |
| Weight-class picker in the form | ~19 t / ~26 t / ~38 t | one option per machine |
| Body copy "nineteen tonnes … thirty-eight tonnes" | same pair | — |

If you change a weight in `fleet.js`, these three places need the same change
in all six languages in `assets/js/i18n.js`. They are plain text, not computed.

---

## The 3D machine in the hero

`tools/build_dozer.py` builds a Cat-*style* D6R from the same published figures
used in the spec table. It is not a Caterpillar model and carries no
Caterpillar branding — only the dimensions are borrowed, and those are public.

| Built to | Value | Source |
|---|---|---|
| Track gauge | 1.890 m | 6.2 ft |
| Shoe width | 0.560 m | 22.05 in |
| Track on ground | 2.822 m | 9.26 ft |
| Ground clearance | 0.378 m | 1.24 ft |
| Shoes per side | 41 | published count |
| Track rollers per side | 7 | published count |
| Width over tracks | 2.442 m | 8.01 ft |
| Length without blade | 3.862 m | 12.67 ft |
| Length with blade | 5.334 m | 17.5 ft |
| Height over ROPS | 3.170 m | 10.4 ft |
| Blade width | 3.261 m | 10.7 ft |

The two figures cross-check: track gauge 1.890 plus shoe width 0.560 gives
2.450, against the published 2.442 over tracks. That agreement is what gave
confidence the source figures were internally consistent before anything was
modelled.

The build prints its own measured-versus-published error table on every run.
As it stands: width over tracks +0.4%, length without blade −0.4%, height
−0.4%, length with blade +2.3% (the grouser bars and the blade end bits stand
proud of the nominal envelope, as they do on the real machine).

### Things that went wrong building it, kept here so they are not repeated

- **The three pulleys were ordered clockwise.** The belt is the convex hull of
  the idlers and the sprocket, and the external-tangent formula only gives the
  outer tangents for a counter-clockwise ring. Ordered the other way it
  silently returns the inner tangents and folds the track through the machine.
  There is now an assertion on the signed area.
- **The grousers sank through the ground.** The shoe plates stand proud of the
  pitch line, so the path circles have to be shrunk by that build-up for the
  grouser tips to land on z = 0 and the envelope to match the published length.
- **The paint rendered as peach.** The check render was tone-mapping with AgX
  while the site tone-maps with ACES in three.js. Grading a colour against one
  film curve and then applying another washes the chroma out. The check now
  renders under Standard.
- **Reusing the loader's textures failed.** They are UV atlases baked for that
  model's own layout, not tileable materials; cube-projected onto other
  geometry they produce gold-and-chrome camouflage. Left behind a `--textures`
  flag so the experiment is reproducible, but flat PBR is what ships.


---

## The D7R and D8R models

`tools/build_dozer.py` takes a machine argument (`d6r`, `d7r`, `d8r`). For each
one the **overall** dimensions are the published figures and are set exactly:

| | D6R | D7R | D8R |
|---|---|---|---|
| Length without blade | 3.862 m | 4.724 m | 4.932 m |
| Length with blade | 5.334 m | 6.032 m | 6.571 m |
| Height over ROPS | 3.170 m | 3.377 m | 3.511 m |
| Blade width | 3.261 m | 3.688 m | 3.962 m |

Measured against those on the current build, the worst error is +1.1% on the
D7R and D8R and +3.5% on the D6R.

**What is NOT published for the D7R and D8R**, and is therefore scaled from the
D6R by the length ratio rather than sourced: track gauge, shoe width, track
length on ground, ground clearance, and width over tracks. The scale factors are
1.223 for the D7R and 1.277 for the D8R, and the build reports them. Treat those
five figures as illustrative, not as specification, and do not quote them to a
customer.

### A bug worth remembering

The moldboard was first built with its arc's x and z swapped, producing a blade
1.3 m deep and 0.36 m tall — a horizontal plate rather than a blade. It survived
three rounds of review because the small verification renders were too dark and
too distant to show it. It was only visible once one machine was rendered large
and light. Render the identifying feature big before believing it.
