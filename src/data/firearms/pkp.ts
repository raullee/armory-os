import type { ComponentDef, FirearmDefinition, Vec2, Vec3 } from '@/firearm/schema';

/**
 * PKP Pecheneg, 7.62×54 mmR general-purpose machine gun with bipod and the
 * 100-round belt box.
 *
 * Frame: bore axis y=0, bolt face (in battery) at x=0, +x toward the muzzle,
 * +z shooter's right. All dimensions mm. The belt feeds from the right; cases
 * eject to the left.
 *
 * Published dimensions: overall 1,200 mm, barrel 658 mm, mass 8.2 kg with
 * bipod and without belt box, muzzle velocity 825 m/s, cyclic 650 rounds/min
 * (Degtyarev Plant / Rosoboronexport product data; Russian Army manual for the
 * 7.62 mm PKP). Internal layout is estimated from the PK pattern and marked as
 * such; it is a visualisation, not a machining reference.
 */

// ---- layout constants (mm) --------------------------------------------------
const MUZZLE = 658;
const FLASH_BASE = 645;
const FLASH_TIP = 700;
const BUTT = -500; // rear face of the buttplate (1,200 mm overall)
const RCV_REAR = -285;
const RCV_FRONT = 60;
const RCV_BOTTOM = -45;
const RCV_TOP = 14;
const COVER_PIVOT_X = -120;
const GAS_AXIS = -27; // piston axis below the bore
const GAS_BLOCK_X = 380;
const BELT_Y = 25;
const BOLT_TRAVEL = 145;

const receiverWall: Vec2[] = [
  [RCV_FRONT, RCV_BOTTOM],
  [RCV_FRONT, RCV_TOP],
  [RCV_REAR + 6, RCV_TOP],
  [RCV_REAR, 6],
  [RCV_REAR, RCV_BOTTOM],
];

// Skeleton stock with a thumbhole cut-out
const stockProfile: Vec2[] = [
  [RCV_REAR + 2, 16],
  [-330, 14],
  [-420, 4],
  [-480, -6],
  [-494, -12],
  [-495, -116],
  [-486, -122],
  [-380, -100],
  [-310, -74],
  [-292, -50],
  [RCV_REAR + 2, -44],
];
const thumbhole: Vec2[] = [
  [-305, -14],
  [-400, -20],
  [-440, -40],
  [-430, -70],
  [-360, -72],
  [-310, -52],
];

const gripProfile: Vec2[] = [
  [-212, -72],
  [-244, -72],
  [-262, -140],
  [-264, -150],
  [-236, -152],
  [-224, -122],
  [-216, -92],
];

const triggerProfile: Vec2[] = [
  [-5, 4],
  [6, 4],
  [6, -4],
  [3, -12],
  [-2, -20],
  [-8, -28],
  [-15, -33],
  [-17, -29],
  [-11, -20],
  [-6, -10],
];

// Belt: four linked rounds side by side across the feed tray, pitch 12.5 mm
const BELT_Z: number[] = [6, 18.5, 31, 43.5];

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver
  {
    id: 'receiver',
    name: 'Stamped receiver',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Stamped and riveted sheet steel with a machined barrel socket',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: receiverWall, depth: 1.8 }, position: [0, 0, 18.5] },
        { geometry: { kind: 'extrude', shape: receiverWall, depth: 1.8 }, position: [0, 0, -18.5] },
        // floor
        { geometry: { kind: 'box', size: [340, 3, 37] }, position: [-112, RCV_BOTTOM + 1.5, 0] },
        // machined barrel socket / trunnion at the front
        { geometry: { kind: 'box', size: [70, 58, 36], radius: 2 }, position: [25, -15, 0] },
        // rear block for the stock and recoil spring seat
        { geometry: { kind: 'box', size: [26, 50, 34], radius: 1 }, position: [RCV_REAR + 13, -16, 0] },
        // feed opening frame on the right wall
        { geometry: { kind: 'box', size: [90, 4, 6] }, position: [-25, RCV_TOP + 2, 20] },
        // left-side dovetail for optics
        { geometry: { kind: 'box', size: [110, 12, 5], radius: 1 }, position: [-150, -8, -22] },
        // carrier rails
        { geometry: { kind: 'box', size: [300, 3, 4] }, position: [-110, -34, 16] },
        { geometry: { kind: 'box', size: [300, 3, 4] }, position: [-110, -34, -16] },
      ],
    },
    position: [0, 0, 0],
    function: 'Stamped steel box that carries the barrel socket, guides the carrier on two rails, and takes the feed tray, top cover, trigger group and stock.',
    confidence: 'estimated',
    adjacent: ['feed_cover', 'feed_tray', 'barrel', 'bolt_carrier', 'trigger_housing', 'stock'],
    mass: 1350,
    thermal: 0.25,
  },
  {
    id: 'feed_cover',
    name: 'Feed tray cover',
    group: 'feed',
    material: 'parkerised-steel',
    materialLabel: 'Stamped sheet steel with the feed pawl housing',
    geometry: {
      kind: 'composite',
      parts: [
        // top plate
        { geometry: { kind: 'box', size: [180, 5, 40], radius: 1 }, position: [90, 15, 0] },
        // left lip, full length; right lip stops short of the feed opening
        { geometry: { kind: 'box', size: [180, 14, 2] }, position: [90, 8, -19] },
        { geometry: { kind: 'box', size: [66, 14, 2] }, position: [33, 8, 19] },
        // feed pawl and belt-guide housing on top
        { geometry: { kind: 'box', size: [60, 12, 24], radius: 2 }, position: [100, 23, 0] },
        // hinge knuckle
        { geometry: { kind: 'cylinder', radius: 5, length: 40, axis: 'z' }, position: [0, 0, 0] },
        // latch at the front
        { geometry: { kind: 'box', size: [14, 10, 20], radius: 2 }, position: [176, 8, 0] },
      ],
    },
    position: [COVER_PIVOT_X, 20, 0],
    pivot: [0, 0, 0],
    function: 'Hinged at the rear; its underside carries the feed pawl that walks the belt one link to the left on every stroke. Opened for loading and to lift the bolt group out.',
    confidence: 'estimated',
    adjacent: ['receiver', 'feed_tray', 'rear_sight', 'belt_links', 'bolt_carrier'],
    strip: { stage: 1, offset: [0, 0, 0], rotate: [0, 0, 1.2], order: 0, motion: 'up' },
    mass: 420,
    thermal: 0.2,
  },
  {
    id: 'rear_sight',
    name: 'Rear sight, tangent leaf',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [30, 8, 20], radius: 1.5 }, position: [0, 4, 0] },
        { geometry: { kind: 'box', size: [56, 3, 14], radius: 0.5 }, position: [18, 9.5, 0] },
        { geometry: { kind: 'box', size: [10, 6, 16], radius: 1 }, position: [20, 12, 0] },
        { geometry: { kind: 'box', size: [4, 9, 16] }, position: [-10, 13, 0] },
      ],
    },
    position: [12, 17, 0],
    parent: 'feed_cover',
    function: 'Leaf on the rear of the cover graduated 100 to 1,500 m, with windage on the notch.',
    confidence: 'published',
    adjacent: ['feed_cover', 'front_sight'],
    strip: { stage: 5, offset: [0, 40, 0], order: 3, motion: 'up' },
    mass: 45,
  },
  {
    id: 'feed_tray',
    name: 'Feed tray',
    group: 'feed',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [150, 4, 36], radius: 1 }, position: [0, 0, 0] },
        // cartridge stop and guide lips
        { geometry: { kind: 'box', size: [40, 6, 3] }, position: [30, 5, -14] },
        { geometry: { kind: 'box', size: [40, 6, 3] }, position: [30, 5, 14] },
      ],
    },
    position: [-25, 16, 0],
    function: 'Plate over the bolt path on which the belt lies; the round in the tray is drawn rearward out of its link by the bolt, then pushed forward into the chamber.',
    confidence: 'estimated',
    adjacent: ['receiver', 'feed_cover', 'belt_links', 'bolt'],
    strip: { stage: 5, offset: [80, 90, 0], order: 2, motion: 'up' },
    mass: 120,
    thermal: 0.3,
  },
  {
    id: 'ejection_port_cover',
    name: 'Ejection port cover',
    group: 'receiver',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [56, 22, 2], radius: 0.6 },
    position: [-50, -25, -20],
    pivot: [0, 11, 0],
    function: 'Sprung flap on the left wall; the carrier pushes it open as it moves and the case leaves downward and to the left.',
    confidence: 'estimated',
    adjacent: ['receiver', 'bolt_carrier'],
    strip: { stage: 5, offset: [0, 0, -60], rotate: [1.2, 0, 0], order: 2, motion: 'left' },
    mass: 25,
  },

  // ------------------------------------------------------------ barrel group (leaves forward as one at stage 2)
  {
    id: 'barrel',
    name: 'Barrel, 658 mm',
    group: 'barrel',
    material: 'parkerised-steel',
    materialLabel: 'Chrome-lined heavy steel barrel, fixed (not quick-change)',
    geometry: {
      kind: 'lathe',
      profile: [
        [0, 0], [15, 0], [15, 60], [12.5, 64], [12.5, 378], [11.5, 382], [11.5, 610], [10.5, 612], [10.5, 644], [10, 646], [10, MUZZLE], [4.5, MUZZLE],
      ],
      segments: 48,
    },
    position: [0, 0, 0],
    function: 'Heavy fixed barrel with a longitudinally ribbed steel jacket; the muzzle blast pulls air through the jacket so it sustains 600 rounds in a burst without a change.',
    notes: ['Length 658 mm measured from the bolt face', 'Rated for about 600 rounds of continuous fire before cooling'],
    confidence: 'published',
    adjacent: ['receiver', 'barrel_shroud', 'gas_block', 'flash_hider', 'bolt'],
    strip: { stage: 2, offset: [280, 0, 0], order: 0, motion: 'forward' },
    mass: 1900,
    thermal: 0.85,
  },
  {
    id: 'barrel_shroud',
    name: 'Forced-air cooling jacket',
    group: 'barrel',
    material: 'parkerised-steel',
    materialLabel: 'Steel jacket with radial ribs and a muzzle ejector',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[13, 0], [21, 0], [21, 520], [27, 524], [27, 556], [21, 560], [21, 568], [13, 568]], segments: 40 }, position: [0, 0, 0] },
        ...Array.from({ length: 11 }, (_, i): { geometry: ComponentDef['geometry']; position: Vec3 } => ({
          geometry: { kind: 'torus', radius: 22.5, tube: 2, axis: 'x' },
          position: [30 + i * 46, 0, 0],
        })),
        // air inlet slots at the rear, represented as four short ribs
        ...[0, 1, 2, 3].map((k): { geometry: ComponentDef['geometry']; position: Vec3; rotation: Vec3 } => ({
          geometry: { kind: 'box', size: [18, 3, 1.5] },
          position: [12, Math.cos((k / 4) * Math.PI * 2) * 22, Math.sin((k / 4) * Math.PI * 2) * 22],
          rotation: [-(k / 4) * Math.PI * 2, 0, 0],
        })),
      ],
    },
    position: [72, 0, 0],
    parent: 'barrel',
    function: 'Encloses the barrel from the receiver to the muzzle; the bell at the front is the ejector that draws air rearward-to-forward along the ribs while firing.',
    confidence: 'estimated',
    adjacent: ['barrel', 'carrying_handle', 'front_sight', 'bipod', 'receiver'],
    strip: { stage: 5, offset: [0, 90, 0], order: 1, motion: 'up' },
    mass: 900,
    thermal: 0.7,
  },
  {
    id: 'carrying_handle',
    name: 'Carrying handle',
    group: 'furniture',
    material: 'polymer-black',
    materialLabel: 'Steel frame with a polymer grip',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [8, 42, 10], radius: 1 }, position: [-35, 22, 0] },
        { geometry: { kind: 'box', size: [8, 42, 10], radius: 1 }, position: [35, 22, 0] },
        { geometry: { kind: 'box', size: [92, 16, 18], radius: 5 }, position: [0, 48, 0] },
      ],
    },
    position: [288, 26, 0],
    parent: 'barrel_shroud',
    function: 'Fixed to the jacket over the balance point; used to carry the gun and to handle the hot barrel group.',
    confidence: 'estimated',
    adjacent: ['barrel_shroud'],
    strip: { stage: 5, offset: [0, 70, 0], order: 2, motion: 'up' },
    mass: 140,
  },
  {
    id: 'front_sight',
    name: 'Front sight',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [16, 12, 12], radius: 1.5 }, position: [0, 6, 0] },
        { geometry: { kind: 'cylinder', radius: 1.4, length: 16, axis: 'y' }, position: [0, 18, 0] },
        { geometry: { kind: 'box', size: [14, 20, 3] }, position: [0, 20, 6.5] },
        { geometry: { kind: 'box', size: [14, 20, 3] }, position: [0, 20, -6.5] },
      ],
    },
    position: [552, 21, 0],
    parent: 'barrel_shroud',
    function: 'Hooded post on the jacket near the muzzle, adjustable for zero.',
    confidence: 'estimated',
    adjacent: ['barrel_shroud', 'rear_sight'],
    strip: { stage: 5, offset: [0, 60, 0], order: 2, motion: 'up' },
    mass: 40,
  },
  {
    id: 'bipod',
    name: 'Bipod',
    group: 'accessory',
    material: 'parkerised-steel',
    materialLabel: 'Steel tube legs, sprung, with a cleaning-rod compartment',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [30, 20, 46], radius: 3 }, position: [0, 0, 0] },
        { geometry: { kind: 'tube', path: [[0, -8, 14], [0, -140, 46], [0, -262, 76]], radius: 6, segments: 12, radialSegments: 12 } },
        { geometry: { kind: 'tube', path: [[0, -8, -14], [0, -140, -46], [0, -262, -76]], radius: 6, segments: 12, radialSegments: 12 } },
        { geometry: { kind: 'box', size: [26, 8, 24], radius: 2 }, position: [0, -266, 80] },
        { geometry: { kind: 'box', size: [26, 8, 24], radius: 2 }, position: [0, -266, -80] },
      ],
    },
    position: [488, -30, 0],
    parent: 'barrel_shroud',
    function: 'Mounted at the front of the jacket rather than on the gas block; the legs fold forward under the barrel and one of them stores the cleaning rod.',
    notes: ['Shown deployed; leg spread drawn narrower than the issue bipod (about 320 mm) to suit the exhibition frame'],
    confidence: 'estimated',
    adjacent: ['barrel_shroud'],
    strip: { stage: 5, offset: [0, -100, 0], order: 3, motion: 'down' },
    mass: 620,
  },
  {
    id: 'flash_hider',
    name: 'Slotted flash hider',
    group: 'muzzle',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[10.1, 0], [13, 0], [13, 12], [13.5, 14], [13.5, 52], [12, 55], [6, 55]], segments: 32 }, position: [0, 0, 0] },
        ...Array.from({ length: 5 }, (_, i): { geometry: ComponentDef['geometry']; position: Vec3; rotation: Vec3 } => {
          const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
          return { geometry: { kind: 'box', size: [30, 2.4, 1.6] }, position: [34, Math.cos(a) * 13.6, Math.sin(a) * 13.6], rotation: [-a, 0, 0] };
        }),
      ],
    },
    position: [FLASH_BASE, 0, 0],
    parent: 'barrel',
    function: 'Threaded onto the muzzle inside the ejector bell; its slots break up the flash of the long-burning rifle charge.',
    confidence: 'estimated',
    adjacent: ['barrel', 'barrel_shroud'],
    strip: { stage: 5, offset: [130, 0, 0], order: 0, motion: 'forward' },
    mass: 80,
    thermal: 0.9,
  },
  {
    id: 'gas_block',
    name: 'Gas block',
    group: 'gas-system',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[12.6, 0], [17, 0], [17, 40], [12.6, 40]], segments: 32 }, position: [0, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 11, length: 40 }, position: [20, GAS_AXIS, 0] },
        { geometry: { kind: 'box', size: [40, 14, 18] }, position: [20, -13, 0] },
      ],
    },
    position: [GAS_BLOCK_X, 0, 0],
    parent: 'barrel',
    function: 'Pinned under the barrel over the gas port; gas is metered by the regulator into the cylinder that houses the piston head.',
    confidence: 'estimated',
    adjacent: ['barrel', 'gas_regulator', 'piston_tube', 'bolt_carrier'],
    strip: { stage: 5, offset: [0, -90, 0], order: 2, motion: 'down' },
    mass: 160,
    thermal: 0.9,
  },
  {
    id: 'gas_regulator',
    name: 'Gas regulator',
    group: 'gas-system',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[8, 0], [13.5, 0], [13.5, 10], [8, 10]], segments: 24 }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [8, 4, 26], radius: 1 }, position: [5, 0, 0] },
      ],
    },
    position: [40, GAS_AXIS, 0],
    pivot: [0, 0, 0],
    parent: 'gas_block',
    function: 'Three-position collar at the front of the cylinder; turned with a cartridge rim to give more gas when fouled or cold.',
    confidence: 'published',
    adjacent: ['gas_block'],
    strip: { stage: 5, offset: [40, 0, 0], order: 3, motion: 'forward' },
    mass: 35,
    thermal: 0.85,
  },
  {
    id: 'piston_tube',
    name: 'Gas cylinder',
    group: 'gas-system',
    material: 'parkerised-steel',
    geometry: { kind: 'lathe', profile: [[9, 0], [11, 0], [11, 60], [9, 60]], segments: 32 },
    position: [-60, GAS_AXIS, 0],
    parent: 'gas_block',
    function: 'Short cylinder behind the gas block in which the piston head runs; the barrel group slides forward off the piston when it is removed.',
    notes: ['Drawn short; on the issue gun the rod is also guided by a tube under the barrel'],
    confidence: 'estimated',
    adjacent: ['gas_block', 'bolt_carrier'],
    strip: { stage: 5, offset: [-70, 0, 0], order: 3, motion: 'rear' },
    mass: 70,
    thermal: 0.85,
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
        { geometry: { kind: 'box', size: [120, 30, 30], radius: 2 }, position: [-80, -17, 0] },
        // cam track boss
        { geometry: { kind: 'box', size: [40, 12, 24], radius: 1 }, position: [-40, 2, 0] },
        // long piston rod and head, under the barrel
        { geometry: { kind: 'lathe', profile: [[0, 0], [8, 0], [8, 6], [7, 8], [7, 370], [9, 372], [9, 388], [7, 390], [0, 390]], segments: 28 }, position: [-20, GAS_AXIS, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Held rearward on the sear between bursts; released, it runs forward, strips a round, locks the bolt and fires. Gas on the piston head drives it back through about 145 mm.',
    notes: ['Fires from an open bolt', 'Reciprocating mass with bolt about 900 g'],
    confidence: 'estimated',
    adjacent: ['receiver', 'bolt', 'piston_tube', 'recoil_spring', 'sear', 'charging_handle'],
    strip: { stage: 3, offset: [-76, 70, 0], order: 1, motion: 'rear' },
    mass: 780,
    thermal: 0.6,
  },
  {
    id: 'bolt',
    name: 'Rotating bolt',
    group: 'action',
    material: 'steel-worn',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, -95], [5, -95], [5, -70], [9, -68], [9, -26], [10.5, -24], [10.5, 0], [0, 0]], segments: 28 } },
        { geometry: { kind: 'box', size: [16, 5, 5] }, position: [-8, 0, 12] },
        { geometry: { kind: 'box', size: [16, 5, 5] }, position: [-8, 0, -12] },
        { geometry: { kind: 'box', size: [8, 6, 5], radius: 1 }, position: [-34, 11, 0] },
      ],
    },
    position: [0, 0, 0],
    parent: 'bolt_carrier',
    function: 'Two lugs turn into the barrel socket to lock; the extractor claw on its face pulls the next round rearward out of the belt on the recoil stroke.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'receiver', 'firing_pin', 'extractor', 'barrel', 'feed_tray'],
    strip: { stage: 3, offset: [60, -40, 0], rotate: [0.6, 0, 0], order: 2, motion: 'forward' },
    mass: 120,
    thermal: 0.6,
    internal: true,
  },
  {
    id: 'firing_pin',
    name: 'Firing pin',
    group: 'action',
    material: 'chrome',
    geometry: { kind: 'lathe', profile: [[0, -90], [3.5, -90], [3.5, -34], [1.5, -32], [1.5, 1], [0, 1]], segments: 16 },
    position: [0, 0, 0],
    parent: 'bolt',
    function: 'Driven forward by the carrier itself in the last millimetres of travel; there is no hammer.',
    confidence: 'estimated',
    adjacent: ['bolt', 'bolt_carrier'],
    strip: { stage: 5, offset: [-90, 0, 0], order: 1, motion: 'rear' },
    mass: 12,
    internal: true,
  },
  {
    id: 'extractor',
    name: 'Extractor',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [18, 6, 5], radius: 1 },
    position: [-9, 6, 9],
    parent: 'bolt',
    function: 'Claw that grips the rim of the round in the belt and holds the fired case until the ejector throws it left.',
    confidence: 'estimated',
    adjacent: ['bolt', 'firing_pin'],
    strip: { stage: 5, offset: [0, 0, 30], order: 2, motion: 'right' },
    mass: 8,
    internal: true,
  },
  {
    id: 'recoil_spring',
    name: 'Return mechanism',
    group: 'action',
    material: 'stainless-steel',
    materialLabel: 'Wire spring on a guide rod with a receiver latch base',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'spring', radius: 9, length: 120, turns: 20, wire: 2 }, position: [-212, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 3, length: 132 }, position: [-212, 0, 0] },
        { geometry: { kind: 'box', size: [10, 26, 26], radius: 1 }, position: [-278, 0, 0] },
      ],
    },
    position: [0, GAS_AXIS + 10, 0],
    function: 'Seats in the receiver rear behind the carrier and returns it forward; the first internal part out of the receiver once the cover is open.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'receiver'],
    strip: { stage: 3, offset: [-80, 90, 0], order: 0, motion: 'up' },
    mass: 110,
    internal: true,
  },
  {
    id: 'charging_handle',
    name: 'Charging handle',
    group: 'action',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [40, 10, 4], radius: 1 }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [16, 14, 18], radius: 3 }, position: [-8, 0, 11] },
      ],
    },
    position: [-60, -12, 21],
    function: 'Non-reciprocating handle on the right; drawn back it carries the bolt group to the sear and is then returned forward by hand.',
    confidence: 'estimated',
    adjacent: ['receiver', 'bolt_carrier'],
    strip: { stage: 5, offset: [0, 0, 70], order: 1, motion: 'right' },
    mass: 60,
  },

  // ------------------------------------------------------------ trigger group (leaves as one at stage 4)
  {
    id: 'trigger_housing',
    name: 'Trigger housing',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [100, 26, 32], radius: 2 }, position: [-213, -58, 0] },
        // trigger guard
        { geometry: { kind: 'box', size: [6, 26, 12] }, position: [-170, -84, 0] },
        { geometry: { kind: 'box', size: [50, 4, 12], radius: 1.5 }, position: [-192, -98, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Unit under the receiver rear that carries the sear, trigger, safety and pistol grip; it comes off as one for cleaning.',
    confidence: 'estimated',
    adjacent: ['receiver', 'trigger', 'sear', 'safety', 'pistol_grip', 'stock'],
    strip: { stage: 4, offset: [0, -130, 0], order: 0, motion: 'down' },
    mass: 260,
  },
  {
    id: 'sear',
    name: 'Sear',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [22, 10, 20], radius: 1 },
    position: [-200, -44, 0],
    parent: 'trigger_housing',
    function: 'Sprung block that rises through the receiver floor to catch the carrier in its rearward position; the trigger pulls it down to fire.',
    confidence: 'estimated',
    adjacent: ['trigger_housing', 'trigger', 'bolt_carrier'],
    strip: { stage: 5, offset: [0, 40, 0], order: 1, motion: 'up' },
    mass: 20,
    internal: true,
  },
  {
    id: 'trigger',
    name: 'Trigger',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: triggerProfile, depth: 9, bevel: 0.6 },
    position: [-190, -66, 0],
    pivot: [0, 0, 0],
    parent: 'trigger_housing',
    function: 'Draws the sear down; automatic fire only, so the burst lasts as long as the trigger is held.',
    confidence: 'estimated',
    adjacent: ['trigger_housing', 'sear', 'safety'],
    strip: { stage: 5, offset: [0, -40, -50], order: 2, motion: 'left' },
    mass: 25,
  },
  {
    id: 'safety',
    name: 'Safety lever',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 8, axis: 'z' }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [26, 6, 3], radius: 1 }, position: [-11, 0, -1] },
      ],
    },
    position: [-206, -56, -17],
    pivot: [0, 0, 0],
    function: 'Lever on the left of the trigger housing; at SAFE (rearward) it locks the sear so the carrier cannot be released.',
    confidence: 'published',
    adjacent: ['trigger_housing', 'sear', 'trigger'],
    strip: { stage: 5, offset: [0, 0, -60], order: 2, motion: 'left' },
    mass: 15,
    parent: 'trigger_housing',
  },
  {
    id: 'pistol_grip',
    name: 'Pistol grip',
    group: 'furniture',
    material: 'polymer-black',
    materialLabel: 'Glass-filled polyamide',
    geometry: { kind: 'extrude', shape: gripProfile, depth: 32, bevel: 3, curveSegments: 6 },
    position: [0, 0, 0],
    parent: 'trigger_housing',
    function: 'Bolted to the trigger housing; polymer on current-production guns.',
    confidence: 'estimated',
    adjacent: ['trigger_housing'],
    strip: { stage: 5, offset: [0, -70, 0], order: 3, motion: 'down' },
    mass: 90,
  },

  // ------------------------------------------------------------ stock
  {
    id: 'stock',
    name: 'Skeleton stock',
    group: 'furniture',
    material: 'polymer-black',
    materialLabel: 'Glass-filled polyamide, skeletonised',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: stockProfile, depth: 42, bevel: 4, holes: [thumbhole], curveSegments: 6 } },
        { geometry: { kind: 'torus', radius: 7, tube: 1.6, axis: 'y' }, position: [-470, -70, -22] },
      ],
    },
    position: [0, 0, 0],
    function: 'Skeletonised stock pinned to the receiver rear; the cut-out saves weight and gives the off hand a hold when firing from the bipod.',
    notes: ['Polymer furniture as on current-production 6P41; early guns had laminate'],
    confidence: 'estimated',
    adjacent: ['receiver', 'buttplate', 'trigger_housing', 'recoil_spring'],
    strip: { stage: 4, offset: [-160, -20, 0], order: 1, motion: 'rear' },
    mass: 520,
  },
  {
    id: 'buttplate',
    name: 'Buttplate',
    group: 'furniture',
    material: 'rubber-black',
    geometry: { kind: 'box', size: [5, 110, 40], radius: 2 },
    position: [BUTT + 2.5, -64, 0],
    parent: 'stock',
    function: 'Rubber pad on the butt face.',
    confidence: 'estimated',
    adjacent: ['stock'],
    strip: { stage: 5, offset: [-50, 0, 0], order: 1, motion: 'rear' },
    mass: 50,
  },

  // ------------------------------------------------------------ belt feed
  {
    id: 'belt_box',
    name: 'Belt box, 100 rounds',
    group: 'feed',
    material: 'paint-od',
    materialLabel: 'Stamped steel, green enamel, with a canvas-lined chute',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [160, 95, 60], radius: 3 }, position: [0, 0, 0] },
        // chute up to the feed opening
        { geometry: { kind: 'box', size: [40, 14, 36], radius: 2 }, position: [20, 52, 14] },
        // hook and latch on the receiver
        { geometry: { kind: 'box', size: [30, 8, 40] }, position: [-60, 51, 0] },
      ],
    },
    position: [-40, -98, 8],
    function: 'Hooks under the receiver and holds a 100-round belt folded in layers; the belt runs up the chute into the feed on the right.',
    confidence: 'estimated',
    adjacent: ['receiver', 'belt_links', 'feed_tray'],
    strip: { stage: 1, offset: [0, -160, 60], order: 2, motion: 'down' },
    mass: 580,
  },
  {
    id: 'belt_links',
    name: 'Belt segment, four links',
    group: 'feed',
    material: 'parkerised-steel',
    materialLabel: 'Non-disintegrating steel link belt, 25-round segments joined by a cartridge',
    geometry: {
      kind: 'composite',
      parts: [
        ...BELT_Z.map((z): { geometry: ComponentDef['geometry']; position: Vec3 } => ({
          geometry: { kind: 'torus', radius: 6.8, tube: 1.1, axis: 'x' },
          position: [0, 0, z - 6],
        })),
        ...BELT_Z.map((z): { geometry: ComponentDef['geometry']; position: Vec3 } => ({
          geometry: { kind: 'torus', radius: 6.8, tube: 1.1, axis: 'x' },
          position: [-22, 0, z - 6],
        })),
        ...BELT_Z.slice(1).map((z): { geometry: ComponentDef['geometry']; position: Vec3 } => ({
          geometry: { kind: 'box', size: [26, 3, 6] },
          position: [-11, 7, z - 12.25],
        })),
      ],
    },
    position: [-25, BELT_Y, 0],
    function: 'Closed-loop steel links that stay joined after firing; the feed pawl walks the belt one pitch to the left on each stroke and the bolt pulls each round rearward out of its link.',
    notes: ['Pitch 12.5 mm; the same belt fits the PKM'],
    confidence: 'estimated',
    adjacent: ['feed_tray', 'feed_cover', 'belt_box', 'bolt'],
    strip: { stage: 1, offset: [0, 40, 90], order: 1, motion: 'right' },
    mass: 40,
  },
  ...BELT_Z.map((z, i): ComponentDef => ({
    id: `round_${i + 1}`,
    name: `Cartridge, 7.62×54 mmR in belt (${i + 1})`,
    group: 'ammunition',
    material: 'brass',
    materialLabel: 'Lacquered steel case, 57-N-323S ball',
    geometry: { kind: 'cartridge', caseDiameter: 12.37, caseLength: 53.7, bulletDiameter: 7.92, bulletLength: 33, rimDiameter: 14.4, shoulder: 0.8 },
    position: [-20, 0, z - 6],
    parent: 'belt_links',
    function: 'Held in its link on the feed tray; the round nearest the bolt is next to be pulled rearward and chambered.',
    confidence: 'published',
    adjacent: ['belt_links', 'feed_tray'],
    strip: { stage: 5, offset: [50 + i * 10, 0, 0], order: 3, motion: 'forward' },
    mass: 22,
  })),
];

export const pkp: FirearmDefinition = {
  id: 'pkp',
  name: 'PKP Pecheneg',
  shortName: 'PKP',
  spec: {
    manufacturer: 'V. A. Degtyarev Plant (ZiD), Kovrov; designed at TsNIITochMash',
    designation: 'PKP Pecheneg, 7.62 mm machine gun (GRAU 6P41)',
    origin: 'Russia',
    designed: { value: 1999, confidence: 'published', note: 'year of adoption' },
    category: 'lmg',
    categoryLabel: 'General-purpose machine gun',
    cartridge: '7.62×54 mmR',
    action: 'long-stroke-piston',
    actionLabel: 'Gas-operated, long-stroke piston, rotating bolt, fires from an open bolt',
    feed: 'belt',
    capacity: { value: '100-round non-disintegrating belt in an attached box; 200 and 250-round belts from a separate box', confidence: 'published' },
    overallLength: { value: 1200, unit: 'mm', confidence: 'published' },
    barrelLength: { value: 658, unit: 'mm', confidence: 'published' },
    mass: { value: 8200, unit: 'g', confidence: 'published', note: 'with bipod, without belt box' },
    muzzleVelocity: { value: 825, unit: 'm/s', confidence: 'published', note: '57-N-323S ball' },
    rateOfFire: { value: '650 rounds/min cyclic', confidence: 'published' },
    effectiveRange: { value: 1500, unit: 'm', confidence: 'published', note: 'sights graduated to 1,500 m' },
    twist: { value: '1 in 240 mm (1:9.45 in), RH, 4 grooves', confidence: 'published' },
    sights: 'Hooded post front on the barrel jacket; tangent leaf rear on the feed cover, graduated to 1,500 m; left-side dovetail for optics',
    identification: 'A PK-pattern machine gun whose barrel is hidden inside a ribbed jacket with a bell at the muzzle, a fixed carrying handle over the barrel, a bipod at the muzzle end, a skeleton stock and a belt box hanging under the receiver.',
    mechanism: 'Fires from an open bolt: the carrier is held rearward on the sear and, when released, runs forward, strips a round from the belt, locks the two-lug bolt into the barrel socket and fires. Gas from the port under the barrel drives the piston and carrier back through about 145 mm; the feed pawl in the cover advances the belt one link on each stroke. The barrel jacket uses muzzle blast to draw cooling air along the ribs, so the barrel is fixed rather than quick-change.',
  },
  provenance: {
    configuration: 'PKP Pecheneg (6P41), bipod deployed, 100-round belt box fitted, polymer skeleton stock and grip, iron sights',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'Degtyarev Plant (ZiD) / Rosoboronexport product sheet, 7.62 mm Pecheneg machine gun', covers: ['overallLength', 'barrelLength', 'mass', 'muzzleVelocity', 'rateOfFire', 'effectiveRange', 'capacity'] },
      { label: 'Russian Army manual, 7.62 mm PK / PKM machine gun family', covers: ['mechanism', 'sights', 'field strip order'] },
      { label: 'Jane’s Infantry Weapons', covers: ['designed', 'twist', 'muzzleVelocity'] },
      { label: 'CIP / 7.62×54 R cartridge drawing', covers: ['cartridge'] },
    ],
    notes: [
      'Exterior proportions follow published dimensions; internal component positions are estimated from the PK pattern.',
      'The gas cylinder is drawn short so the bolt group can leave rearward-and-up as a single motion; on the issue gun the rod is guided along more of its length.',
      'The feed cover is drawn 180 mm long with the rear sight at its hinge end; the receiver top behind it is left open.',
      'Cooling ribs are drawn as eleven rings; the real jacket has longitudinal fins.',
      'Belt shown as four links on the tray; the box holds a folded 100-round belt that is not modelled.',
    ],
  },
  components,
  actions: {
    cycle: {
      id: 'cycle',
      label: 'Charge',
      duration: 1.2,
      interruptible: false,
      steps: [
        { component: 'charging_handle', t: [0.0, 0.5], translate: [-BOLT_TRAVEL, 0, 0], easing: 'inOutCubic' },
        { component: 'bolt_carrier', t: [0.02, 0.52], translate: [-BOLT_TRAVEL, 0, 0], easing: 'inOutCubic' },
        { component: 'bolt', t: [0.03, 0.12], rotate: [0.6, 0, 0], easing: 'inOutCubic' },
        { component: 'ejection_port_cover', t: [0.04, 0.14], rotate: [1.2, 0, 0], easing: 'outBack' },
        { component: 'charging_handle', t: [0.7, 1.0], reset: true, easing: 'inOutCubic' },
      ],
      audio: [
        { event: 'charge_pull', at: 0.0, component: 'charging_handle', caption: 'Charging handle drawn rearward; carrier and piston travel 145 mm' },
        { event: 'component_seat', at: 0.52, component: 'sear', caption: 'Carrier caught by the sear: cocked with the bolt open' },
        { event: 'bolt_close', at: 1.0, component: 'charging_handle', caption: 'Charging handle returned forward by hand' },
      ],
    },
    dryFire: {
      id: 'dryFire',
      label: 'Dry fire',
      duration: 0.7,
      steps: [
        { component: 'trigger', t: [0.0, 0.14], rotate: [0, 0, -0.15], easing: 'inQuad' },
        { component: 'sear', t: [0.12, 0.17], translate: [0, -5, 0], easing: 'mechanicalSnap' },
        { component: 'trigger', t: [0.42, 0.6], reset: true, easing: 'outQuad' },
        { component: 'sear', t: [0.5, 0.6], reset: true, easing: 'springReturn' },
      ],
      audio: [
        { event: 'trigger_break', at: 0.13, component: 'trigger', caption: 'Trigger breaks' },
        { event: 'bolt_release', at: 0.17, component: 'sear', caption: 'Sear drops; from the open bolt the carrier would run forward' },
        { event: 'trigger_reset', at: 0.58, component: 'trigger', caption: 'Trigger resets; sear rises' },
      ],
    },
    reload: {
      id: 'reload',
      label: 'Belt change',
      duration: 2.4,
      steps: [
        { component: 'feed_cover', t: [0.0, 0.45], rotate: [0, 0, 1.2], easing: 'outBack' },
        { component: 'belt_links', t: [0.4, 0.7], translate: [0, 40, 70], easing: 'outQuad' },
        { component: 'belt_box', t: [0.5, 0.85], translate: [0, -120, 40], easing: 'outQuad' },
        { component: 'belt_box', t: [1.2, 1.5], reset: true, easing: 'mechanicalSnap' },
        { component: 'belt_links', t: [1.5, 1.8], reset: true, easing: 'inOutCubic' },
        { component: 'feed_cover', t: [1.95, 2.3], reset: true, easing: 'inOutCubic' },
      ],
      audio: [
        { event: 'component_out', at: 0.0, component: 'feed_cover', caption: 'Feed cover latch released; cover swings up' },
        { event: 'component_out', at: 0.45, component: 'belt_links', caption: 'Belt lifted off the tray' },
        { event: 'mag_release', at: 0.5, component: 'belt_box', caption: 'Belt box unhooked' },
        { event: 'mag_seat', at: 1.5, component: 'belt_box', caption: 'Belt box hooked on' },
        { event: 'component_seat', at: 1.8, component: 'belt_links', caption: 'Belt laid in the feed tray, first round against the stop' },
        { event: 'bolt_close', at: 2.3, component: 'feed_cover', caption: 'Feed cover latched' },
      ],
    },
    safety: {
      id: 'safety',
      label: 'Safety',
      duration: 0.4,
      steps: [{ component: 'safety', t: [0.0, 0.24], rotate: [0, 0, 0.8], easing: 'detent' }],
      audio: [{ event: 'selector', at: 0.22, component: 'safety', caption: 'Safety lever forward to FIRE' }],
    },
  },
  acoustic: {
    mass: 8200,
    receiver: 'steel-stamped',
    action: 'long-stroke-piston',
    reciprocatingMass: 900,
    spring: { frequency: 18, damping: 0.35 },
    furniture: 'polymer',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'In battery',
      description: 'Fully assembled, bolt forward and locked, belt in the tray, cover closed, safety at SAFE, bipod deployed.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Feed cover open, belt off',
      description: 'The cover swings up on its rear hinge, the belt lifts off the tray to the right and the box unhooks from under the receiver; the gun is now clear.',
      camera: 'three-quarter',
      focus: ['feed_cover', 'belt_links', 'belt_box', 'feed_tray'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'feed_cover', caption: 'Feed cover opened' },
        { event: 'component_out', at: 0.25, component: 'belt_links', caption: 'Belt lifted clear' },
        { event: 'mag_out', at: 0.5, component: 'belt_box', caption: 'Belt box unhooked' },
      ],
    },
    {
      stage: 2,
      title: 'Barrel group forward',
      description: 'With its lock released, the barrel slides forward out of the socket and carries the jacket, handle, gas block, bipod and flash hider with it; the gas cylinder slips off the piston head as it goes.',
      camera: 'side',
      focus: ['barrel', 'barrel_shroud', 'gas_block', 'piston_tube', 'receiver'],
      audio: [
        { event: 'pin_push', at: 0.0, component: 'receiver', caption: 'Barrel lock released' },
        { event: 'component_out', at: 0.2, component: 'barrel', caption: 'Barrel group drawn forward' },
      ],
    },
    {
      stage: 3,
      title: 'Return mechanism, carrier and bolt out',
      description: 'The return mechanism lifts out of the receiver rear first; the carrier with its long piston then slides back until the head clears the cylinder and lifts out, and the bolt turns forward out of its cam track.',
      camera: 'iso',
      focus: ['recoil_spring', 'bolt_carrier', 'bolt', 'receiver'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'recoil_spring', caption: 'Return mechanism lifted out' },
        { event: 'component_out', at: 0.3, component: 'bolt_carrier', caption: 'Carrier and piston lifted out' },
        { event: 'component_out', at: 0.6, component: 'bolt', caption: 'Bolt separated from the carrier' },
      ],
    },
    {
      stage: 4,
      title: 'Trigger group and stock off',
      description: 'The trigger housing, carrying sear, trigger, safety and grip, drops away from the receiver, and the stock comes off the rear.',
      camera: 'side',
      focus: ['trigger_housing', 'pistol_grip', 'stock', 'receiver'],
      audio: [
        { event: 'pin_push', at: 0.0, component: 'trigger_housing', caption: 'Trigger housing pin pushed out' },
        { event: 'component_out', at: 0.2, component: 'trigger_housing', caption: 'Trigger group lowered away' },
        { event: 'component_out', at: 0.55, component: 'stock', caption: 'Stock withdrawn' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis, including the jacket, bipod and regulator that ride with the barrel and the four rounds pulled from their links.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 1,200 mm', from: [BUTT, -330, 0], to: [FLASH_TIP, -330, 0] },
      { label: 'Barrel 658 mm', from: [0, 110, 0], to: [MUZZLE, 110, 0] },
    ],
  },
  cartridge: { caseDiameter: 12.37, caseLength: 53.7, bulletDiameter: 7.92, bulletLength: 33, rimDiameter: 14.4, label: '7.62×54 mmR' },
  ejection: { position: [-50, -20, -20], direction: [0.1, -0.35, -1] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default pkp;
