import type { ComponentDef, FirearmDefinition, Vec2, Vec3 } from '@/firearm/schema';

/**
 * AS Val (Avtomat Spetsialny), integrally suppressed 9×39 mm assault rifle,
 * side-folding tubular stock shown extended.
 *
 * Frame: bore axis y=0, bolt face (in battery) at x=0, +x toward the muzzle,
 * +z shooter's right. All dimensions mm.
 *
 * Published dimensions: overall 875 mm extended / 615 mm folded, barrel
 * 200 mm, mass 2.5 kg without magazine, muzzle velocity 295 m/s (SP-6),
 * cyclic 900 rounds/min (TsNIITochMash product data; Russian Army manual for
 * the 9 mm AS). The suppressor tip sits about 350 mm ahead of the bolt face;
 * that figure is derived from the folded length and marked as estimated.
 * Internal layout is estimated and marked as such.
 */

// ---- layout constants (mm) --------------------------------------------------
const MUZZLE = 200; // ported barrel ends here, inside the suppressor
const SUPP_REAR = 90; // suppressor rear collar
const SUPP_TIP = 350;
const RCV_REAR = -262;
const RCV_FRONT = 40;
const RCV_BOTTOM = -34;
const RCV_TOP = 12;
const COVER_TOP = 30;
const GAS_AXIS = 20;
const HINGE_X = -258; // stock hinge on the receiver rear cap
const BUTT = -526; // rear face of the butt (875 mm overall extended)
const BOLT_TRAVEL = 120;

const receiverWall: Vec2[] = [
  [RCV_FRONT, RCV_BOTTOM],
  [RCV_FRONT, RCV_TOP],
  [RCV_REAR + 4, RCV_TOP],
  [RCV_REAR, 6],
  [RCV_REAR, RCV_BOTTOM],
];

// Receiver cover cross-section in (u = -z, v = y)
const coverSection: Vec2[] = (() => {
  const pts: Vec2[] = [
    [-16, RCV_TOP],
    [16, RCV_TOP],
    [16, 22],
  ];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI;
    pts.push([Math.cos(a) * 16, 22 + Math.sin(a) * (COVER_TOP - 22)]);
  }
  pts.push([-16, 22]);
  return pts;
})();

const gripProfile: Vec2[] = [
  [-150, -33],
  [-182, -33],
  [-200, -100],
  [-202, -112],
  [-174, -114],
  [-162, -88],
  [-154, -56],
];

const triggerProfile: Vec2[] = [
  [-5, 4],
  [6, 4],
  [6, -4],
  [3, -14],
  [-2, -22],
  [-8, -30],
  [-15, -36],
  [-17, -32],
  [-11, -22],
  [-6, -12],
];

const hammerProfile: Vec2[] = [
  [-7, -7],
  [7, -7],
  [8, 4],
  [5, 14],
  [4, 22],
  [8, 28],
  [2, 32],
  [-6, 30],
  [-7, 20],
  [-7, 6],
];

const safetyProfile: Vec2[] = [
  [-7, -5],
  [7, -7],
  [40, -2],
  [82, 8],
  [92, 12],
  [93, 18],
  [85, 18],
  [42, 6],
  [7, 0],
  [-7, 2],
];

// 20-round polymer magazine, nearly straight with a slight forward lean
const magProfile: Vec2[] = [
  [-18, -8],
  [-18, -40],
  [-15, -90],
  [-8, -138],
  [-6, -152],
  [-70, -152],
  [-74, -138],
  [-80, -90],
  [-84, -40],
  [-84, -8],
];

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver
  {
    id: 'receiver',
    name: 'Stamped receiver',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Stamped sheet steel, riveted trunnions, rear cap with stock hinge',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: receiverWall, depth: 1.6 }, position: [0, 0, 14.2] },
        { geometry: { kind: 'extrude', shape: receiverWall, depth: 1.6 }, position: [0, 0, -14.2] },
        // floor either side of the magazine well
        { geometry: { kind: 'box', size: [56, 3, 30] }, position: [12, RCV_BOTTOM + 1.5, 0] },
        { geometry: { kind: 'box', size: [170, 3, 30] }, position: [-177, RCV_BOTTOM + 1.5, 0] },
        // rear trunnion / cap carrying the stock hinge
        { geometry: { kind: 'box', size: [26, 40, 26], radius: 1 }, position: [RCV_REAR + 13, -10, 0] },
        // hinge knuckle on the left of the cap
        { geometry: { kind: 'cylinder', radius: 6, length: 30, axis: 'y' }, position: [HINGE_X, -6, -17] },
        // carrier rails
        { geometry: { kind: 'box', size: [280, 3, 4] }, position: [-105, RCV_TOP - 1.5, 12] },
        { geometry: { kind: 'box', size: [280, 3, 4] }, position: [-105, RCV_TOP - 1.5, -12] },
      ],
    },
    position: [0, 0, 0],
    function: 'Stamped steel box derived from the Kalashnikov layout; carries the trunnions, guides the carrier on two rails and houses the fire-control group and magazine well.',
    confidence: 'estimated',
    adjacent: ['dust_cover', 'front_trunnion', 'bolt_carrier', 'magazine', 'stock', 'trigger_guard'],
    mass: 380,
    thermal: 0.2,
  },
  {
    id: 'dust_cover',
    name: 'Receiver cover',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Stamped sheet steel',
    geometry: { kind: 'extrude', shape: coverSection, depth: 282, axis: 'x' },
    position: [-119, 0, 0],
    function: 'Sheet-steel lid over the carrier; latched at the rear by the recoil spring guide base, trapped at the front under the gas block.',
    confidence: 'estimated',
    adjacent: ['receiver', 'recoil_spring_assembly', 'gas_block', 'bolt_carrier'],
    strip: { stage: 2, offset: [0, 105, 0], order: 0, motion: 'up' },
    mass: 120,
    thermal: 0.25,
  },
  {
    id: 'front_trunnion',
    name: 'Front trunnion',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Forged steel, riveted into the stamping',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [66, 40, 28], radius: 1.5 }, position: [11, -8, 0] },
        // suppressor bayonet seat
        { geometry: { kind: 'lathe', profile: [[9, 0], [16, 0], [16, 12], [9, 12]], segments: 32 }, position: [44, 0, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Forged block that holds the barrel and takes the six bolt lugs; its front face is the seat for the suppressor collar.',
    confidence: 'estimated',
    adjacent: ['receiver', 'barrel', 'bolt', 'suppressor_tube', 'magazine'],
    strip: { stage: 5, offset: [20, 95, 0], order: 2, motion: 'up' },
    mass: 230,
    thermal: 0.5,
    internal: true,
  },

  // ------------------------------------------------------------ barrel / suppressor
  {
    id: 'barrel',
    name: 'Ported barrel, 200 mm',
    group: 'barrel',
    material: 'parkerised-steel',
    materialLabel: 'Chrome-lined steel, 54 gas ports drilled through the rifling',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, 0], [11, 0], [11, 42], [9, 45], [9, 55], [8.2, 58], [8.2, MUZZLE], [4.6, MUZZLE]], segments: 40 } },
        // port markers: four rows of five (the real barrel has six rows of nine)
        ...([0, 1, 2, 3] as const).flatMap((row) =>
          [110, 128, 146, 164, 182].map((x): { geometry: ComponentDef['geometry']; position: Vec3 } => ({
            geometry: { kind: 'cylinder', radius: 1.4, length: 3, axis: row < 2 ? 'y' : 'z' },
            position: [x, row === 0 ? 8.2 : row === 1 ? -8.2 : 0, row === 2 ? 8.2 : row === 3 ? -8.2 : 0],
          })),
        ),
      ],
    },
    position: [0, 0, 0],
    function: 'Short chrome-lined barrel whose ports bleed gas into the expansion chamber so the heavy bullet leaves at about 295 m/s, below the speed of sound.',
    notes: ['Length 200 mm measured from the bolt face', 'Ports shown as markers; the real barrel has six rows of nine'],
    confidence: 'published',
    adjacent: ['front_trunnion', 'gas_block', 'expansion_sleeve', 'suppressor_tube'],
    strip: { stage: 5, offset: [130, 0, 0], order: 1, motion: 'forward' },
    mass: 320,
    thermal: 0.8,
    internal: true,
  },
  {
    id: 'gas_block',
    name: 'Gas block',
    group: 'gas-system',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[8.3, 0], [13, 0], [13, 30], [8.3, 30]], segments: 32 }, position: [0, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 9.5, length: 32 }, position: [15, GAS_AXIS, 0] },
        { geometry: { kind: 'box', size: [30, 12, 14] }, position: [15, 10, 0] },
      ],
    },
    position: [55, 0, 0],
    function: 'Sits on the barrel just ahead of the receiver; gas from the port strikes the short piston head in the cylinder above the bore.',
    confidence: 'estimated',
    adjacent: ['barrel', 'bolt_carrier', 'dust_cover', 'suppressor_tube'],
    strip: { stage: 5, offset: [0, 110, 0], order: 0, motion: 'up' },
    mass: 80,
    thermal: 0.9,
  },
  {
    id: 'suppressor_tube',
    name: 'Integral suppressor tube',
    group: 'muzzle',
    material: 'parkerised-steel',
    materialLabel: 'Steel tube, about 36 mm outside diameter',
    geometry: {
      kind: 'lathe',
      profile: [[9, 0], [19.5, 0], [19.5, 32], [18, 34], [18, 254], [17, 257], [17, 260], [6, 260]],
      segments: 48,
    },
    position: [SUPP_REAR, 0, 0],
    function: 'Detachable outer tube that carries both iron sights; behind the baffles it forms the expansion chamber that the ported barrel vents into.',
    notes: ['Tip about 350 mm ahead of the bolt face (derived from the folded length)', 'Locked to the trunnion by a lever on the collar'],
    confidence: 'estimated',
    adjacent: ['front_trunnion', 'suppressor_latch', 'baffle_stack', 'expansion_sleeve', 'rear_sight', 'front_sight'],
    strip: { stage: 4, offset: [210, 0, 0], order: 1, motion: 'forward' },
    mass: 430,
    thermal: 0.65,
  },
  {
    id: 'suppressor_latch',
    name: 'Suppressor lock lever',
    group: 'muzzle',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 8, axis: 'z' }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [22, 6, 3], radius: 1 }, position: [10, 0, 1] },
      ],
    },
    position: [98, -14, 20],
    pivot: [0, 0, 0],
    function: 'Cam lever on the collar; turned down it frees the suppressor to slide forward off the barrel.',
    confidence: 'estimated',
    adjacent: ['suppressor_tube', 'front_trunnion'],
    strip: { stage: 4, offset: [0, 0, 0], rotate: [0, 0, -1.3], order: 0, motion: 'down' },
    mass: 10,
  },
  {
    id: 'expansion_sleeve',
    name: 'Expansion chamber sleeve',
    group: 'muzzle',
    material: 'stainless-steel',
    geometry: { kind: 'lathe', profile: [[11, 0], [13, 0], [13, 90], [11, 90]], segments: 32 },
    position: [15, 0, 0],
    parent: 'suppressor_tube',
    function: 'Inner sleeve around the ported barrel; gas leaving the ports expands and cools between it and the outer tube.',
    confidence: 'estimated',
    adjacent: ['suppressor_tube', 'barrel', 'baffle_stack'],
    strip: { stage: 5, offset: [-60, -50, 0], order: 1, motion: 'rear' },
    mass: 45,
    thermal: 0.75,
    internal: true,
  },
  {
    id: 'baffle_stack',
    name: 'Baffle stack',
    group: 'muzzle',
    material: 'stainless-steel',
    materialLabel: 'Stamped steel cones on a carrier frame',
    geometry: {
      kind: 'composite',
      parts: Array.from({ length: 6 }, (_, i): { geometry: ComponentDef['geometry']; position: Vec3 } => ({
        geometry: { kind: 'lathe', profile: [[5.5, 0], [16, 0], [16, 3], [5.5, 15]], segments: 28 },
        position: [i * 22, 0, 0],
      })),
    },
    position: [125, 0, 0],
    parent: 'suppressor_tube',
    function: 'Six angled cones strip the gas away from the bullet and slow it through successive chambers before it leaves the tube.',
    confidence: 'estimated',
    adjacent: ['suppressor_tube', 'expansion_sleeve'],
    strip: { stage: 5, offset: [90, -50, 0], order: 2, motion: 'forward' },
    mass: 90,
    thermal: 0.7,
    internal: true,
  },

  // ------------------------------------------------------------ sights
  {
    id: 'rear_sight',
    name: 'Rear sight, tangent leaf',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [32, 10, 16], radius: 1.5 }, position: [0, 5, 0] },
        { geometry: { kind: 'box', size: [44, 3, 12], radius: 0.5 }, position: [-8, 11.5, 0] },
        { geometry: { kind: 'box', size: [9, 6, 14], radius: 1 }, position: [4, 14, 0] },
        { geometry: { kind: 'box', size: [4, 8, 14] }, position: [-28, 15, 0] },
      ],
    },
    position: [25, 18, 0],
    parent: 'suppressor_tube',
    function: 'Leaf on the rear of the suppressor graduated to 400 m; both iron sights travel with the tube so its removal does not disturb zero.',
    confidence: 'estimated',
    adjacent: ['suppressor_tube', 'front_sight'],
    strip: { stage: 5, offset: [0, 60, 0], order: 3, motion: 'up' },
    mass: 30,
  },
  {
    id: 'front_sight',
    name: 'Front sight',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [22, 8, 12], radius: 1.5 }, position: [0, 4, 0] },
        { geometry: { kind: 'cylinder', radius: 1.3, length: 14, axis: 'y' }, position: [0, 14, 0] },
        { geometry: { kind: 'box', size: [12, 18, 2.5] }, position: [0, 15, 5.5] },
        { geometry: { kind: 'box', size: [12, 18, 2.5] }, position: [0, 15, -5.5] },
      ],
    },
    position: [240, 18, 0],
    parent: 'suppressor_tube',
    function: 'Hooded post near the front of the suppressor; sight radius about 215 mm.',
    confidence: 'estimated',
    adjacent: ['suppressor_tube', 'rear_sight'],
    strip: { stage: 5, offset: [0, 60, 0], order: 3, motion: 'up' },
    mass: 25,
  },

  // ------------------------------------------------------------ action
  {
    id: 'bolt_carrier',
    name: 'Bolt carrier with piston',
    group: 'action',
    material: 'steel-worn',
    materialLabel: 'Machined steel carrier, chrome-plated piston rod',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [110, 20, 26], radius: 2 }, position: [-65, 16, 0] },
        { geometry: { kind: 'box', size: [36, 10, 22], radius: 1 }, position: [-28, 2, 0] },
        // charging handle on the right
        { geometry: { kind: 'box', size: [24, 14, 20], radius: 4 }, position: [-95, 16, 25] },
        // short piston rod and head
        { geometry: { kind: 'lathe', profile: [[0, 0], [6, 0], [6, 4], [5, 6], [5, 70], [7.2, 72], [7.2, 82], [5, 84], [0, 84]], segments: 28 }, position: [-10, GAS_AXIS, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Gas on the piston head drives the carrier rearward about 120 mm; the cam track turns the bolt and the charging handle is part of the carrier.',
    notes: ['Reciprocating mass with bolt about 400 g'],
    confidence: 'estimated',
    adjacent: ['receiver', 'bolt', 'gas_block', 'recoil_spring_assembly', 'hammer'],
    strip: { stage: 3, offset: [-250, 75, 0], order: 0, motion: 'rear' },
    mass: 330,
    thermal: 0.6,
  },
  {
    id: 'bolt',
    name: 'Rotating bolt, six lugs',
    group: 'action',
    material: 'steel-worn',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, -78], [4.5, -78], [4.5, -58], [7.5, -56], [7.5, -20], [9, -18], [9, 0], [0, 0]], segments: 28 } },
        ...Array.from({ length: 6 }, (_, i): { geometry: ComponentDef['geometry']; position: Vec3; rotation: Vec3 } => {
          const a = (i / 6) * Math.PI * 2;
          return { geometry: { kind: 'box', size: [12, 3, 4] }, position: [-6, Math.cos(a) * 10, Math.sin(a) * 10], rotation: [-a, 0, 0] };
        }),
        { geometry: { kind: 'box', size: [8, 6, 5], radius: 1 }, position: [-28, 9, 0] },
      ],
    },
    position: [0, 0, 0],
    parent: 'bolt_carrier',
    function: 'Six lugs lock into the trunnion with a short rotation; the carrier cam track turns it after the first few millimetres of travel.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'front_trunnion', 'firing_pin', 'extractor', 'barrel'],
    strip: { stage: 3, offset: [70, -50, 0], rotate: [0.5, 0, 0], order: 1, motion: 'forward' },
    mass: 65,
    thermal: 0.55,
    internal: true,
  },
  {
    id: 'firing_pin',
    name: 'Firing pin',
    group: 'action',
    material: 'chrome',
    geometry: { kind: 'lathe', profile: [[0, -74], [3, -74], [3, -28], [1.3, -26], [1.3, 1], [0, 1]], segments: 16 },
    position: [0, 0, 0],
    parent: 'bolt',
    function: 'Free-floating inside the bolt; struck by the hammer through the rear of the carrier.',
    confidence: 'estimated',
    adjacent: ['bolt', 'hammer'],
    strip: { stage: 5, offset: [-90, 0, 0], order: 1, motion: 'rear' },
    mass: 7,
    internal: true,
  },
  {
    id: 'extractor',
    name: 'Extractor',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [14, 5, 4], radius: 1 },
    position: [-7, 5, 8],
    parent: 'bolt',
    function: 'Spring-loaded claw in the bolt head that draws the case from the chamber.',
    confidence: 'estimated',
    adjacent: ['bolt', 'firing_pin'],
    strip: { stage: 5, offset: [0, 0, 30], order: 2, motion: 'right' },
    mass: 4,
    internal: true,
  },
  {
    id: 'recoil_spring_assembly',
    name: 'Recoil spring assembly',
    group: 'action',
    material: 'stainless-steel',
    materialLabel: 'Wire spring on a guide rod with a cover latch base',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'spring', radius: 6, length: 135, turns: 24, wire: 1.5 }, position: [-175, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 2.4, length: 150 }, position: [-175, 0, 0] },
        { geometry: { kind: 'box', size: [8, 20, 20], radius: 1 }, position: [-254, -4, 0] },
        { geometry: { kind: 'cylinder', radius: 5, length: 10 }, position: [-102, 0, 0] },
      ],
    },
    position: [0, 16, 0],
    function: 'Returns the carrier to battery; its rear base is the latch that holds the receiver cover shut.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'receiver', 'dust_cover'],
    strip: { stage: 2, offset: [-210, 55, 0], order: 1, motion: 'rear' },
    mass: 45,
    internal: true,
  },

  // ------------------------------------------------------------ fire control
  {
    id: 'hammer',
    name: 'Hammer',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: hammerProfile, depth: 11, bevel: 0.8 },
    position: [-92, -16, 0],
    pivot: [0, 0, 0],
    rotation: [0, 0, 0.95],
    function: 'Held cocked by the trigger sear; when released it swings forward to strike the firing pin.',
    confidence: 'estimated',
    adjacent: ['trigger', 'firing_pin', 'bolt_carrier', 'safety_lever', 'fire_selector'],
    strip: { stage: 5, offset: [0, -50, 55], order: 1, motion: 'right' },
    mass: 50,
    internal: true,
  },
  {
    id: 'trigger',
    name: 'Trigger',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: triggerProfile, depth: 9, bevel: 0.6 },
    position: [-110, -16, 0],
    pivot: [0, 0, 0],
    function: 'Releases the hammer after about 5 mm of travel; the fire selector behind it decides whether the disconnector or the auto sear takes over.',
    confidence: 'estimated',
    adjacent: ['hammer', 'fire_selector', 'receiver', 'trigger_guard'],
    strip: { stage: 5, offset: [0, -50, -55], order: 1, motion: 'left' },
    mass: 22,
  },
  {
    id: 'fire_selector',
    name: 'Fire selector',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 16, axis: 'z' }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [6, 14, 6], radius: 1 }, position: [0, -8, 0] },
      ],
    },
    position: [-138, -40, 0],
    pivot: [0, 0, 0],
    function: 'Small lever inside the trigger guard behind the trigger; turned across it selects single shots or automatic fire, separately from the safety.',
    confidence: 'published',
    adjacent: ['trigger', 'trigger_guard', 'hammer'],
    strip: { stage: 5, offset: [0, -50, 40], order: 2, motion: 'down' },
    mass: 10,
  },
  {
    id: 'safety_lever',
    name: 'Safety lever',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 34, axis: 'z' }, position: [0, 0, -16] },
        { geometry: { kind: 'extrude', shape: safetyProfile, depth: 2.5 }, position: [0, 0, 0.5] },
      ],
    },
    position: [-150, -4, 16.5],
    pivot: [0, 0, 0],
    function: 'Kalashnikov-pattern lever on the right of the receiver; at SAFE (up) it blocks the trigger and closes the charging-handle slot.',
    confidence: 'published',
    adjacent: ['receiver', 'trigger', 'hammer', 'bolt_carrier'],
    strip: { stage: 5, offset: [0, 0, 70], order: 2, motion: 'right' },
    mass: 28,
  },
  {
    id: 'trigger_guard',
    name: 'Trigger guard',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [6, 22, 12] }, position: [-96, -46, 0] },
        { geometry: { kind: 'box', size: [58, 4, 12], radius: 1.5 }, position: [-122, -58, 0] },
        { geometry: { kind: 'box', size: [6, 22, 12] }, position: [-148, -46, 0] },
      ],
    },
    position: [0, 0, 0],
    parent: 'receiver',
    function: 'Riveted to the receiver floor; the fire selector sits inside it behind the trigger.',
    confidence: 'estimated',
    adjacent: ['receiver', 'trigger', 'fire_selector', 'mag_catch'],
    strip: { stage: 5, offset: [0, -60, 0], order: 3, motion: 'down' },
    mass: 22,
  },
  {
    id: 'mag_catch',
    name: 'Magazine catch',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 2.5, length: 22, axis: 'z' }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [10, 10, 14], radius: 1 }, position: [6, 3, 0] },
        { geometry: { kind: 'box', size: [16, 5, 16], radius: 1.5 }, position: [-8, -6, 0] },
      ],
    },
    position: [-90, -40, 0],
    pivot: [0, 0, 0],
    function: 'Paddle ahead of the trigger guard; pushed forward it lifts the hook off the magazine so it can rock out.',
    confidence: 'estimated',
    adjacent: ['receiver', 'magazine', 'trigger_guard'],
    strip: { stage: 5, offset: [0, -60, 40], order: 3, motion: 'down' },
    mass: 14,
  },

  // ------------------------------------------------------------ furniture
  {
    id: 'pistol_grip',
    name: 'Pistol grip',
    group: 'furniture',
    material: 'polymer-black',
    materialLabel: 'Glass-filled polyamide',
    geometry: { kind: 'extrude', shape: gripProfile, depth: 30, bevel: 3, curveSegments: 6 },
    position: [0, 0, 0],
    function: 'Retained by a single through-bolt into the receiver floor.',
    confidence: 'estimated',
    adjacent: ['receiver', 'trigger_guard'],
    strip: { stage: 5, offset: [0, -80, 0], order: 2, motion: 'down' },
    mass: 60,
  },
  {
    id: 'stock',
    name: 'Skeleton folding stock',
    group: 'furniture',
    material: 'parkerised-steel',
    materialLabel: 'Welded steel tube, phosphate finish',
    geometry: {
      kind: 'composite',
      parts: [
        // hinge block
        { geometry: { kind: 'box', size: [14, 32, 14], radius: 2 }, position: [HINGE_X + 2, -6, -16] },
        // upper tube
        { geometry: { kind: 'tube', path: [[HINGE_X - 4, 4, -10], [HINGE_X - 30, 4, -2], [-518, 4, 0]], radius: 5, segments: 16, radialSegments: 12 } },
        // lower tube, angled down to the toe
        { geometry: { kind: 'tube', path: [[HINGE_X - 4, -18, -10], [HINGE_X - 30, -22, -2], [-518, -66, 0]], radius: 5, segments: 16, radialSegments: 12 } },
        // vertical brace
        { geometry: { kind: 'cylinder', radius: 4, length: 46, axis: 'y' }, position: [-400, -18, 0] },
      ],
    },
    position: [0, 0, 0],
    pivot: [HINGE_X, -6, -16],
    function: 'Tubular frame hinged on the left of the receiver cap; it folds forward along the left side to bring the rifle down to 615 mm.',
    notes: ['Shown extended (875 mm overall)', 'Folds about a vertical hinge pin'],
    confidence: 'estimated',
    adjacent: ['receiver', 'butt_plate'],
    strip: { stage: 5, offset: [-120, -30, 0], order: 0, motion: 'rear' },
    mass: 260,
  },
  {
    id: 'butt_plate',
    name: 'Butt plate',
    group: 'furniture',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [8, 92, 28], radius: 2 },
    position: [BUTT + 4 - HINGE_X, -24, 16], // relative to the stock hinge pivot
    parent: 'stock',
    function: 'Steel plate welded across the ends of the two tubes.',
    confidence: 'estimated',
    adjacent: ['stock'],
    strip: { stage: 5, offset: [-50, 0, 0], order: 1, motion: 'rear' },
    mass: 40,
  },

  // ------------------------------------------------------------ feed
  {
    id: 'magazine',
    name: 'Magazine, 20-round polymer',
    group: 'feed',
    material: 'polymer-black',
    materialLabel: 'Glass-filled polyamide, steel feed lips',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: magProfile, depth: 27, bevel: 2, curveSegments: 6 } },
        { geometry: { kind: 'box', size: [6, 6, 20], radius: 1 }, position: [-15, -13, 0] },
        { geometry: { kind: 'box', size: [7, 8, 20], radius: 1 }, position: [-87, -30, 0] },
      ],
    },
    position: [0, 0, 0],
    pivot: [-15, -12, 0],
    function: 'Double-column box for the fat 9×39 round; it hooks in at the front and rocks back onto the catch like a Kalashnikov magazine.',
    notes: ['20 rounds; the 10-round VSS magazine also fits', 'About 145 mm tall'],
    confidence: 'estimated',
    adjacent: ['receiver', 'mag_catch', 'front_trunnion', 'bolt'],
    strip: { stage: 1, offset: [30, -150, 0], rotate: [0, 0, 0.3], motion: 'down' },
    mass: 150,
  },
  {
    id: 'follower',
    name: 'Follower',
    group: 'feed',
    material: 'polymer-black',
    geometry: { kind: 'box', size: [48, 8, 22], radius: 1.5 },
    position: [-35, -34, 0], // relative to the magazine pivot
    parent: 'magazine',
    function: 'Platform that lifts the staggered cartridge stack to the feed lips.',
    confidence: 'estimated',
    adjacent: ['magazine', 'magazine_spring'],
    strip: { stage: 5, offset: [0, 60, 0], order: 1, motion: 'up' },
    mass: 8,
    internal: true,
  },
  {
    id: 'magazine_spring',
    name: 'Magazine spring',
    group: 'feed',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 8, length: 90, turns: 8, wire: 1.2, axis: 'y' },
    position: [-31, -88, 0],
    parent: 'magazine',
    function: 'Provides the lift that feeds the last round as reliably as the first.',
    confidence: 'estimated',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, 40, 0], order: 2, motion: 'up' },
    mass: 12,
    internal: true,
  },
  ...Array.from({ length: 3 }, (_, i): ComponentDef => ({
    id: `round_${i + 1}`,
    name: `Cartridge, 9×39 mm SP-6 (${i + 1})`,
    group: 'ammunition',
    material: 'brass',
    materialLabel: 'Lacquered steel case, 16 g armour-piercing subsonic bullet',
    geometry: { kind: 'cartridge', caseDiameter: 11.35, caseLength: 38.7, bulletDiameter: 9.25, bulletLength: 34, rimDiameter: 11.35, shoulder: 0.72 },
    position: [-67, -2 - i * 10.5, i % 2 === 0 ? 5 : -5],
    parent: 'magazine',
    function: 'Staggered in the magazine; the heavy subsonic bullet is why the rifle needs no separate sound moderator.',
    confidence: 'published',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, 50 + i * 14, 0], order: 3, motion: 'up' },
    mass: 23,
    internal: true,
  })),
];

export const asval: FirearmDefinition = {
  id: 'asval',
  name: 'AS Val',
  shortName: 'AS Val',
  spec: {
    manufacturer: 'Tula Arms Plant (TOZ); designed at TsNIITochMash, Klimovsk',
    designation: 'AS Val, 9 mm special automatic rifle (GRAU 6P30)',
    origin: 'Soviet Union',
    designed: { value: 1987, confidence: 'published', note: 'year of adoption' },
    category: 'assault',
    categoryLabel: 'Suppressed assault rifle',
    cartridge: '9×39 mm',
    action: 'long-stroke-piston',
    actionLabel: 'Gas-operated, long-stroke piston, rotating bolt, integral suppressor',
    feed: 'box-magazine',
    capacity: { value: '20-round detachable box (10-round VSS magazine also fits)', confidence: 'published' },
    overallLength: { value: 875, unit: 'mm', confidence: 'published', note: 'stock extended' },
    overallLengthCollapsed: { value: 615, unit: 'mm', confidence: 'published', note: 'stock folded' },
    barrelLength: { value: 200, unit: 'mm', confidence: 'published' },
    mass: { value: 2500, unit: 'g', confidence: 'published', note: 'without magazine or optic' },
    muzzleVelocity: { value: 295, unit: 'm/s', confidence: 'published', note: 'SP-6, 16 g, subsonic' },
    rateOfFire: { value: '900 rounds/min cyclic', confidence: 'published' },
    effectiveRange: { value: 300, unit: 'm', confidence: 'published', note: 'sights graduated to 400 m' },
    twist: { value: null, confidence: 'unverified', note: 'source required' },
    sights: 'Post front and tangent leaf rear, both on the suppressor tube; left-side dovetail rail for PSO-1 or night optics',
    identification: 'A short Kalashnikov-style receiver with a fat suppressor tube where a barrel and handguard would be, a tubular side-folding stock and a stubby 20-round magazine.',
    mechanism: 'Gas from a port near the chamber drives a short piston on the bolt carrier through a stroke of about 120 mm; a six-lug bolt locks into the trunnion. The 200 mm barrel is drilled with 54 ports that vent into the suppressor’s expansion chamber, so the heavy 16 g bullet leaves below the speed of sound and the baffle stack strips the remaining gas.',
  },
  provenance: {
    configuration: 'AS Val, 20-round polymer magazine, tubular stock extended, iron sights only, suppressor fitted',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'TsNIITochMash product data, 9 mm special automatic rifle AS (Val)', covers: ['overallLength', 'overallLengthCollapsed', 'barrelLength', 'mass', 'muzzleVelocity', 'rateOfFire', 'capacity'] },
      { label: 'Russian Army manual, 9 mm special automatic rifle AS (6P30)', covers: ['effectiveRange', 'sights', 'mechanism'] },
      { label: 'Jane’s Infantry Weapons', covers: ['designed', 'rateOfFire', 'muzzleVelocity'] },
      { label: '9×39 mm cartridge data (SP-5 / SP-6)', covers: ['cartridge'] },
    ],
    notes: [
      'Exterior proportions follow published overall, folded and barrel lengths; the suppressor tip position (about 350 mm) is derived from the folded length, not measured.',
      'Barrel ports are shown as 20 markers; the real barrel has six rows of nine.',
      'Internal component positions are estimated from the Kalashnikov pattern; the gas block sits just ahead of the receiver in this model.',
      'The stock is drawn as two tubes and a brace; the real frame has additional gussets.',
    ],
  },
  components,
  actions: {
    cycle: {
      id: 'cycle',
      label: 'Charge',
      duration: 1.05,
      interruptible: false,
      steps: [
        { component: 'bolt_carrier', t: [0.0, 0.4], translate: [-BOLT_TRAVEL, 0, 0], easing: 'inOutCubic' },
        { component: 'bolt', t: [0.02, 0.1], rotate: [0.5, 0, 0], easing: 'inOutCubic' },
        { component: 'hammer', t: [0.1, 0.3], rotate: [0, 0, 0], easing: 'outQuad' },
        { component: 'bolt_carrier', t: [0.54, 0.74], reset: true, easing: 'springReturn' },
        { component: 'bolt', t: [0.66, 0.74], reset: true, easing: 'springReturn' },
      ],
      audio: [
        { event: 'charge_pull', at: 0.0, component: 'bolt_carrier', caption: 'Charging handle drawn rearward; carrier travels 120 mm' },
        { event: 'casing_eject', at: 0.38, component: 'receiver', caption: 'Case thrown to the right' },
        { event: 'bolt_release', at: 0.54, component: 'bolt_carrier', caption: 'Carrier released' },
        { event: 'bolt_battery', at: 0.74, component: 'bolt', caption: 'Six lugs turn into the trunnion' },
      ],
    },
    dryFire: {
      id: 'dryFire',
      label: 'Dry fire',
      duration: 0.7,
      steps: [
        { component: 'trigger', t: [0.0, 0.14], rotate: [0, 0, -0.14], easing: 'inQuad' },
        { component: 'hammer', t: [0.13, 0.19], rotate: [0, 0, -0.95], easing: 'mechanicalSnap' },
        { component: 'trigger', t: [0.42, 0.6], reset: true, easing: 'outQuad' },
      ],
      audio: [
        { event: 'trigger_break', at: 0.13, component: 'trigger', caption: 'Trigger breaks' },
        { event: 'hammer_fall', at: 0.19, component: 'hammer', caption: 'Hammer strikes the firing pin' },
        { event: 'trigger_reset', at: 0.58, component: 'trigger', caption: 'Trigger resets' },
      ],
    },
    reload: {
      id: 'reload',
      label: 'Magazine change',
      duration: 1.6,
      steps: [
        { component: 'mag_catch', t: [0.0, 0.08], rotate: [0, 0, 0.3], easing: 'outQuad' },
        { component: 'magazine', t: [0.06, 0.26], rotate: [0, 0, 0.35], easing: 'outQuad' },
        { component: 'magazine', t: [0.26, 0.5], translate: [30, -140, 0], rotate: [0, 0, 0.35], easing: 'outQuad' },
        { component: 'mag_catch', t: [0.3, 0.4], reset: true, easing: 'outQuad' },
        { component: 'magazine', t: [0.9, 1.18], rotate: [0, 0, 0.35], easing: 'inOutCubic' },
        { component: 'magazine', t: [1.18, 1.32], reset: true, easing: 'mechanicalSnap' },
      ],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pushed forward' },
        { event: 'mag_out', at: 0.2, component: 'magazine', caption: 'Magazine rocks forward and out' },
        { event: 'mag_seat', at: 1.32, component: 'magazine', caption: 'Magazine rocks back and locks' },
      ],
    },
    safety: {
      id: 'safety',
      label: 'Safety',
      duration: 0.4,
      steps: [{ component: 'safety_lever', t: [0.0, 0.24], rotate: [0, 0, -0.5], easing: 'detent' }],
      audio: [{ event: 'selector', at: 0.22, component: 'safety_lever', caption: 'Safety lever clicks down to FIRE' }],
    },
    extra: [
      {
        id: 'stockFold',
        label: 'Fold stock',
        duration: 1.4,
        steps: [
          { component: 'stock', t: [0.0, 0.55], rotate: [0, -Math.PI / 2, 0], easing: 'inOutCubic' },
          { component: 'stock', t: [0.85, 1.35], reset: true, easing: 'inOutCubic' },
        ],
        audio: [
          { event: 'ui_detent', at: 0.0, component: 'stock', caption: 'Stock latch released; stock folds to the left' },
          { event: 'component_seat', at: 1.35, component: 'stock', caption: 'Stock locks extended' },
        ],
      },
    ],
  },
  acoustic: {
    mass: 2500,
    receiver: 'steel-stamped',
    action: 'long-stroke-piston',
    reciprocatingMass: 400,
    spring: { frequency: 24, damping: 0.3 },
    furniture: 'metal',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'In battery',
      description: 'Fully assembled, six-lug bolt locked into the trunnion, magazine seated, safety at SAFE, stock extended.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Magazine withdrawn',
      description: 'The stubby 20-round magazine rocks forward off its catch and drops clear.',
      camera: 'side',
      focus: ['magazine', 'mag_catch', 'receiver'],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pushed forward' },
        { event: 'mag_out', at: 0.15, component: 'magazine', caption: 'Magazine rocks out' },
      ],
    },
    {
      stage: 2,
      title: 'Cover and recoil spring off',
      description: 'The recoil spring guide doubles as the cover latch; the cover lifts away and the spring assembly follows out of the rear cap.',
      camera: 'side',
      focus: ['dust_cover', 'recoil_spring_assembly', 'receiver'],
      audio: [
        { event: 'pin_push', at: 0.0, component: 'recoil_spring_assembly', caption: 'Guide base pressed in' },
        { event: 'component_out', at: 0.15, component: 'dust_cover', caption: 'Receiver cover lifted' },
        { event: 'component_out', at: 0.45, component: 'recoil_spring_assembly', caption: 'Recoil spring assembly withdrawn' },
      ],
    },
    {
      stage: 3,
      title: 'Carrier and bolt out',
      description: 'The carrier and its short piston slide back along the rails and lift out; the six-lug bolt then turns and slips forward out of the cam track.',
      camera: 'iso',
      focus: ['bolt_carrier', 'bolt', 'receiver', 'front_trunnion'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'bolt_carrier', caption: 'Carrier drawn rearward and lifted out' },
        { event: 'component_out', at: 0.4, component: 'bolt', caption: 'Bolt separated from the carrier' },
      ],
    },
    {
      stage: 4,
      title: 'Suppressor off',
      description: 'With the collar lever turned, the whole suppressor with both sights slides forward off the ported barrel, exposing the gas block and the bare 200 mm tube.',
      camera: 'detail-muzzle',
      focus: ['suppressor_latch', 'suppressor_tube', 'barrel', 'gas_block'],
      audio: [
        { event: 'ui_detent', at: 0.0, component: 'suppressor_latch', caption: 'Collar lever turned' },
        { event: 'component_out', at: 0.25, component: 'suppressor_tube', caption: 'Suppressor drawn forward' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis, including the baffle stack and expansion sleeve that live inside the suppressor.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 875 mm', from: [BUTT, -190, 0], to: [SUPP_TIP, -190, 0] },
      { label: 'Barrel 200 mm', from: [0, 70, 0], to: [MUZZLE, 70, 0] },
    ],
  },
  cartridge: { caseDiameter: 11.35, caseLength: 38.7, bulletDiameter: 9.25, bulletLength: 34, rimDiameter: 11.35, label: '9×39 mm' },
  ejection: { position: [-30, 14, 15], direction: [0.3, 0.5, 1] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default asval;
