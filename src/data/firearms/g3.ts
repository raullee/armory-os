import type { ComponentDef, FirearmDefinition, GeometrySpec, Vec2, Vec3 } from '@/firearm/schema';

/**
 * Heckler & Koch G3A3 battle rifle, fixed polymer stock, slim green handguard.
 *
 * Frame: bore axis y=0, bolt face (in battery) at x=0, +x toward the muzzle,
 * +z shooter's right. All dimensions mm.
 *
 * Published dimensions: overall 1,025 mm, barrel 450 mm, mass 4.4 kg with an
 * empty magazine (HK product sheet; Bundeswehr TDv 1005/003-12). The roller-
 * delayed internals are laid out from the published parts diagrams and marked
 * estimated where no dimension is published.
 */

// ---- layout constants (mm) --------------------------------------------------
const MUZZLE = 450;
const HIDER_REAR = 415;
const HIDER_TIP = 505;
const BUTT = -520;
const REC_REAR = -290; // receiver back plate
const REC_FRONT = 75; // receiver front, where the cocking tube leaves the trunnion
const REC_TOP = 42;
const REC_BOTTOM = -22;
const TUBE_Y = 30; // cocking tube axis
const TUBE_FRONT = 395;
const BOLT_TRAVEL = 100;
const CARRIER_REAR = -220; // carrier tail in battery
const CARRIER_LEN = 195; // carrier body, tail to front collar
const HEAD_LEN = 50; // bolt head, rear shoulder to face
const HANDLE_X = 290; // cocking handle rest position

const receiverProfile: Vec2[] = [
  [REC_REAR, REC_TOP],
  [REC_FRONT, REC_TOP],
  [REC_FRONT + 12, 24], // trunnion nose
  [REC_FRONT + 12, REC_BOTTOM],
  [6, REC_BOTTOM],
  [6, -78], // magazine well, front wall
  [-82, -78],
  [-82, REC_BOTTOM],
  [REC_REAR, REC_BOTTOM],
];

const housingProfile: Vec2[] = [
  [-84, REC_BOTTOM],
  [-286, REC_BOTTOM],
  [-286, -58],
  [-84, -58],
];

const gripProfile: Vec2[] = [
  [-200, -56],
  [-262, -56],
  [-290, -150],
  [-292, -162],
  [-250, -164],
  [-222, -110],
  [-205, -72],
];

const guardOuter: Vec2[] = [
  [-100, -56],
  [-200, -56],
  [-200, -92],
  [-108, -94],
  [-100, -86],
];
const guardHole: Vec2[] = [
  [-108, -60],
  [-192, -60],
  [-192, -86],
  [-108, -86],
];

const stockProfile: Vec2[] = [
  [REC_REAR, 40],
  [-330, 38],
  [-500, 26],
  [-518, 20],
  [BUTT, -20],
  [-518, -100],
  [-505, -108],
  [-470, -104],
  [-380, -70],
  [-330, -46],
  [REC_REAR, -30],
];

const handguardProfile: Vec2[] = [
  [85, 16],
  [330, 16],
  [336, 8],
  [336, -20],
  [326, -27],
  [95, -27],
  [85, -20],
];

const magProfile: Vec2[] = [
  [2, -10],
  [2, -80],
  [6, -140],
  [10, -195],
  [12, -208],
  [-68, -208],
  [-66, -195],
  [-70, -140],
  [-74, -80],
  [-74, -10],
];

const triggerProfile: Vec2[] = [
  [0, 4],
  [7, 4],
  [7, -2],
  [5, -10],
  [2, -18],
  [-3, -25],
  [-10, -26],
  [-9, -18],
  [-6, -10],
  [-5, -2],
];

const hammerProfile: Vec2[] = [
  [0, -6],
  [8, -6],
  [8, 3],
  [5, 14],
  [1, 24],
  [-5, 28],
  [-11, 25],
  [-9, 16],
  [-6, 6],
  [-6, -3],
];

const flutes: GeometrySpec = {
  kind: 'composite',
  parts: Array.from({ length: 12 }, (_, i): { geometry: GeometrySpec; position: Vec3; rotation: Vec3 } => {
    const a = (i / 12) * Math.PI * 2;
    return { geometry: { kind: 'box', size: [42, 1.2, 1.6] }, position: [30, Math.cos(a) * 6.4, Math.sin(a) * 6.4], rotation: [-a, 0, 0] };
  }),
};

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver
  {
    id: 'receiver',
    name: 'Receiver with magazine well',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Stamped sheet steel, welded, phosphate finish',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: receiverProfile, depth: 42, bevel: 1.5 } },
        // barrel trunnion, the hardened block the barrel is pressed into
        { geometry: { kind: 'box', size: [70, 46, 36], radius: 2 }, position: [40, 6, 0] },
        // magazine well flare
        { geometry: { kind: 'box', size: [92, 22, 46], radius: 2 }, position: [-38, -68, 0] },
        // rear sight base
        { geometry: { kind: 'box', size: [44, 8, 30], radius: 1.5 }, position: [-200, REC_TOP + 4, 0] },
        // back plate ring
        { geometry: { kind: 'box', size: [6, 62, 44], radius: 1.5 }, position: [REC_REAR + 3, 10, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Stamped steel body carrying the trunnion, the roller recesses, the magazine well and every other assembly.',
    notes: ['Roller locking recesses are machined into the trunnion welded inside the receiver', 'Ejection port on the right side above the magazine well'],
    confidence: 'estimated',
    adjacent: ['barrel', 'cocking_tube', 'bolt_carrier', 'trigger_group', 'stock', 'magazine'],
    mass: 780,
    thermal: 0.4,
  },
  {
    id: 'cocking_tube',
    name: 'Cocking tube',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Drawn steel tube, welded to the receiver',
    geometry: { kind: 'cylinder', radius: 11, length: TUBE_FRONT - REC_FRONT, segments: 28 },
    position: [(TUBE_FRONT + REC_FRONT) / 2, TUBE_Y, 0],
    function: 'Guides the cocking lever support and the carrier extension above the barrel; the slot on the left carries the cocking handle.',
    confidence: 'estimated',
    adjacent: ['receiver', 'cocking_support', 'front_sight', 'handguard'],
    strip: { stage: 5, offset: [0, 80, 0], order: 1, motion: 'up' },
    mass: 210,
    thermal: 0.3,
  },
  {
    id: 'cocking_support',
    name: 'Cocking lever support',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'lathe', profile: [[0, 0], [7.5, 0], [7.5, 120], [6, 124], [6, 130], [0, 130]], segments: 20 },
    position: [HANDLE_X - 120, TUBE_Y, 0],
    function: 'Slides inside the cocking tube and pushes the carrier extension rearward when the handle is drawn; non-reciprocating in firing.',
    notes: ['Travel about 100 mm'],
    confidence: 'estimated',
    adjacent: ['cocking_tube', 'cocking_handle', 'bolt_carrier'],
    strip: { stage: 5, offset: [0, 130, 0], order: 2, motion: 'up' },
    mass: 60,
    internal: true,
  },
  {
    id: 'cocking_handle',
    name: 'Cocking handle',
    group: 'action',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 16, axis: 'z' }, position: [0, 0, -6] },
        { geometry: { kind: 'box', size: [62, 12, 7], radius: 2 }, position: [31, 0, -13] },
      ],
    },
    position: [120, 0, -4],
    pivot: [0, 0, 0],
    parent: 'cocking_support',
    function: 'Folds forward along the tube at rest; swung out to the left, drawn back and hooked up into the notch to hold the bolt open.',
    confidence: 'published',
    adjacent: ['cocking_support', 'cocking_tube'],
    strip: { stage: 5, offset: [0, 0, -60], order: 3, motion: 'left' },
    mass: 45,
  },

  // ------------------------------------------------------------ barrel
  {
    id: 'barrel',
    name: 'Barrel, 450 mm',
    group: 'barrel',
    material: 'parkerised-steel',
    materialLabel: 'Chrome-moly steel, cold hammer forged, fluted chamber, phosphate exterior',
    geometry: {
      kind: 'lathe',
      profile: [
        [0, -2], [15, -2], [15, 70], [12.5, 74], [12.5, 300], [11, 304], [11, 384], [12.5, 386], [12.5, 408], [10.4, 410], [10.4, MUZZLE], [0, MUZZLE],
      ],
      segments: 48,
    },
    position: [0, 0, 0],
    function: 'Pressed and pinned into the trunnion; the chamber is fluted so gas floats the case while the rollers are still delaying the breech.',
    notes: ['Length 450 mm measured from the bolt face', 'Four grooves, right-hand twist 1 in 305 mm'],
    confidence: 'published',
    adjacent: ['receiver', 'chamber_flutes', 'flash_suppressor', 'front_sight', 'handguard'],
    strip: { stage: 5, offset: [130, 0, 0], motion: 'forward' },
    mass: 1050,
    thermal: 0.75,
  },
  {
    id: 'chamber_flutes',
    name: 'Fluted chamber',
    group: 'barrel',
    material: 'chrome',
    geometry: flutes,
    position: [0, 0, 0],
    parent: 'barrel',
    function: 'Twelve longitudinal flutes let propellant gas flow around the case so it extracts cleanly under the high residual pressure of roller delay.',
    confidence: 'estimated',
    adjacent: ['barrel', 'bolt_head'],
    strip: { stage: 5, offset: [0, -60, 0], order: 1, motion: 'down' },
    mass: 0,
    thermal: 0.9,
    internal: true,
  },
  {
    id: 'flash_suppressor',
    name: 'Slotted flash suppressor',
    group: 'muzzle',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[10.5, 0], [13.5, 0], [13.5, 8], [12.5, 10], [12.5, 84], [11.2, 90], [5.5, 90]], segments: 32 } },
        ...Array.from({ length: 5 }, (_, i): { geometry: GeometrySpec; position: Vec3; rotation: Vec3 } => {
          const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
          return { geometry: { kind: 'box', size: [50, 2.4, 1.4] }, position: [60, Math.cos(a) * 12.6, Math.sin(a) * 12.6], rotation: [-a, 0, 0] };
        }),
      ],
    },
    position: [HIDER_REAR, 0, 0],
    function: 'Five slots vent muzzle gas; the 22 mm outer diameter also launches rifle grenades and mounts the bayonet.',
    confidence: 'published',
    adjacent: ['barrel'],
    strip: { stage: 5, offset: [230, 0, 0], order: 0, motion: 'forward' },
    mass: 95,
    thermal: 0.9,
  },

  // ------------------------------------------------------------ sights
  {
    id: 'front_sight',
    name: 'Front sight, hooded post',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        // sight base bridging tube and barrel
        { geometry: { kind: 'box', size: [26, 30, 30], radius: 2 }, position: [0, 14, 0] },
        // tower
        { geometry: { kind: 'box', size: [14, 16, 10], radius: 1.5 }, position: [0, 34, 0] },
        // hood
        { geometry: { kind: 'torus', radius: 9.5, tube: 1.6, axis: 'x' }, position: [0, 51, 0] },
        // post
        { geometry: { kind: 'cylinder', radius: 1.3, length: 12, axis: 'y' }, position: [0, 47, 0] },
      ],
    },
    position: [398, 12, 0],
    function: 'Fixed post inside a protective ring; the ring also keys the sight picture with the rear drum.',
    confidence: 'estimated',
    adjacent: ['cocking_tube', 'barrel', 'rear_sight'],
    strip: { stage: 5, offset: [50, 100, 0], order: 0, motion: 'up' },
    mass: 70,
    thermal: 0.35,
  },
  {
    id: 'rear_sight',
    name: 'Rear sight, rotary drum',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 10, axis: 'y' }, position: [0, 4, 0] },
        { geometry: { kind: 'cylinder', radius: 12.5, length: 20, axis: 'y', segments: 32 }, position: [0, 16, 0] },
        { geometry: { kind: 'cylinder', radius: 13.5, length: 3, axis: 'y', segments: 32 }, position: [0, 27, 0] },
      ],
    },
    position: [-200, REC_TOP + 8, 0],
    rotation: [0, 0, -0.3],
    pivot: [0, 6, 0],
    function: 'Drum with an open V for 100 m and apertures for 200, 300 and 400 m; turning it indexes the next setting.',
    confidence: 'estimated',
    adjacent: ['receiver', 'front_sight'],
    strip: { stage: 5, offset: [0, 100, 0], order: 0, motion: 'up' },
    mass: 65,
  },

  // ------------------------------------------------------------ furniture
  {
    id: 'handguard',
    name: 'Slim handguard',
    group: 'furniture',
    material: 'polymer-od',
    materialLabel: 'Glass-fibre reinforced polyamide, green',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: handguardProfile, depth: 38, bevel: 3, curveSegments: 6 } },
        // retaining pin boss at the rear
        { geometry: { kind: 'cylinder', radius: 4, length: 44, axis: 'z' }, position: [96, -8, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Ventilated shell under the cocking tube; a single cross pin at the rear holds it to the receiver.',
    confidence: 'estimated',
    adjacent: ['barrel', 'receiver', 'cocking_tube'],
    strip: { stage: 5, offset: [0, -110, 0], order: 1, motion: 'down' },
    mass: 190,
    thermal: 0.25,
  },
  {
    id: 'stock',
    name: 'Fixed stock with back plate',
    group: 'furniture',
    material: 'polymer-black',
    materialLabel: 'Glass-fibre reinforced polyamide over a steel back plate',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: stockProfile, depth: 42, bevel: 4, curveSegments: 6 } },
        // back plate (Bodenstück) that enters the receiver and carries the pins
        { geometry: { kind: 'box', size: [14, 56, 38], radius: 2 }, position: [REC_REAR + 6, 8, 0] },
        // sling loop
        { geometry: { kind: 'torus', radius: 8, tube: 1.6, axis: 'z' }, position: [-500, -108, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Back plate and stock come off together after the two rear pins are out, taking the recoil spring assembly and buffer with them.',
    notes: ['Fixed A3 stock; the A4 telescoping stock is a different configuration'],
    confidence: 'estimated',
    adjacent: ['receiver', 'push_pin_upper', 'push_pin_lower', 'recoil_spring', 'buffer'],
    strip: { stage: 2, offset: [-300, -120, 0], order: 1, motion: 'rear' },
    mass: 560,
  },
  {
    id: 'buffer',
    name: 'Buffer',
    group: 'action',
    material: 'rubber-black',
    materialLabel: 'Steel buffer housing with elastomer and spring stack',
    geometry: { kind: 'lathe', profile: [[0, 0], [13, 0], [13, 50], [9, 54], [9, 60], [0, 60]], segments: 24 },
    position: [-352, 4, 0],
    parent: 'stock',
    function: 'Sits behind the back plate and absorbs the carrier at the end of its rearward travel.',
    confidence: 'estimated',
    adjacent: ['stock', 'bolt_carrier'],
    strip: { stage: 5, offset: [0, 60, 0], order: 1, motion: 'up' },
    mass: 120,
    internal: true,
  },
  {
    id: 'recoil_spring',
    name: 'Recoil spring',
    group: 'action',
    material: 'stainless-steel',
    materialLabel: 'Multi-strand spring wire',
    geometry: { kind: 'spring', radius: 8, length: 180, turns: 26, wire: 1.8 },
    position: [-200, 0, 0],
    parent: 'stock',
    function: 'Attached to the back plate, it reaches forward into the hollow carrier tail and returns the bolt group to battery.',
    confidence: 'estimated',
    adjacent: ['stock', 'recoil_guide_rod', 'bolt_carrier'],
    strip: { stage: 5, offset: [-520, 0, 0], order: 2, motion: 'rear' },
    mass: 55,
    internal: true,
  },
  {
    id: 'recoil_guide_rod',
    name: 'Recoil spring guide',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'lathe', profile: [[0, 0], [10, 0], [10, 8], [3, 10], [3, 186], [0, 186]], segments: 16 },
    position: [-292, 0, 0],
    parent: 'stock',
    function: 'Steel tube fixed to the back plate on which the recoil spring rides.',
    confidence: 'estimated',
    adjacent: ['recoil_spring', 'stock'],
    strip: { stage: 5, offset: [-560, 40, 0], order: 3, motion: 'rear' },
    mass: 40,
    internal: true,
  },

  // ------------------------------------------------------------ fire control
  {
    id: 'trigger_group',
    name: 'Grip frame and trigger housing',
    group: 'fire-control',
    material: 'polymer-black',
    materialLabel: 'Polymer grip frame over a stamped steel trigger housing',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: housingProfile, depth: 38, bevel: 1.5 } },
        { geometry: { kind: 'extrude', shape: gripProfile, depth: 32, bevel: 3, curveSegments: 6 } },
        { geometry: { kind: 'extrude', shape: guardOuter, depth: 10, bevel: 1, holes: [guardHole] } },
      ],
    },
    position: [0, 0, 0],
    function: 'One removable unit holding the trigger, hammer, sear and selector; it hooks onto the receiver at the front and is pinned at the rear.',
    confidence: 'estimated',
    adjacent: ['receiver', 'trigger', 'hammer', 'selector', 'push_pin_lower'],
    strip: { stage: 2, offset: [0, -130, 0], rotate: [0, 0, 0.1], order: 2, motion: 'down' },
    mass: 420,
  },
  {
    id: 'trigger',
    name: 'Trigger',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: triggerProfile, depth: 8, bevel: 0.6 },
    position: [-150, -58, 0],
    parent: 'trigger_group',
    function: 'Pivots at the top; its rear arm lifts the sear off the hammer notch.',
    confidence: 'estimated',
    adjacent: ['hammer', 'trigger_group', 'selector'],
    strip: { stage: 5, offset: [0, -60, -40], order: 1, motion: 'left' },
    mass: 22,
  },
  {
    id: 'hammer',
    name: 'Hammer',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: hammerProfile, depth: 9, bevel: 0.8 },
    position: [-172, -46, 0],
    rotation: [0, 0, 1.1],
    parent: 'trigger_group',
    function: 'Held cocked by the sear; on release it strikes the firing pin through the rear of the carrier. The carrier recocks it on each cycle.',
    confidence: 'estimated',
    adjacent: ['trigger', 'firing_pin', 'trigger_group'],
    strip: { stage: 5, offset: [0, -60, 40], order: 1, motion: 'right' },
    mass: 40,
    internal: true,
  },
  {
    id: 'selector',
    name: 'Selector lever, S-E-F',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 42, axis: 'z' }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [30, 7, 4], radius: 1.5 }, position: [14, 0, -22] },
      ],
    },
    position: [-206, -34, 0],
    rotation: [0, 0, 0.7],
    parent: 'trigger_group',
    function: 'Left-side lever: S (safe) blocks the trigger, E gives single shots, F gives automatic fire.',
    confidence: 'published',
    adjacent: ['trigger', 'trigger_group'],
    strip: { stage: 5, offset: [0, 0, -70], order: 2, motion: 'left' },
    mass: 18,
  },
  {
    id: 'push_pin_upper',
    name: 'Locking pin, upper',
    group: 'receiver',
    material: 'parkerised-steel',
    geometry: { kind: 'cylinder', radius: 3.5, length: 50, axis: 'z' },
    position: [-278, 22, 0],
    function: 'Captive cross pin through the receiver and back plate; the first of the two pins out when the rifle is opened.',
    confidence: 'published',
    adjacent: ['receiver', 'stock'],
    strip: { stage: 2, offset: [0, 0, 56], order: 0, motion: 'right' },
    mass: 8,
  },
  {
    id: 'push_pin_lower',
    name: 'Locking pin, lower',
    group: 'receiver',
    material: 'parkerised-steel',
    geometry: { kind: 'cylinder', radius: 3.5, length: 50, axis: 'z' },
    position: [-278, -14, 0],
    function: 'Second cross pin; with both out the stock slides rearward and the grip frame swings down.',
    confidence: 'published',
    adjacent: ['receiver', 'stock', 'trigger_group'],
    strip: { stage: 2, offset: [0, 0, 56], order: 0, motion: 'right' },
    mass: 8,
  },
  {
    id: 'mag_release',
    name: 'Magazine release paddle',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [8, 30, 22], radius: 1.5 }, position: [0, -15, 0] },
        { geometry: { kind: 'cylinder', radius: 2.5, length: 30, axis: 'z' }, position: [0, 0, 0] },
      ],
    },
    position: [-88, -46, 0],
    pivot: [0, 0, 0],
    function: 'Ambidextrous paddle behind the magazine well; a push-button on the right does the same job.',
    confidence: 'estimated',
    adjacent: ['receiver', 'magazine'],
    strip: { stage: 5, offset: [0, -60, 50], order: 3, motion: 'right' },
    mass: 20,
  },

  // ------------------------------------------------------------ action
  {
    id: 'bolt_carrier',
    name: 'Bolt carrier',
    group: 'action',
    material: 'parkerised-steel',
    materialLabel: 'Machined steel, phosphate finish',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, 0], [11, 0], [11, 90], [16, 94], [16, CARRIER_LEN - 5], [14, CARRIER_LEN], [0, CARRIER_LEN]], segments: 32 } },
        // extension into the cocking tube
        { geometry: { kind: 'lathe', profile: [[0, 0], [8, 0], [8, 210], [6.5, 216], [0, 216]], segments: 20 }, position: [CARRIER_LEN - 25, TUBE_Y, 0] },
        // riser joining body and extension
        { geometry: { kind: 'box', size: [30, 20, 16], radius: 2 }, position: [CARRIER_LEN - 12, 18, 0] },
      ],
    },
    position: [CARRIER_REAR, 0, 0],
    function: 'Heavy carrier whose inclined faces bear on the locking piece; it must move about four times as far as the bolt head before the rollers clear their recesses.',
    notes: ['Hollow tail telescopes over the recoil spring guide', 'Bolt group about 880 g (estimated)'],
    confidence: 'estimated',
    adjacent: ['bolt_head', 'locking_piece', 'firing_pin', 'receiver', 'recoil_spring', 'cocking_support'],
    strip: { stage: 3, offset: [-480, 0, 0], order: 0, motion: 'rear' },
    mass: 640,
    thermal: 0.5,
  },
  {
    id: 'bolt_head',
    name: 'Bolt head',
    group: 'action',
    material: 'steel-worn',
    materialLabel: 'Case-hardened steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, 0], [10, 0], [10, 22], [14, 24], [14, HEAD_LEN - 2], [13, HEAD_LEN], [0, HEAD_LEN]], segments: 28 } },
        // locking lever boss
        { geometry: { kind: 'box', size: [16, 6, 10], radius: 1 }, position: [12, 12, 0] },
      ],
    },
    position: [CARRIER_LEN - 25, 0, 0],
    parent: 'bolt_carrier',
    function: 'Carries the two rollers and the extractor; its rear shank slides in the carrier and houses the locking piece.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'roller_left', 'roller_right', 'locking_piece', 'extractor', 'barrel'],
    strip: { stage: 4, offset: [60, -50, 0], order: 1, motion: 'forward' },
    mass: 110,
    thermal: 0.6,
    internal: true,
  },
  {
    id: 'roller_left',
    name: 'Locking roller, left',
    group: 'action',
    material: 'chrome',
    materialLabel: 'Hardened steel roller, graded by diameter to set bolt gap',
    geometry: { kind: 'cylinder', radius: 4, length: 10, axis: 'z', segments: 20 },
    position: [30, 0, -14],
    parent: 'bolt_head',
    function: 'Forced outward into the trunnion recess by the locking piece; on firing it is cammed back in, delaying the breech.',
    confidence: 'published',
    adjacent: ['bolt_head', 'locking_piece', 'receiver'],
    strip: { stage: 4, offset: [0, 0, -40], order: 2, motion: 'left' },
    mass: 12,
    internal: true,
  },
  {
    id: 'roller_right',
    name: 'Locking roller, right',
    group: 'action',
    material: 'chrome',
    materialLabel: 'Hardened steel roller, graded by diameter to set bolt gap',
    geometry: { kind: 'cylinder', radius: 4, length: 10, axis: 'z', segments: 20 },
    position: [30, 0, 14],
    parent: 'bolt_head',
    function: 'Twin of the left roller; oversize rollers restore bolt gap as the trunnion wears.',
    confidence: 'published',
    adjacent: ['bolt_head', 'locking_piece', 'receiver'],
    strip: { stage: 4, offset: [0, 0, 40], order: 2, motion: 'right' },
    mass: 12,
    internal: true,
  },
  {
    id: 'extractor',
    name: 'Extractor',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [26, 5, 4], radius: 1 },
    position: [34, 5, 10],
    parent: 'bolt_head',
    function: 'Spring-loaded claw on the right of the bolt head; grips the case rim for extraction.',
    confidence: 'estimated',
    adjacent: ['bolt_head'],
    strip: { stage: 4, offset: [0, 0, 30], order: 3, motion: 'right' },
    mass: 6,
    internal: true,
  },
  {
    id: 'locking_piece',
    name: 'Locking piece',
    group: 'action',
    material: 'steel-worn',
    materialLabel: 'Hardened steel wedge',
    geometry: { kind: 'lathe', profile: [[0, 0], [6.5, 0], [6.5, 18], [9.5, 20], [9.5, 32], [3.5, 38], [0, 38]], segments: 20 },
    position: [CARRIER_LEN - 45, 0, 0],
    parent: 'bolt_carrier',
    function: 'Wedge between the rollers; its shoulder angle sets the delay ratio between bolt head and carrier.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'bolt_head', 'roller_left', 'roller_right', 'firing_pin'],
    strip: { stage: 4, offset: [40, 60, 0], order: 0, motion: 'up' },
    mass: 45,
    internal: true,
  },
  {
    id: 'firing_pin',
    name: 'Firing pin',
    group: 'action',
    material: 'chrome',
    geometry: { kind: 'lathe', profile: [[0, 0], [4, 0], [4, 12], [2.2, 14], [2.2, 150], [1.2, 153], [0, 153]], segments: 16 },
    position: [42, 0, 0],
    parent: 'bolt_carrier',
    function: 'Runs through the carrier and locking piece to the bolt face; struck by the hammer at the rear of the carrier.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'locking_piece', 'bolt_head', 'hammer', 'firing_pin_spring'],
    strip: { stage: 4, offset: [90, 90, 0], order: 3, motion: 'forward' },
    mass: 14,
    internal: true,
  },
  {
    id: 'firing_pin_spring',
    name: 'Firing pin spring',
    group: 'action',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 3.6, length: 60, turns: 14, wire: 0.9 },
    position: [90, 0, 0],
    parent: 'bolt_carrier',
    function: 'Holds the firing pin back off the primer until the hammer drives it forward.',
    confidence: 'estimated',
    adjacent: ['firing_pin', 'bolt_carrier'],
    strip: { stage: 4, offset: [90, 120, 0], order: 4, motion: 'forward' },
    mass: 4,
    internal: true,
  },

  // ------------------------------------------------------------ feed
  {
    id: 'magazine',
    name: 'Magazine, 20-round aluminium',
    group: 'feed',
    material: 'anodised-aluminium-grey',
    materialLabel: 'Aluminium body, steel floorplate and spring',
    geometry: { kind: 'extrude', shape: magProfile, depth: 24, bevel: 2, curveSegments: 6 },
    position: [0, 0, 0],
    function: 'Straight double-column magazine; the aluminium body weighs half the earlier steel pattern.',
    notes: ['Height about 200 mm', 'Empty mass about 140 g'],
    confidence: 'published',
    adjacent: ['receiver', 'mag_release', 'bolt_head'],
    strip: { stage: 1, offset: [0, -170, 0], rotate: [0, 0, 0.05], motion: 'down' },
    mass: 140,
  },
  {
    id: 'follower',
    name: 'Follower',
    group: 'feed',
    material: 'polymer-black',
    geometry: { kind: 'box', size: [62, 8, 20], radius: 2 },
    position: [-34, -62, 0],
    parent: 'magazine',
    function: 'Presents the cartridge stack to the feed lips, alternating left and right.',
    confidence: 'estimated',
    adjacent: ['magazine', 'magazine_spring'],
    strip: { stage: 5, offset: [0, 70, 0], order: 1, motion: 'up' },
    mass: 10,
    internal: true,
  },
  {
    id: 'magazine_spring',
    name: 'Magazine spring',
    group: 'feed',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 9, length: 130, turns: 8, wire: 1.4, axis: 'y' },
    position: [-32, -135, 0],
    parent: 'magazine',
    function: 'Lifts the column; a 20-round stack of 7.62 mm needs a stiff, long-travel spring.',
    confidence: 'estimated',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, 40, 0], order: 2, motion: 'up' },
    mass: 18,
    internal: true,
  },
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `round_${i + 1}`,
    name: `Cartridge, 7.62×51 mm NATO (${i + 1})`,
    group: 'ammunition' as const,
    material: 'brass' as const,
    geometry: { kind: 'cartridge' as const, caseDiameter: 11.94, caseLength: 51.2, bulletDiameter: 7.82, bulletLength: 28.5, rimDiameter: 12.01, shoulder: 0.78 },
    position: [-70, -22 - i * 11, i % 2 === 0 ? 5 : -5] as Vec3,
    parent: 'magazine',
    function: 'Staggered in the magazine; the top round is stripped forward by the bolt head on each cycle.',
    confidence: 'published' as const,
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5 as const, offset: [0, 100 + i * 22, 0] as Vec3, order: 3, motion: 'up' as const },
    mass: 25,
    internal: true,
  })),
];

export const g3: FirearmDefinition = {
  id: 'g3',
  name: 'Heckler & Koch G3A3',
  shortName: 'G3A3',
  spec: {
    manufacturer: 'Heckler & Koch GmbH, Oberndorf (licence production by Rheinmetall, MKEK, POF, Indústrias Nacionais de Defesa and others)',
    designation: 'Gewehr G3A3, 7.62 mm',
    origin: 'West Germany',
    designed: { value: 1959, confidence: 'published', note: 'adopted by the Bundeswehr 1959; A3 configuration from 1964' },
    category: 'battle',
    categoryLabel: 'Battle rifle',
    cartridge: '7.62×51 mm NATO',
    action: 'roller-delayed',
    actionLabel: 'Roller-delayed blowback',
    feed: 'box-magazine',
    capacity: { value: '20-round detachable box (aluminium or steel)', confidence: 'published' },
    overallLength: { value: 1025, unit: 'mm', confidence: 'published', note: 'fixed stock' },
    barrelLength: { value: 450, unit: 'mm', confidence: 'published', note: 'without flash suppressor' },
    mass: { value: 4400, unit: 'g', confidence: 'published', note: 'with empty magazine (HK and Bundeswehr figure); some references give about 4,100 g without magazine' },
    muzzleVelocity: { value: 800, unit: 'm/s', confidence: 'published', note: 'DM41 ball, nominal' },
    rateOfFire: { value: '500–600 rounds/min cyclic', confidence: 'published' },
    effectiveRange: { value: 400, unit: 'm', confidence: 'published', note: 'iron sights, point target' },
    twist: { value: '1 in 305 mm (12 in), RH, 4 grooves', confidence: 'published' },
    sights: 'Hooded post front, rotary drum rear with V-notch (100 m) and apertures for 200, 300 and 400 m; claw mount for optics',
    identification: 'Long stamped receiver with a slim ventilated handguard below an exposed cocking tube, a folding cocking handle far forward on the left, a straight 20-round magazine and a rotary drum rear sight.',
    mechanism: 'Two rollers in the bolt head are wedged into recesses in the barrel trunnion by a locking piece. On firing the rollers are cammed inward, and the mechanical disadvantage between bolt head and carrier delays the breech until pressure has dropped. There is no gas system; a fluted chamber floats the case during extraction.',
  },
  provenance: {
    configuration: 'G3A3, fixed polymer stock, slim green polymer handguard, slotted flash suppressor, rotary drum rear sight, 20-round aluminium magazine',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'Heckler & Koch G3 product sheet (Gewehr G3A3/G3A4)', covers: ['overallLength', 'barrelLength', 'mass', 'muzzleVelocity', 'rateOfFire', 'capacity'] },
      { label: 'Bundeswehr TDv 1005/003-12, Gewehr G3, Beschreibung und Bedienungsanleitung', covers: ['effectiveRange', 'sights', 'field strip sequence', 'component names'] },
      { label: 'Jane’s Infantry Weapons', covers: ['designed', 'twist', 'mass'] },
      { label: 'NATO STANAG 2310 / C.I.P. 7.62×51 mm cartridge drawing', covers: ['cartridge'] },
    ],
    notes: [
      'Exterior proportions follow published dimensions; the trunnion, locking piece geometry and trigger internals are estimated from parts diagrams.',
      'Bolt gap, roller diameter grades and the ejector are not modelled; the fluted chamber is shown as a separate internal component so it appears in x-ray.',
      'The cocking handle is shown folded forward at rest and travels with the cocking lever support during the cycle animation.',
    ],
  },
  components,
  actions: {
    cycle: {
      id: 'cycle',
      label: 'Cock and slap',
      duration: 1.9,
      interruptible: false,
      steps: [
        { component: 'cocking_handle', t: [0.0, 0.15], rotate: [0, Math.PI / 2, 0], easing: 'inOutCubic' },
        { component: 'cocking_support', t: [0.15, 0.55], translate: [-BOLT_TRAVEL, 0, 0], easing: 'inOutCubic' },
        { component: 'bolt_carrier', t: [0.17, 0.57], translate: [-BOLT_TRAVEL, 0, 0], easing: 'inOutCubic' },
        { component: 'hammer', t: [0.25, 0.45], rotate: [0, 0, 0], easing: 'outQuad' },
        { component: 'cocking_handle', t: [0.55, 0.7], rotate: [0.5, Math.PI / 2, 0], easing: 'detent' },
        { component: 'cocking_handle', t: [1.1, 1.2], rotate: [0, Math.PI / 2, 0], easing: 'mechanicalSnap' },
        { component: 'bolt_carrier', t: [1.2, 1.38], reset: true, easing: 'springReturn' },
        { component: 'cocking_support', t: [1.2, 1.4], reset: true, easing: 'springReturn' },
        { component: 'cocking_handle', t: [1.55, 1.75], reset: true, easing: 'inOutCubic' },
      ],
      audio: [
        { event: 'charge_pull', at: 0.15, component: 'cocking_handle', caption: 'Cocking handle drawn back; the carrier rides over the hammer' },
        { event: 'ui_detent', at: 0.7, component: 'cocking_handle', caption: 'Handle hooked up into the notch, bolt held open' },
        { event: 'bolt_release', at: 1.2, component: 'cocking_handle', caption: 'Handle slapped down; the recoil spring takes over' },
        { event: 'bolt_battery', at: 1.38, component: 'bolt_head', caption: 'Rollers cam out into the trunnion' },
      ],
    },
    dryFire: {
      id: 'dryFire',
      label: 'Dry fire',
      duration: 0.7,
      steps: [
        { component: 'trigger', t: [0.0, 0.15], rotate: [0, 0, -0.16], easing: 'inQuad' },
        { component: 'hammer', t: [0.14, 0.2], rotate: [0, 0, -1.1], easing: 'mechanicalSnap' },
        { component: 'trigger', t: [0.42, 0.6], reset: true, easing: 'outQuad' },
      ],
      audio: [
        { event: 'trigger_break', at: 0.14, component: 'trigger', caption: 'Sear releases' },
        { event: 'hammer_fall', at: 0.2, component: 'hammer', caption: 'Hammer strikes the firing pin' },
        { event: 'trigger_reset', at: 0.58, component: 'trigger', caption: 'Trigger resets' },
      ],
    },
    reload: {
      id: 'reload',
      label: 'Magazine change',
      duration: 1.6,
      steps: [
        { component: 'mag_release', t: [0.0, 0.1], rotate: [0, 0, -0.35], easing: 'outQuad' },
        { component: 'magazine', t: [0.08, 0.45], translate: [0, -190, 0], rotate: [0, 0, 0.06], easing: 'outQuad' },
        { component: 'mag_release', t: [0.35, 0.45], reset: true, easing: 'outQuad' },
        { component: 'magazine', t: [0.9, 1.12], reset: true, easing: 'mechanicalSnap' },
      ],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_release', caption: 'Release paddle pressed forward' },
        { event: 'mag_out', at: 0.12, component: 'magazine', caption: 'Magazine drops clear' },
        { event: 'mag_seat', at: 1.1, component: 'magazine', caption: 'Magazine seats on the catch' },
      ],
    },
    safety: {
      id: 'safety',
      label: 'Selector',
      duration: 0.35,
      steps: [{ component: 'selector', t: [0.0, 0.22], rotate: [0, 0, -0.7], easing: 'detent' }],
      audio: [{ event: 'selector', at: 0.2, component: 'selector', caption: 'Selector from S to E' }],
    },
  },
  acoustic: {
    mass: 4400,
    receiver: 'steel-stamped',
    action: 'roller-delayed',
    reciprocatingMass: 880,
    spring: { frequency: 20, damping: 0.32 },
    furniture: 'polymer',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'In battery',
      description: 'Fully assembled, rollers seated in the trunnion, magazine locked on the catch.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Magazine withdrawn',
      description: 'The 20-round aluminium magazine drops from the well; the bolt group and chamber are checked before anything else comes apart.',
      camera: 'side',
      focus: ['magazine', 'mag_release', 'receiver'],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_release', caption: 'Release paddle' },
        { event: 'mag_out', at: 0.15, component: 'magazine', caption: 'Magazine withdrawn' },
      ],
    },
    {
      stage: 2,
      title: 'Stock and grip frame off',
      description: 'With the two rear pins out, the stock slides back with the recoil spring and buffer inside it, and the grip frame with the whole trigger mechanism swings down off the receiver.',
      camera: 'side',
      focus: ['push_pin_upper', 'push_pin_lower', 'stock', 'trigger_group', 'recoil_spring'],
      audio: [
        { event: 'pin_push', at: 0.0, component: 'push_pin_upper', caption: 'Upper pin out' },
        { event: 'pin_push', at: 0.12, component: 'push_pin_lower', caption: 'Lower pin out' },
        { event: 'receiver_split', at: 0.35, component: 'stock', caption: 'Stock and grip frame separate' },
      ],
    },
    {
      stage: 3,
      title: 'Bolt group withdrawn',
      description: 'The carrier, bolt head, locking piece and firing pin leave the open rear of the receiver as one heavy unit; the cocking lever stays in its tube.',
      camera: 'iso',
      focus: ['bolt_carrier', 'bolt_head', 'locking_piece', 'receiver'],
      audio: [{ event: 'component_out', at: 0.1, component: 'bolt_carrier', caption: 'Bolt group withdrawn' }],
    },
    {
      stage: 4,
      title: 'Bolt head stripped',
      description: 'The locking piece lifts out, the bolt head turns and comes off the carrier, and the two rollers fall free; the firing pin and its spring follow.',
      camera: 'detail-action',
      focus: ['bolt_head', 'roller_left', 'roller_right', 'locking_piece', 'firing_pin', 'bolt_carrier'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'locking_piece', caption: 'Locking piece out' },
        { event: 'component_out', at: 0.2, component: 'bolt_head', caption: 'Bolt head off the carrier' },
        { event: 'component_out', at: 0.4, component: 'roller_left', caption: 'Rollers free' },
        { event: 'component_out', at: 0.6, component: 'firing_pin', caption: 'Firing pin and spring out' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis. Barrel, cocking tube and sights are welded or pressed assemblies and are shown only to complete the atlas.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 1,025 mm', from: [BUTT, -200, 0], to: [HIDER_TIP, -200, 0] },
      { label: 'Barrel 450 mm', from: [0, 95, 0], to: [MUZZLE, 95, 0] },
    ],
  },
  cartridge: { caseDiameter: 11.94, caseLength: 51.2, bulletDiameter: 7.82, bulletLength: 28.5, rimDiameter: 12.01, label: '7.62×51 mm NATO' },
  ejection: { position: [-28, 4, 21], direction: [0.3, 0.45, 1] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default g3;
