/* LIGARENT — the three machines.
   Numbers live here and nowhere else, so a spec is only ever corrected once.
   Every figure is the manufacturer-published spec as listed by RitchieSpecs;
   the source URL and the raw imperial value for each are in FLEET-SOURCES.md.
   `use` and `blurb` are i18n KEYS, resolved at render time. */

export const FLEET = [
  {
    id: 'd6r',
    name: 'Cat D6R',
    variant: 'XL, Power Shift',
    klass: 'medium',
    image: './assets/media/mach_d6r.jpg',
    specs: {
      weight: { v: '19 010', u: 'kg', note: '≈ 19.0 t' },
      power:  { v: '175',    u: 'hp', note: '130 kW net' },
      engine: { v: 'Cat 3306 T', u: '', note: 'turbocharged' },
      blade:  { v: '5.66',   u: 'm³', note: 'SU blade' },
      width:  { v: '3.26',   u: 'm',  note: 'over blade' },
      length: { v: '5.33',   u: 'm',  note: 'with blade' }
    },
    use: 'fleet.d6r.use',
    blurb: 'fleet.d6r.blurb'
  },
  {
    id: 'd7r',
    name: 'Cat D7R',
    variant: 'XR Series II',
    klass: 'medium',
    image: './assets/media/mach_d7r.jpg',
    specs: {
      weight: { v: '25 880', u: 'kg', note: '≈ 25.9 t' },
      power:  { v: '240',    u: 'hp', note: '179 kW net' },
      engine: { v: 'Cat 3176C', u: '', note: 'ATAAC' },
      blade:  { v: '6.88',   u: 'm³', note: 'standard blade' },
      width:  { v: '3.69',   u: 'm',  note: 'over blade' },
      length: { v: '6.03',   u: 'm',  note: 'with blade' }
    },
    use: 'fleet.d7r.use',
    blurb: 'fleet.d7r.blurb'
  },
  {
    id: 'd8r',
    name: 'Cat D8R',
    variant: 'Series II',
    klass: 'large',
    image: './assets/media/mach_d8r.jpg',
    specs: {
      weight: { v: '37 630', u: 'kg', note: '≈ 37.6 t' },
      power:  { v: '310',    u: 'hp', note: '231 kW gross' },
      engine: { v: 'Cat 3406E TA', u: '', note: 'turbo aftercooled' },
      blade:  { v: '8.72',   u: 'm³', note: 'standard blade' },
      width:  { v: '3.96',   u: 'm',  note: 'over blade' },
      length: { v: '6.57',   u: 'm',  note: 'with blade' }
    },
    use: 'fleet.d8r.use',
    blurb: 'fleet.d8r.blurb'
  }
];

/* The D8R figure published for this variant is GROSS power; the other two are
   NET. They are labelled as such rather than silently mixed. */
export const SPEC_ORDER = ['weight', 'power', 'engine', 'blade', 'width', 'length'];
