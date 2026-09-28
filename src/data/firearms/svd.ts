import type { ComponentDef, FirearmDefinition, Vec2, Vec3 } from '@/firearm/schema';

/**
 * SVD Dragunov, 7.62×54 mmR designated marksman rifle with the PSO-1 optical
 * sight and the laminate skeleton (thumbhole) stock.
 *
 * Frame: bore axis y=0, bolt face (in battery) at x=0, +x toward the muzzle,
 * +z shooter's right. All dimensions mm.
 *
 * Published dimensions: overall 1,225 mm, barrel 620 mm, mass 4.3 kg with
 * PSO-1 and empty magazine, muzzle velocity 830 m/s (Soviet Army manual for
 * the SVD; Izhmash product data). Internal layout is estimated from the SVD
 * pattern and marked as such; it is a visualisation, not a machining reference.
 */

// ---- layout constants (mm) --------------------------------------------------
const MUZZLE = 620;
const FLASH_BASE = 605;
const FLASH_TIP = 670;
const BUTT = -555; // rear face of the buttplate (1,225 mm overall)
const RCV_REAR = -250;
const RCV_FRONT = 45;
const RCV_BOTTOM = -40;
const RCV_TOP = 15;
const COVER_TOP = 36;
const GAS_AXIS = 27;
const GAS_BLOCK_X = 340;
const SCOPE_AXIS = 62; // PSO-1 optical axis above the bore
const BOLT_TRAVEL = 120;

// Milled receiver, side profile
const receiverProfile: Vec2[] = [
  [RCV_FRONT, RCV_BOTTOM],
  [RCV_FRONT, RCV_TOP],
  [RCV_REAR + 8, RCV_TOP],
  [RCV_REAR, 8],
  [RCV_REAR, RCV_BOTTOM],
];

// Receiver cover cross-section in (u = -z, v = y)
const coverSection: Vec2[] = (() => {
  const pts: Vec2[] = [
    [-16.5, RCV_TOP],
    [16.5, RCV_TOP],
    [16.5, 26],
  ];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI;
    pts.push([Math.cos(a) * 16.5, 26 + Math.sin(a) * (COVER_TOP - 26)]);
  }
  pts.push([-16.5, 26]);
  return pts;
})();

// Skeleton thumbhole stock: outer silhouette and the thumbhole cut-out
const stockProfile: Vec2[] = [
  [RCV_REAR - 1, 13],
  [-330, 11],
  [-420, 1],
  [-500, -8],
  [-540, -14],
  [-548, -22],
  [-550, -126],
  [-542, -134],
  [-335, -120],
  [-318, -126],
  [-296, -124],
  [-278, -82],
  [-262, -44],
  [RCV_REAR - 1, -40],
];
const thumbhole: Vec2[] = [
  [-300, -12],
  [-410, -22],
  [-425, -40],
  [-415, -62],
  [-360, -68],
  [-305, -50],
  [-296, -30],
];

// Ventilated handguards: side profiles with through-slots
const upperHandguardProfile: Vec2[] = [
  [96, 15],
  [335, 15],
  [335, 40],
  [300, 44],
  [120, 44],
  [96, 40],
];
const upperSlots: Vec2[][] = [130, 180, 230, 280].map((x): Vec2[] => [
  [x, 24],
  [x + 36, 24],
  [x + 36, 35],
  [x, 35],
]);
const lowerHandguardProfile: Vec2[] = [
  [96, -7],
  [335, -7],
  [335, -30],
  [300, -34],
  [120, -36],
  [96, -32],
];
const lowerSlots: Vec2[][] = [130, 180, 230, 280].map((x): Vec2[] => [
  [x, -15],
  [x + 36, -15],
  [x + 36, -26],
  [x, -26],
]);

const triggerProfile: Vec2[] = [
  [-5, 4],
  [6, 4],
  [6, -4],
  [3, -14],
  [-2, -24],
  [-8, -34],
  [-16, -40],
  [-18, -36],
  [-12, -24],
  [-6, -12],
];

const hammerProfile: Vec2[] = [
  [-8, -8],
  [8, -8],
  [9, 4],
  [6, 16],
  [4, 26],
  [9, 32],
  [3, 37],
  [-6, 35],
  [-8, 22],
  [-8, 6],
];

const safetyProfile: Vec2[] = [
  [-8, -6],
  [8, -8],
  [40, -2],
  [78, 8],
  [88, 12],
  [89, 18],
  [81, 18],
  [42, 6],
  [8, 0],
  [-8, 2],
];

// 10-round steel magazine for the rimmed 7.62×54 mmR case
const magProfile: Vec2[] = [
  [-18, -8],
  [-18, -30],
  [-10, -70],
  [-4, -92],
  [-8, -98],
  [-80, -98],
  [-90, -90],
  [-100, -40],
  [-100, -8],
];

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver
  {
    id: 'receiver',
    name: 'Milled receiver',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Machined from a steel forging, phosphate finish',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: receiverProfile, depth: 33, bevel: 1.5 } },
        // left-side dovetail rail for the optical sight
        { geometry: { kind: 'box', size: [125, 12, 5], radius: 1 }, position: [-142, -6, -19] },
        // carrier rails
        { geometry: { kind: 'box', size: [280, 3, 4] }, position: [-100, RCV_TOP - 1.5, 13.5] },
        { geometry: { kind: 'box', size: [280, 3, 4] }, position: [-100, RCV_TOP - 1.5, -13.5] },
      ],
    },
    position: [0, 0, 0],
    function: 'One-piece machined receiver into which the barrel is pressed; carries the carrier rails, the fire-control group, the magazine well and the left-side dovetail for the PSO-1.',
    notes: ['Milled, unlike the stamped AKM receiver'],
    confidence: 'estimated',
    adjacent: ['dust_cover', 'barrel', 'bolt_carrier', 'magazine', 'stock', 'scope_mount'],
    mass: 780,
    thermal: 0.25,
  },
  {
    id: 'dust_cover',
    name: 'Receiver cover',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Stamped sheet steel',
    geometry: { kind: 'extrude', shape: coverSection, depth: 270, axis: 'x' },
    position: [-115, 0, 0],
    function: 'Sheet-steel lid over the carrier; latched at the rear by the recoil spring guide and trapped under the rear sight block at the front.',
    confidence: 'estimated',
    adjacent: ['receiver', 'recoil_spring_assembly', 'rear_sight_block', 'bolt_carrier'],
    strip: { stage: 2, offset: [0, 110, 0], order: 1, motion: 'up' },
    mass: 130,
    thermal: 0.25,
  },

  // ------------------------------------------------------------ barrel / gas
  {
    id: 'barrel',
    name: 'Barrel, 620 mm',
    group: 'barrel',
    material: 'parkerised-steel',
    materialLabel: 'Chrome-lined steel, cold hammer forged',
    geometry: {
      kind: 'lathe',
      profile: [
        [0, 0], [13, 0], [13, 45], [10.5, 48], [10.5, 92], [9.5, 95], [9.5, 338], [9, 340], [9, 380], [8.5, 382], [8.5, 570], [8, 572], [8, 604], [7.5, 606], [7.5, MUZZLE], [4, MUZZLE],
      ],
      segments: 48,
    },
    position: [0, 0, 0],
    function: 'Chrome-lined 7.62 mm barrel pressed into the receiver; the gas port is drilled at 340 mm and the muzzle is threaded for the flash suppressor.',
    notes: ['Length 620 mm measured from the bolt face', 'Four-groove rifling, 1 in 240 mm on post-1975 rifles'],
    confidence: 'published',
    adjacent: ['receiver', 'rear_sight_block', 'gas_block', 'front_sight_base', 'flash_suppressor'],
    strip: { stage: 5, offset: [150, 0, 0], order: 0, motion: 'forward' },
    mass: 980,
    thermal: 0.75,
  },
  {
    id: 'flash_suppressor',
    name: 'Slotted flash suppressor',
    group: 'muzzle',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[7.6, 0], [11, 0], [11, 14], [12, 16], [12, 62], [11, 65], [5, 65]], segments: 32 }, position: [0, 0, 0] },
        ...Array.from({ length: 5 }, (_, i): { geometry: ComponentDef['geometry']; position: Vec3; rotation: Vec3 } => {
          const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
          return { geometry: { kind: 'box', size: [38, 2.4, 1.6] }, position: [40, Math.cos(a) * 12.2, Math.sin(a) * 12.2], rotation: [-a, 0, 0] };
        }),
      ],
    },
    position: [FLASH_BASE, 0, 0],
    function: 'Long five-slot suppressor threaded onto the muzzle; it breaks up the flash and doubles as the bayonet mount.',
    confidence: 'estimated',
    adjacent: ['barrel', 'front_sight_base'],
    strip: { stage: 5, offset: [250, 0, 0], order: 0, motion: 'forward' },
    mass: 70,
    thermal: 0.85,
  },
  {
    id: 'rear_sight_block',
    name: 'Rear sight block',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [47, 54, 30], radius: 2 }, position: [69, 11, 0] },
        { geometry: { kind: 'cylinder', radius: 9.8, length: 18 }, position: [95, GAS_AXIS, 0] },
        { geometry: { kind: 'box', size: [30, 4, 20] }, position: [62, 40, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Pinned to the barrel ahead of the receiver; carries the tangent leaf, sockets the gas tube and houses the push-rod return spring.',
    confidence: 'estimated',
    adjacent: ['barrel', 'rear_sight_leaf', 'gas_tube', 'push_rod', 'dust_cover'],
    strip: { stage: 5, offset: [0, 120, 0], order: 3, motion: 'up' },
    mass: 110,
    thermal: 0.5,
  },
  {
    id: 'rear_sight_leaf',
    name: 'Tangent rear sight leaf',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [66, 3, 12], radius: 0.5 }, position: [-33, 1.5, 0] },
        { geometry: { kind: 'box', size: [11, 6, 15], radius: 1 }, position: [-24, 4, 0] },
        { geometry: { kind: 'box', size: [4, 9, 14] }, position: [-64, 5, 0] },
      ],
    },
    position: [88, 39, 0],
    pivot: [0, 0, 0],
    parent: 'rear_sight_block',
    function: 'Iron back-up sight graduated 100 to 1,200 m; used when the optic is removed.',
    confidence: 'published',
    adjacent: ['rear_sight_block', 'front_sight_base'],
    strip: { stage: 5, offset: [0, 40, 0], rotate: [0, 0, 0.5], order: 4, motion: 'up' },
    mass: 20,
  },
  {
    id: 'gas_block',
    name: 'Gas block with regulator',
    group: 'gas-system',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[9, 0], [15, 0], [15, 40], [9, 40]], segments: 32 }, position: [0, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 10.5, length: 40 }, position: [20, GAS_AXIS, 0] },
        { geometry: { kind: 'box', size: [40, 14, 18] }, position: [20, 14, 0] },
        // two-position regulator collar at the front of the cylinder
        { geometry: { kind: 'lathe', profile: [[10.6, 0], [13, 0], [13, 8], [10.6, 8]], segments: 24 }, position: [30, GAS_AXIS, 0] },
        { geometry: { kind: 'box', size: [6, 4, 22], radius: 1 }, position: [34, GAS_AXIS, 0] },
      ],
    },
    position: [GAS_BLOCK_X, 0, 0],
    function: 'Pinned over the gas port; the two-position regulator meters gas to the short-stroke piston that lives in the cylinder above the bore.',
    notes: ['Regulator setting 2 is used when fouled or in cold weather'],
    confidence: 'estimated',
    adjacent: ['barrel', 'gas_piston', 'gas_tube', 'handguard_band'],
    strip: { stage: 5, offset: [0, 130, 0], order: 3, motion: 'up' },
    mass: 120,
    thermal: 0.9,
  },
  {
    id: 'gas_piston',
    name: 'Gas piston, short stroke',
    group: 'gas-system',
    material: 'chrome',
    materialLabel: 'Chrome-plated steel',
    geometry: { kind: 'lathe', profile: [[0, 0], [7.5, 0], [7.5, 30], [6, 32], [6, 38], [0, 38]], segments: 24 },
    position: [GAS_BLOCK_X + 2, GAS_AXIS, 0],
    function: 'Short piston in the gas cylinder; gas kicks it rearward a few millimetres and it hands the impulse to the push rod.',
    confidence: 'estimated',
    adjacent: ['gas_block', 'push_rod'],
    strip: { stage: 5, offset: [-60, 0, 0], order: 0, motion: 'rear' },
    mass: 30,
    thermal: 0.85,
    internal: true,
  },
  {
    id: 'gas_tube',
    name: 'Gas tube',
    group: 'gas-system',
    material: 'parkerised-steel',
    geometry: { kind: 'lathe', profile: [[0, 0], [9.6, 0], [9.6, 14], [8.6, 16], [8.6, 236], [9.6, 238], [9.6, 246], [0, 246]], segments: 32 },
    position: [96, GAS_AXIS, 0],
    function: 'Guides the push rod between the gas block and the rear sight block; lifts off once the handguards are removed.',
    confidence: 'estimated',
    adjacent: ['gas_block', 'rear_sight_block', 'push_rod', 'handguard_upper'],
    strip: { stage: 4, offset: [10, 60, 0], order: 2, motion: 'up' },
    mass: 80,
    thermal: 0.7,
  },
  {
    id: 'push_rod',
    name: 'Push rod with return spring',
    group: 'gas-system',
    material: 'chrome',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, 0], [4.5, 0], [4.5, 226], [6, 228], [6, 234], [0, 234]], segments: 20 }, position: [8, 0, 0] },
        { geometry: { kind: 'spring', radius: 6.5, length: 40, turns: 9, wire: 1.2 }, position: [28, 0, 0] },
      ],
    },
    position: [0, 0, 0],
    parent: 'gas_tube',
    function: 'Separate rod that carries the piston impulse back to the carrier and is returned forward by its own spring; the carrier then travels on momentum.',
    notes: ['The three-part short-stroke train (piston, rod, carrier) keeps reciprocating mass off the barrel'],
    confidence: 'estimated',
    adjacent: ['gas_piston', 'gas_tube', 'bolt_carrier', 'rear_sight_block'],
    strip: { stage: 5, offset: [-80, -40, 0], order: 1, motion: 'rear' },
    mass: 45,
    thermal: 0.6,
    internal: true,
  },
  {
    id: 'front_sight_base',
    name: 'Front sight base',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[7.5, 0], [12.5, 0], [12.5, 26], [7.5, 26]], segments: 32 }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [14, 30, 10], radius: 1.5 }, position: [13, 24, 0] },
        { geometry: { kind: 'box', size: [14, 20, 3] }, position: [13, 47, 7] },
        { geometry: { kind: 'box', size: [14, 20, 3] }, position: [13, 47, -7] },
        { geometry: { kind: 'cylinder', radius: 1.3, length: 16, axis: 'y' }, position: [13, 46, 0] },
        { geometry: { kind: 'box', size: [18, 12, 10], radius: 1 }, position: [11, -17, 0] },
      ],
    },
    position: [576, 0, 0],
    function: 'Hooded post pinned to the barrel behind the flash suppressor; sight radius about 587 mm.',
    confidence: 'estimated',
    adjacent: ['barrel', 'flash_suppressor', 'rear_sight_leaf'],
    strip: { stage: 5, offset: [20, 110, 0], order: 3, motion: 'up' },
    mass: 90,
    thermal: 0.55,
  },

  // ------------------------------------------------------------ furniture (front)
  {
    id: 'handguard_upper',
    name: 'Upper handguard, ventilated',
    group: 'furniture',
    material: 'wood-laminate',
    materialLabel: 'Birch laminate with four vent slots per side',
    geometry: { kind: 'extrude', shape: upperHandguardProfile, depth: 32, bevel: 2, holes: upperSlots, curveSegments: 4 },
    position: [0, 0, 0],
    function: 'Upper half of the fore-end; the slots let the gas tube shed heat and are the quickest way to tell an SVD from a Kalashnikov at a distance.',
    confidence: 'estimated',
    adjacent: ['gas_tube', 'handguard_lower', 'handguard_band', 'rear_sight_block'],
    strip: { stage: 4, offset: [0, 120, 0], order: 1, motion: 'up' },
    mass: 95,
    thermal: 0.3,
  },
  {
    id: 'handguard_lower',
    name: 'Lower handguard, ventilated',
    group: 'furniture',
    material: 'wood-laminate',
    materialLabel: 'Birch laminate with four vent slots per side',
    geometry: { kind: 'extrude', shape: lowerHandguardProfile, depth: 32, bevel: 2, holes: lowerSlots, curveSegments: 4 },
    position: [0, 0, 0],
    function: 'Lower half of the fore-end; the two halves are held against the receiver by the sprung band at the front.',
    confidence: 'estimated',
    adjacent: ['barrel', 'handguard_upper', 'handguard_band'],
    strip: { stage: 4, offset: [0, -110, 0], order: 1, motion: 'down' },
    mass: 90,
    thermal: 0.3,
  },
  {
    id: 'handguard_band',
    name: 'Handguard band',
    group: 'furniture',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[9.1, 0], [13, 0], [13, 12], [9.1, 12]], segments: 32 }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [12, 44, 36] }, position: [6, 0, 0] },
        { geometry: { kind: 'torus', radius: 7, tube: 1.6, axis: 'x' }, position: [6, -30, 0] },
      ],
    },
    position: [325, 0, 0],
    function: 'Sprung band that clamps both handguard halves; it also carries the front sling swivel.',
    confidence: 'estimated',
    adjacent: ['barrel', 'handguard_upper', 'handguard_lower', 'gas_block'],
    strip: { stage: 4, offset: [60, 0, 0], order: 0, motion: 'forward' },
    mass: 40,
    thermal: 0.45,
  },

  // ------------------------------------------------------------ optic
  {
    id: 'scope_mount',
    name: 'PSO-1 side mount',
    group: 'accessory',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        // dovetail clamp on the left rail
        { geometry: { kind: 'box', size: [110, 24, 10], radius: 1.5 }, position: [0, 0, 0] },
        // vertical arm
        { geometry: { kind: 'box', size: [44, 44, 8], radius: 1.5 }, position: [0, 30, 0] },
        // cradle under the scope body
        { geometry: { kind: 'box', size: [64, 8, 30], radius: 2 }, position: [0, 52, 13] },
        // clamp lever
        { geometry: { kind: 'box', size: [30, 8, 4], radius: 1 }, position: [-30, -6, -6] },
      ],
    },
    position: [-142, -4, -22],
    function: 'Quick-release clamp that slides onto the receiver’s left dovetail and holds the sight over the cover, offset to the left so the iron sights stay usable.',
    confidence: 'estimated',
    adjacent: ['receiver', 'pso1_scope', 'dust_cover'],
    strip: { stage: 2, offset: [-40, 40, -120], order: 0, motion: 'left' },
    mass: 180,
  },
  {
    id: 'pso1_scope',
    name: 'PSO-1 optical sight, 4×24',
    group: 'accessory',
    material: 'parkerised-steel',
    materialLabel: 'Aluminium alloy body, black finish',
    geometry: {
      kind: 'composite',
      parts: [
        {
          geometry: {
            kind: 'lathe',
            profile: [[0, 0], [13, 0], [13, 80], [15, 84], [15, 150], [13, 154], [13, 240], [14.5, 244], [14.5, 300], [16, 304], [16, 340], [12.5, 340], [12.5, 342], [0, 342]],
            segments: 40,
          },
          position: [0, 0, 0],
        },
        // elevation turret
        { geometry: { kind: 'cylinder', radius: 9, length: 16, axis: 'y' }, position: [190, 20, 0] },
        // windage turret on the left
        { geometry: { kind: 'cylinder', radius: 9, length: 16, axis: 'z' }, position: [190, 0, -20] },
        // reticle illumination battery housing
        { geometry: { kind: 'box', size: [40, 22, 14], radius: 3 }, position: [120, -8, -18] },
      ],
    },
    position: [-70, SCOPE_AXIS + 4, 35],
    parent: 'scope_mount',
    function: 'Fixed 4× sight with a stadiametric rangefinder and bullet-drop cam graduated to 1,300 m; the reticle can be lit for low light.',
    notes: ['Field of view 6 degrees; mass about 580 g with mount'],
    confidence: 'published',
    adjacent: ['scope_mount', 'scope_eyecup'],
    strip: { stage: 5, offset: [0, 60, 0], order: 1, motion: 'up' },
    mass: 400,
  },
  {
    id: 'scope_eyecup',
    name: 'Rubber eyecup',
    group: 'accessory',
    material: 'rubber-black',
    geometry: { kind: 'lathe', profile: [[12, 0], [19, 0], [19, 28], [16, 34], [13, 36], [12, 30]], segments: 32 },
    position: [-36, 0, 0],
    parent: 'pso1_scope',
    function: 'Folding rubber cup that sets eye relief and shields the eyepiece from glare.',
    confidence: 'estimated',
    adjacent: ['pso1_scope'],
    strip: { stage: 5, offset: [-50, 0, 0], order: 2, motion: 'rear' },
    mass: 30,
  },

  // ------------------------------------------------------------ action
  {
    id: 'bolt_carrier',
    name: 'Bolt carrier',
    group: 'action',
    material: 'steel-worn',
    materialLabel: 'Machined steel, phosphate finish',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [120, 24, 28], radius: 2 }, position: [-75, 18, 0] },
        { geometry: { kind: 'box', size: [40, 10, 24], radius: 1 }, position: [-35, 3, 0] },
        // charging handle on the right
        { geometry: { kind: 'box', size: [26, 16, 22], radius: 4 }, position: [-110, 18, 27] },
        // striking face for the push rod
        { geometry: { kind: 'cylinder', radius: 6, length: 14 }, position: [-8, GAS_AXIS, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Struck by the push rod and then free to travel about 120 mm on its own momentum; the cam track turns the three-lug bolt and the charging handle is part of the carrier.',
    notes: ['No piston attached: the short-stroke train stays forward'],
    confidence: 'estimated',
    adjacent: ['receiver', 'bolt', 'push_rod', 'recoil_spring_assembly', 'hammer'],
    strip: { stage: 3, offset: [-250, 80, 0], order: 0, motion: 'rear' },
    mass: 300,
    thermal: 0.55,
  },
  {
    id: 'bolt',
    name: 'Rotating bolt, three lugs',
    group: 'action',
    material: 'steel-worn',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, -86], [5, -86], [5, -64], [8.5, -62], [8.5, -24], [10, -22], [10, 0], [0, 0]], segments: 28 } },
        ...Array.from({ length: 3 }, (_, i): { geometry: ComponentDef['geometry']; position: Vec3; rotation: Vec3 } => {
          const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
          return { geometry: { kind: 'box', size: [14, 4, 6] }, position: [-7, Math.cos(a) * 11.5, Math.sin(a) * 11.5], rotation: [-a, 0, 0] };
        }),
        { geometry: { kind: 'box', size: [8, 6, 5], radius: 1 }, position: [-32, 10, 0] },
      ],
    },
    position: [0, 0, 0],
    parent: 'bolt_carrier',
    function: 'Three symmetrical lugs lock into the receiver; the carrier cam track turns it about 30 degrees after the first few millimetres of travel.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'receiver', 'firing_pin', 'extractor', 'barrel'],
    strip: { stage: 3, offset: [70, -50, 0], rotate: [0.5, 0, 0], order: 1, motion: 'forward' },
    mass: 90,
    thermal: 0.6,
    internal: true,
  },
  {
    id: 'firing_pin',
    name: 'Firing pin',
    group: 'action',
    material: 'chrome',
    geometry: { kind: 'lathe', profile: [[0, -82], [3.2, -82], [3.2, -32], [1.4, -30], [1.4, 1], [0, 1]], segments: 16 },
    position: [0, 0, 0],
    parent: 'bolt',
    function: 'Free-floating inside the bolt; struck by the hammer through the rear of the carrier.',
    confidence: 'estimated',
    adjacent: ['bolt', 'hammer'],
    strip: { stage: 5, offset: [-90, 0, 0], order: 1, motion: 'rear' },
    mass: 9,
    internal: true,
  },
  {
    id: 'extractor',
    name: 'Extractor',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [16, 5, 4], radius: 1 },
    position: [-8, 5, 9],
    parent: 'bolt',
    function: 'Spring-loaded claw that grips the wide rim of the 7.62×54 mmR case.',
    confidence: 'estimated',
    adjacent: ['bolt', 'firing_pin'],
    strip: { stage: 5, offset: [0, 0, 30], order: 2, motion: 'right' },
    mass: 6,
    internal: true,
  },
  {
    id: 'recoil_spring_assembly',
    name: 'Recoil spring assembly',
    group: 'action',
    material: 'stainless-steel',
    materialLabel: 'Two nested springs on a guide rod with a cover latch base',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'spring', radius: 7, length: 120, turns: 20, wire: 1.6 }, position: [-175, 0, 0] },
        { geometry: { kind: 'spring', radius: 4.5, length: 120, turns: 26, wire: 1.1 }, position: [-175, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 2.4, length: 135, axis: 'x' }, position: [-175, 0, 0] },
        { geometry: { kind: 'box', size: [8, 22, 22], radius: 1 }, position: [-243, -4, 0] },
        { geometry: { kind: 'cylinder', radius: 5.5, length: 10 }, position: [-110, 0, 0] },
      ],
    },
    position: [0, 18, 0],
    function: 'Two nested springs return the carrier to battery; the rear base doubles as the latch that holds the receiver cover shut.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'receiver', 'dust_cover'],
    strip: { stage: 2, offset: [-200, 55, 0], order: 2, motion: 'rear' },
    mass: 60,
    internal: true,
  },

  // ------------------------------------------------------------ fire control
  {
    id: 'hammer',
    name: 'Hammer',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: hammerProfile, depth: 12, bevel: 0.8 },
    position: [-185, -20, 0],
    pivot: [0, 0, 0],
    rotation: [0, 0, 0.95],
    function: 'Held cocked by the trigger sear; when released it swings forward to strike the firing pin. The carrier re-cocks it on every cycle.',
    confidence: 'estimated',
    adjacent: ['trigger', 'firing_pin', 'bolt_carrier', 'safety_lever'],
    strip: { stage: 5, offset: [0, -50, 55], order: 1, motion: 'right' },
    mass: 60,
    internal: true,
  },
  {
    id: 'trigger',
    name: 'Trigger',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: triggerProfile, depth: 9, bevel: 0.6 },
    position: [-205, -22, 0],
    pivot: [0, 0, 0],
    function: 'Semi-automatic only; the sear releases the hammer after a short first stage and a crisp break.',
    notes: ['Issue pull weight about 1.5 to 2.5 kgf'],
    confidence: 'estimated',
    adjacent: ['hammer', 'safety_lever', 'receiver', 'trigger_guard'],
    strip: { stage: 5, offset: [0, -50, -55], order: 1, motion: 'left' },
    mass: 25,
  },
  {
    id: 'safety_lever',
    name: 'Safety lever',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 37, axis: 'z' }, position: [0, 0, -17.5] },
        { geometry: { kind: 'extrude', shape: safetyProfile, depth: 2.5 }, position: [0, 0, 0.5] },
      ],
    },
    position: [-235, -8, 18],
    pivot: [0, 0, 0],
    function: 'Kalashnikov-pattern lever on the right of the receiver; at SAFE (up) it blocks the trigger and the carrier.',
    confidence: 'published',
    adjacent: ['receiver', 'trigger', 'hammer', 'bolt_carrier'],
    strip: { stage: 5, offset: [0, 0, 70], order: 2, motion: 'right' },
    mass: 30,
  },
  {
    id: 'trigger_guard',
    name: 'Trigger guard',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [6, 24, 12] }, position: [-186, -52, 0] },
        { geometry: { kind: 'box', size: [62, 4, 12], radius: 1.5 }, position: [-214, -64, 0] },
        { geometry: { kind: 'box', size: [6, 24, 12] }, position: [-242, -52, 0] },
      ],
    },
    position: [0, 0, 0],
    parent: 'receiver',
    function: 'Screwed to the receiver floor ahead of the stock grip.',
    confidence: 'estimated',
    adjacent: ['receiver', 'trigger', 'stock'],
    strip: { stage: 5, offset: [0, -60, 0], order: 3, motion: 'down' },
    mass: 25,
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
    position: [-106, -46, 0],
    pivot: [0, 0, 0],
    function: 'Paddle behind the magazine well; pushed forward it lifts the hook off the magazine so it can rock out.',
    confidence: 'estimated',
    adjacent: ['receiver', 'magazine'],
    strip: { stage: 5, offset: [0, -60, 40], order: 3, motion: 'down' },
    mass: 15,
  },

  // ------------------------------------------------------------ furniture (rear)
  {
    id: 'stock',
    name: 'Skeleton stock, laminate',
    group: 'furniture',
    material: 'wood-laminate',
    materialLabel: 'Birch laminate, shellac finish',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: stockProfile, depth: 40, bevel: 4, holes: [thumbhole], curveSegments: 6 } },
        { geometry: { kind: 'torus', radius: 7, tube: 1.6, axis: 'y' }, position: [-470, -70, -22] },
      ],
    },
    position: [0, 0, 0],
    function: 'One piece of laminate that is pistol grip, thumbhole and butt at once; the cut-out saves weight and gives a straight line of recoil to the shoulder.',
    confidence: 'estimated',
    adjacent: ['receiver', 'cheek_piece', 'buttplate', 'trigger_guard'],
    strip: { stage: 5, offset: [-140, -30, 0], order: 0, motion: 'rear' },
    mass: 520,
  },
  {
    id: 'cheek_piece',
    name: 'Cheek piece',
    group: 'furniture',
    material: 'wood-laminate',
    materialLabel: 'Laminate block with a leather-covered pad on issue rifles',
    geometry: { kind: 'box', size: [150, 20, 44], radius: 6 },
    position: [-450, 8, 0],
    parent: 'stock',
    function: 'Detachable riser clipped to the comb; it raises the eye to the PSO-1 and comes off for the iron sights.',
    confidence: 'estimated',
    adjacent: ['stock', 'pso1_scope'],
    strip: { stage: 5, offset: [0, 60, 0], order: 1, motion: 'up' },
    mass: 90,
  },
  {
    id: 'buttplate',
    name: 'Buttplate',
    group: 'furniture',
    material: 'rubber-black',
    geometry: { kind: 'box', size: [5, 112, 38], radius: 2 },
    position: [BUTT + 2.5, -76, 0],
    parent: 'stock',
    function: 'Rubber pad screwed to the butt face.',
    confidence: 'estimated',
    adjacent: ['stock'],
    strip: { stage: 5, offset: [-50, 0, 0], order: 1, motion: 'rear' },
    mass: 45,
  },

  // ------------------------------------------------------------ feed
  {
    id: 'magazine',
    name: 'Magazine, 10-round steel',
    group: 'feed',
    material: 'parkerised-steel',
    materialLabel: 'Stamped and welded sheet steel, ribbed',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: magProfile, depth: 27, bevel: 2, curveSegments: 6 } },
        { geometry: { kind: 'box', size: [6, 6, 20], radius: 1 }, position: [-15, -13, 0] },
        { geometry: { kind: 'box', size: [7, 8, 20], radius: 1 }, position: [-102, -30, 0] },
        { geometry: { kind: 'box', size: [4, 70, 1.4] }, position: [-50, -55, 14.5] },
        { geometry: { kind: 'box', size: [4, 70, 1.4] }, position: [-50, -55, -14.5] },
      ],
    },
    position: [0, 0, 0],
    pivot: [-15, -12, 0],
    function: 'Double-column box for the rimmed 7.62×54 mmR case; it hooks in at the front and rocks back onto the catch.',
    notes: ['About 92 mm tall; rims are staggered so they cannot lock over one another'],
    confidence: 'published',
    adjacent: ['receiver', 'mag_catch', 'bolt'],
    strip: { stage: 1, offset: [30, -150, 0], rotate: [0, 0, 0.3], motion: 'down' },
    mass: 230,
  },
  {
    id: 'follower',
    name: 'Follower',
    group: 'feed',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [70, 8, 22], radius: 1.5 },
    position: [-44, -36, 0], // relative to the magazine pivot
    parent: 'magazine',
    function: 'Stamped platform that lifts the staggered cartridge stack to the feed lips.',
    confidence: 'estimated',
    adjacent: ['magazine', 'magazine_spring'],
    strip: { stage: 5, offset: [0, 60, 0], order: 1, motion: 'up' },
    mass: 12,
    internal: true,
  },
  {
    id: 'magazine_spring',
    name: 'Magazine spring',
    group: 'feed',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 9, length: 48, turns: 6, wire: 1.3, axis: 'y' },
    position: [-40, -66, 0],
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
    name: `Cartridge, 7.62×54 mmR (${i + 1})`,
    group: 'ammunition',
    material: 'brass',
    materialLabel: 'Lacquered steel case, 7N1 sniper ball',
    geometry: { kind: 'cartridge', caseDiameter: 12.37, caseLength: 53.7, bulletDiameter: 7.92, bulletLength: 33, rimDiameter: 14.4, shoulder: 0.8 },
    position: [-82, -2 - i * 11, i % 2 === 0 ? 5 : -5],
    parent: 'magazine',
    function: 'Staggered in the magazine; the rimmed case dates from 1891 and is why the magazine is short and steeply curved.',
    confidence: 'published',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, 50 + i * 14, 0], order: 3, motion: 'up' },
    mass: 22,
    internal: true,
  })),
];

export const svd: FirearmDefinition = {
  id: 'svd',
  name: 'SVD Dragunov',
  shortName: 'SVD',
  spec: {
    manufacturer: 'Izhevsk Machine-Building Plant (Izhmash)',
    designation: 'SVD, 7.62 mm Dragunov sniper rifle (GRAU 6V1)',
    origin: 'Soviet Union',
    designed: { value: 1963, confidence: 'published', note: 'year of adoption' },
    category: 'dmr',
    categoryLabel: 'Designated marksman rifle',
    cartridge: '7.62×54 mmR',
    action: 'short-stroke-piston',
    actionLabel: 'Gas-operated, short-stroke piston, rotating bolt, semi-automatic',
    feed: 'box-magazine',
    capacity: { value: '10-round detachable box', confidence: 'published' },
    overallLength: { value: 1225, unit: 'mm', confidence: 'published' },
    barrelLength: { value: 620, unit: 'mm', confidence: 'published' },
    mass: { value: 4300, unit: 'g', confidence: 'published', note: 'with PSO-1 and empty magazine' },
    muzzleVelocity: { value: 830, unit: 'm/s', confidence: 'published', note: '7N1 sniper ball' },
    rateOfFire: { value: 'Semi-automatic; 30 rounds/min practical', confidence: 'published' },
    effectiveRange: { value: 800, unit: 'm', confidence: 'published', note: 'PSO-1 graduated to 1,300 m; iron sights to 1,200 m' },
    twist: { value: '1 in 240 mm (1:9.45 in), RH, 4 grooves', confidence: 'published', note: 'post-1975 barrels; earlier rifles 1 in 320 mm' },
    sights: 'PSO-1 4×24 optical sight on the left-side dovetail; hooded post front and tangent leaf rear as back-up',
    identification: 'A long, slim rifle with a Kalashnikov-style receiver and cover, ventilated wooden handguards, a skeleton thumbhole stock with a cheek riser, a long slotted flash suppressor and a short 10-round magazine, with the PSO-1 sight offset over the receiver.',
    mechanism: 'Gas tapped 340 mm up the barrel kicks a short piston, which strikes a separate push rod, which in turn taps the carrier; all three then return forward on their own springs while the carrier travels about 120 mm on momentum. The three-lug bolt turns to unlock and a pair of nested recoil springs return it. Only semi-automatic fire is possible.',
  },
  provenance: {
    configuration: 'SVD, laminate skeleton stock with cheek piece, ventilated laminate handguards, PSO-1 on the side mount, 10-round magazine, slotted flash suppressor, no bayonet',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'Soviet Army manual NSD, 7.62 mm Dragunov sniper rifle (SVD)', covers: ['overallLength', 'barrelLength', 'mass', 'muzzleVelocity', 'effectiveRange', 'sights', 'capacity', 'mechanism'] },
      { label: 'Izhmash / Kalashnikov Concern SVD product sheet', covers: ['overallLength', 'mass', 'twist'] },
      { label: 'PSO-1 sight manual', covers: ['sights', 'PSO-1 geometry'] },
      { label: 'Jane’s Infantry Weapons', covers: ['designed', 'rateOfFire'] },
      { label: 'CIP / 7.62×54 R cartridge drawing', covers: ['cartridge'] },
    ],
    notes: [
      'Exterior proportions follow published dimensions; internal component positions are estimated from the SVD pattern.',
      'The milled receiver is drawn solid; the magazine passes through the modelled floor.',
      'PSO-1 body proportions are approximate; the mount is simplified to a clamp, arm and cradle.',
      'Handguard vent slots are drawn as through-slots in the side profile.',
    ],
  },
  components,
  actions: {
    cycle: {
      id: 'cycle',
      label: 'Charge',
      duration: 1.1,
      interruptible: false,
      steps: [
        { component: 'bolt_carrier', t: [0.0, 0.42], translate: [-BOLT_TRAVEL, 0, 0], easing: 'inOutCubic' },
        { component: 'bolt', t: [0.02, 0.1], rotate: [0.5, 0, 0], easing: 'inOutCubic' },
        { component: 'hammer', t: [0.1, 0.32], rotate: [0, 0, 0], easing: 'outQuad' },
        { component: 'bolt_carrier', t: [0.56, 0.78], reset: true, easing: 'springReturn' },
        { component: 'bolt', t: [0.7, 0.78], reset: true, easing: 'springReturn' },
      ],
      audio: [
        { event: 'charge_pull', at: 0.0, component: 'bolt_carrier', caption: 'Charging handle drawn rearward; carrier travels 120 mm' },
        { event: 'casing_eject', at: 0.4, component: 'receiver', caption: 'Case thrown up and to the right' },
        { event: 'bolt_release', at: 0.56, component: 'bolt_carrier', caption: 'Carrier released; nested springs drive it forward' },
        { event: 'bolt_battery', at: 0.78, component: 'bolt', caption: 'Three lugs turn into the receiver' },
      ],
    },
    dryFire: {
      id: 'dryFire',
      label: 'Dry fire',
      duration: 0.7,
      steps: [
        { component: 'trigger', t: [0.0, 0.14], rotate: [0, 0, -0.12], easing: 'inQuad' },
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
        { component: 'magazine', t: [0.26, 0.5], translate: [30, -130, 0], rotate: [0, 0, 0.35], easing: 'outQuad' },
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
  },
  acoustic: {
    mass: 4300,
    receiver: 'steel-milled',
    action: 'short-stroke-piston',
    reciprocatingMass: 390,
    spring: { frequency: 20, damping: 0.3 },
    furniture: 'wood',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'In battery',
      description: 'Fully assembled, three-lug bolt locked into the receiver, magazine seated, safety at SAFE, PSO-1 mounted.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Magazine withdrawn',
      description: 'The short 10-round magazine rocks forward off its catch and drops clear.',
      camera: 'side',
      focus: ['magazine', 'mag_catch', 'receiver'],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pushed forward' },
        { event: 'mag_out', at: 0.15, component: 'magazine', caption: 'Magazine rocks out' },
      ],
    },
    {
      stage: 2,
      title: 'Sight, cover and recoil springs off',
      description: 'The PSO-1 slides off its dovetail to the left first; then the recoil spring guide releases the cover, which lifts away, and the nested springs follow out of the receiver.',
      camera: 'side',
      focus: ['scope_mount', 'dust_cover', 'recoil_spring_assembly', 'receiver'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'scope_mount', caption: 'PSO-1 and mount slide off the dovetail' },
        { event: 'pin_push', at: 0.3, component: 'recoil_spring_assembly', caption: 'Guide base pressed in' },
        { event: 'component_out', at: 0.42, component: 'dust_cover', caption: 'Receiver cover lifted' },
        { event: 'component_out', at: 0.7, component: 'recoil_spring_assembly', caption: 'Recoil springs withdrawn' },
      ],
    },
    {
      stage: 3,
      title: 'Carrier and bolt out',
      description: 'The carrier slides back along the rails and lifts out; the three-lug bolt then turns and slips forward out of the cam track. No piston comes with it: the short-stroke train stays in the fore-end.',
      camera: 'iso',
      focus: ['bolt_carrier', 'bolt', 'receiver'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'bolt_carrier', caption: 'Carrier drawn rearward and lifted out' },
        { event: 'component_out', at: 0.4, component: 'bolt', caption: 'Bolt separated from the carrier' },
      ],
    },
    {
      stage: 4,
      title: 'Handguards and gas tube off',
      description: 'The sprung band slides forward, both ventilated handguard halves come away, and the gas tube lifts off with the push rod inside it, exposing the piston in the gas block.',
      camera: 'detail-action',
      focus: ['handguard_band', 'handguard_upper', 'handguard_lower', 'gas_tube', 'gas_block'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'handguard_band', caption: 'Band slid forward' },
        { event: 'component_out', at: 0.25, component: 'handguard_upper', caption: 'Handguard halves separated' },
        { event: 'component_out', at: 0.55, component: 'gas_tube', caption: 'Gas tube and push rod lifted off' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis, including the three-part short-stroke gas train and the PSO-1 with its eyecup.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 1,225 mm', from: [BUTT, -175, 0], to: [FLASH_TIP, -175, 0] },
      { label: 'Barrel 620 mm', from: [0, 110, 0], to: [MUZZLE, 110, 0] },
    ],
  },
  cartridge: { caseDiameter: 12.37, caseLength: 53.7, bulletDiameter: 7.92, bulletLength: 33, rimDiameter: 14.4, label: '7.62×54 mmR' },
  ejection: { position: [-30, 18, 17], direction: [0.3, 0.6, 1] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default svd;
