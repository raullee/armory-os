import type { ComponentDef, FirearmDefinition, GeometrySpec, Vec2, Vec3 } from '@/firearm/schema';

/**
 * Magnum Research Desert Eagle Mark XIX, .50 Action Express, 6 in barrel.
 *
 * Frame: bore axis y=0, bolt face (in battery) at x=0, +x toward the muzzle,
 * +z shooter's right. All dimensions mm.
 *
 * Published dimensions (Magnum Research Mark XIX specification sheet):
 * overall 273 mm (10.75 in), barrel 152 mm (6 in), height 158 mm, width 32 mm,
 * mass 1,998 g (4 lb 6.6 oz). Unlike a Browning pistol the barrel is fixed to
 * the frame and forms the whole upper; the slide is the lower rear block that
 * carries the rotating bolt. Gas system and bolt geometry are estimated.
 */

// ---- layout constants (mm) --------------------------------------------------
const MUZZLE = 152;
const RAIL = -24; // frame rail plane / slide underside
const SLIDE_REAR = -95;
const SLIDE_FRONT = 110; // the 6 in barrel shows only about 40 mm ahead of the slide
const SLIDE_TOP = 14;
const BARREL_REAR = -42; // rear of the barrel, carries the rear sight
const HAMMER_TIP = -121;
const SLIDE_TRAVEL = 55;

/**
 * Geometry note: composites are built only from extrusions (a box is an extruded
 * rectangle, a shaft an extruded polygon). Lathes and rails are used on their own.
 */
const rect = (w: number, h: number): Vec2[] => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
const ngon = (r: number, n = 20): Vec2[] => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r] as Vec2);

/** Barrel: flat-topped block, rounded muzzle, gas port block underneath near the muzzle; the rear runs back over the slide to the rear sight. */
const barrelProfile: Vec2[] = [
  [BARREL_REAR, 12],
  [149, 12],
  [152, 10],
  [153.5, 5], // rounded muzzle end
  [153.5, -9],
  [152, -13],
  [149, -16],
  [130, -16],
  [130, -22], // gas port block
  [114, -22],
  [114, -16],
  [SLIDE_FRONT, -16],
  [SLIDE_FRONT, -6], // over the slide the barrel is shallower
  [BARREL_REAR, -6],
];

/** Slide: tall serrated rear block, stepped lower front section under the barrel, rounded nose. */
const slideProfile: Vec2[] = [
  [SLIDE_REAR, RAIL],
  [SLIDE_FRONT, RAIL],
  [SLIDE_FRONT + 3, -21],
  [SLIDE_FRONT + 4, -15],
  [SLIDE_FRONT + 3, -9],
  [SLIDE_FRONT, -6.5],
  [-45, -6.5],
  [-45, SLIDE_TOP],
  [-92, SLIDE_TOP],
  [SLIDE_REAR, 8],
];

/** Frame: squared, hooked trigger guard, grip raked back, beavertail at the top rear, bevelled magazine well. */
const frameProfile: Vec2[] = [
  [-108, RAIL], // rear top under the slide
  [70, RAIL], // front top, barrel latch housing
  [72, -44], // front face
  [40, -46], // underside to the guard
  [40, -66], // squared guard front with finger hook
  [34, -72],
  [26, -74],
  [-8, -74], // guard bottom
  [-18, -68],
  [-24, -72], // front strap top
  [-44, -134], // front strap bottom (about 18 degrees)
  [-48, -137], // bevelled magazine well
  [-96, -137],
  [-100, -133], // butt rear
  [-106, -90], // backstrap
  [-110, -56],
  [-119, -30], // beavertail
  [-119, -24],
];

const triggerOpening: Vec2[] = [
  [34, -48],
  [34, -66],
  [26, -70],
  [-6, -70],
  [-14, -62],
  [-14, -48],
];

const gripPanelProfile: Vec2[] = [
  [-28, -76],
  [-45, -128],
  [-94, -130],
  [-102, -80],
];

/** Hammer drawn cocked, about its pin. */
const hammerProfile: Vec2[] = [
  [-4, -6],
  [5, -6],
  [6, 2],
  [3, 8],
  [-4, 10],
  [-14, 8],
  [-20, 4],
  [-21, -1],
  [-16, -3],
  [-8, -2],
];

const triggerProfile: Vec2[] = [
  [-3, 2],
  [4, 2],
  [5, -6],
  [4, -14],
  [1, -19],
  [-3, -17],
  [-4, -8],
];

const slideReleaseProfile: Vec2[] = [
  [0, 3],
  [-22, 5],
  [-30, 2],
  [-30, -3],
  [-22, -4],
  [0, -3],
];

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver
  {
    id: 'frame',
    name: 'Frame',
    group: 'receiver',
    material: 'blued-steel',
    materialLabel: 'Carbon steel, black oxide finish',
    geometry: { kind: 'extrude', shape: frameProfile, depth: 24, bevel: 1.0, holes: [triggerOpening] },
    position: [0, 0, 0],
    function: 'Steel frame carrying the slide rails, the gas cylinder under the barrel, the barrel latch, the lock-work and the magazine well; the squared, hooked trigger guard and beavertail are Mark XIX features.',
    confidence: 'published',
    adjacent: ['slide', 'barrel', 'gas_cylinder', 'barrel_latch', 'hammer', 'magazine'],
    mass: 560,
    thermal: 0.15,
  },
  {
    id: 'grip_left',
    name: 'Grip panel, left',
    group: 'furniture',
    material: 'rubber-black',
    materialLabel: 'Rubber (Hogue pattern) over the steel grip frame',
    geometry: { kind: 'extrude', shape: gripPanelProfile, depth: 4, bevel: 1.2, curveSegments: 4 },
    position: [0, 0, -14],
    parent: 'frame',
    function: 'Screw-retained rubber panel; the grip is sized for the .50 AE magazine, which sets the pistol’s girth.',
    confidence: 'estimated',
    adjacent: ['frame'],
    strip: { stage: 5, offset: [0, 0, -34], order: 1, motion: 'left' },
    mass: 25,
  },
  {
    id: 'grip_right',
    name: 'Grip panel, right',
    group: 'furniture',
    material: 'rubber-black',
    materialLabel: 'Rubber (Hogue pattern) over the steel grip frame',
    geometry: { kind: 'extrude', shape: gripPanelProfile, depth: 4, bevel: 1.2, curveSegments: 4 },
    position: [0, 0, 14],
    parent: 'frame',
    function: 'Screw-retained rubber panel; the grip is sized for the .50 AE magazine, which sets the pistol’s girth.',
    confidence: 'estimated',
    adjacent: ['frame'],
    strip: { stage: 5, offset: [0, 0, 34], order: 1, motion: 'right' },
    mass: 25,
  },

  // ------------------------------------------------------------ barrel
  {
    id: 'barrel',
    name: 'Barrel, 6 in',
    group: 'barrel',
    material: 'blued-steel',
    materialLabel: 'Carbon steel, polygonal rifling, black oxide',
    geometry: { kind: 'extrude', shape: barrelProfile, depth: 26, bevel: 1.5, curveSegments: 6 },
    position: [0, 0, 0],
    function: 'Fixed to the frame by the barrel latch and forms the whole upper; the bolt locks into its rear extension and the gas port near the muzzle feeds the piston tube underneath.',
    notes: ['Length 152 mm from the bolt face', 'Polygonal rifling, 1 in 19 in (483 mm) RH', 'Interchangeable with 10 in and 14 in barrels'],
    confidence: 'published',
    adjacent: ['frame', 'slide', 'bolt', 'barrel_latch', 'gas_cylinder', 'barrel_rail', 'front_sight', 'rear_sight'],
    strip: { stage: 2, offset: [95, 55, 0], order: 2, motion: 'forward' },
    mass: 720,
    thermal: 0.7,
  },
  {
    id: 'barrel_rail',
    name: 'Barrel rail',
    group: 'accessory',
    material: 'blued-steel',
    geometry: { kind: 'rail', length: 100, width: 21.2, height: 6 },
    position: [80, 12, 0],
    parent: 'barrel',
    function: 'Integral Weaver-style rail machined into the top of the barrel; because the barrel never moves, an optic mounted here holds zero through recoil.',
    confidence: 'published',
    adjacent: ['barrel', 'rear_sight'],
    mass: 40,
  },
  {
    id: 'front_sight',
    name: 'Front sight',
    group: 'sights',
    material: 'blued-steel',
    geometry: { kind: 'box', size: [5, 5, 3], radius: 0.4 },
    position: [142, 14.5, 0],
    parent: 'barrel',
    function: 'Fixed blade on the barrel ahead of the rail; both sights stay aligned with the bore.',
    confidence: 'published',
    adjacent: ['barrel'],
    strip: { stage: 5, offset: [0, 30, 0], order: 0, motion: 'up' },
    mass: 3,
  },
  {
    id: 'rear_sight',
    name: 'Rear sight',
    group: 'sights',
    material: 'blued-steel',
    geometry: { kind: 'box', size: [12, 5, 18], radius: 0.8 },
    position: [-34, 14.5, 0],
    parent: 'barrel',
    function: 'Fixed square-notch sight at the rear of the barrel, behind the rail.',
    confidence: 'published',
    adjacent: ['barrel', 'barrel_rail'],
    strip: { stage: 5, offset: [0, 30, 0], order: 0, motion: 'up' },
    mass: 6,
  },
  {
    id: 'barrel_latch',
    name: 'Barrel latch (takedown lever)',
    group: 'receiver',
    material: 'blued-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: ngon(4), depth: 30 } },
        { geometry: { kind: 'extrude', shape: rect(22, 6), depth: 2.6, bevel: 0.5 }, position: [-9, 0, -15.5] },
      ],
    },
    position: [58, -33, 0],
    pivot: [0, 0, 0],
    function: 'Cross-shaft lever on the left front of the frame; a quarter turn frees the barrel and slide to lift off the frame together.',
    confidence: 'published',
    adjacent: ['frame', 'barrel'],
    strip: { stage: 2, offset: [0, 0, 0], rotate: [0, 0, 1.3], order: 0, motion: 'out' },
    mass: 20,
  },

  // ------------------------------------------------------------ gas system
  {
    id: 'gas_cylinder',
    name: 'Gas cylinder',
    group: 'gas-system',
    material: 'blued-steel',
    geometry: { kind: 'cylinder', radius: 7.5, length: 42, openEnded: true },
    position: [48, -33, 0],
    function: 'Tube inside the front of the frame in which the piston is driven rearward by gas tapped from the barrel.',
    confidence: 'estimated',
    adjacent: ['frame', 'gas_piston', 'barrel'],
    strip: { stage: 5, offset: [60, -30, 0], order: 2, motion: 'forward' },
    mass: 40,
    thermal: 0.75,
    internal: true,
  },
  {
    id: 'gas_piston',
    name: 'Gas piston',
    group: 'gas-system',
    material: 'stainless-steel',
    geometry: { kind: 'lathe', profile: [[0, 0], [6.2, 0], [6.2, 20], [4.5, 22], [4.5, 60], [0, 60]], segments: 24 },
    position: [-6, -33, 0],
    function: 'Short-stroke piston under the barrel; its rearward kick starts the slide moving, then it stops and the slide carries on under its own momentum.',
    confidence: 'estimated',
    adjacent: ['gas_cylinder', 'slide', 'frame'],
    strip: { stage: 5, offset: [90, -30, 0], order: 3, motion: 'forward' },
    mass: 45,
    thermal: 0.7,
    internal: true,
  },

  // ------------------------------------------------------------ slide / bolt
  {
    id: 'slide',
    name: 'Slide',
    group: 'action',
    material: 'blued-steel',
    materialLabel: 'Carbon steel, black oxide',
    geometry: { kind: 'extrude', shape: slideProfile, depth: 32, bevel: 1.5, curveSegments: 6 },
    position: [0, 0, 0],
    function: 'Runs on the frame rails beneath and behind the barrel and carries the rotating bolt; the piston kicks it rearward and the cam track in its walls turns the bolt out of lock. The tall rear block carries the cocking serrations and the safety.',
    notes: ['Slide travel about 55 mm', 'Cocking serrations not modelled'],
    confidence: 'published',
    adjacent: ['frame', 'barrel', 'bolt', 'recoil_spring_left', 'recoil_spring_right', 'gas_piston', 'ambi_safety'],
    strip: { stage: 2, offset: [40, 55, 0], order: 1, motion: 'forward' },
    mass: 420,
    thermal: 0.35,
  },
  {
    id: 'bolt',
    name: 'Bolt, rotating',
    group: 'action',
    material: 'nitride-steel',
    materialLabel: 'Tool steel',
    geometry: { kind: 'lathe', profile: [[0, -58], [6.5, -58], [6.5, -44], [8.5, -42], [8.5, -12], [7.6, -10], [7.6, 0], [0, 0]], segments: 28 },
    position: [0, 0, 0],
    parent: 'slide',
    function: 'Locks into the barrel extension like a scaled-down rifle bolt; the cam pin in the slide rotates it about 30 degrees to unlock.',
    confidence: 'estimated',
    adjacent: ['slide', 'barrel', 'bolt_lugs', 'firing_pin', 'bolt_extractor'],
    strip: { stage: 3, offset: [24, -42, 0], order: 1, motion: 'forward' },
    mass: 85,
    thermal: 0.6,
    internal: true,
  },
  {
    id: 'bolt_lugs',
    name: 'Locking lugs, three',
    group: 'action',
    material: 'nitride-steel',
    geometry: {
      kind: 'composite',
      parts: Array.from({ length: 3 }, (_, i): { geometry: GeometrySpec; position: Vec3; rotation: Vec3 } => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        return { geometry: { kind: 'extrude', shape: rect(9, 3.4), depth: 4.5 }, position: [-6, Math.cos(a) * 9.4, Math.sin(a) * 9.4], rotation: [a, 0, 0] };
      }),
    },
    position: [0, 0, 0],
    parent: 'bolt',
    function: 'Three radial lugs on the bolt head that turn into the barrel extension; the .50 AE breech pressure is carried here, not by the slide.',
    confidence: 'estimated',
    adjacent: ['bolt', 'barrel'],
    mass: 10,
    thermal: 0.6,
    internal: true,
  },
  {
    id: 'firing_pin',
    name: 'Firing pin',
    group: 'action',
    material: 'stainless-steel',
    geometry: { kind: 'lathe', profile: [[0, 0], [2.8, 0], [2.8, 6], [1.6, 8], [1.6, 52], [1.0, 54], [0, 56]], segments: 18 },
    position: [-57, 0, 0],
    parent: 'bolt',
    function: 'Runs the length of the bolt; struck by the hammer through the rear of the slide.',
    confidence: 'estimated',
    adjacent: ['bolt', 'firing_pin_spring', 'hammer'],
    strip: { stage: 4, offset: [-60, 0, 0], order: 1, motion: 'rear' },
    mass: 8,
    internal: true,
  },
  {
    id: 'firing_pin_spring',
    name: 'Firing pin spring',
    group: 'action',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 2.2, length: 24, turns: 12, wire: 0.6 },
    position: [-36, 0, 0],
    parent: 'bolt',
    function: 'Returns the firing pin behind the bolt face after each strike.',
    confidence: 'estimated',
    adjacent: ['firing_pin', 'bolt'],
    strip: { stage: 4, offset: [-40, -10, 0], order: 2, motion: 'rear' },
    mass: 1,
    internal: true,
  },
  {
    id: 'bolt_extractor',
    name: 'Extractor',
    group: 'action',
    material: 'nitride-steel',
    geometry: { kind: 'box', size: [16, 4, 3.5], radius: 0.6 },
    position: [-8, 2, 8.5],
    parent: 'bolt',
    function: 'Spring-loaded claw in the bolt head that grips the rebated .50 AE rim.',
    confidence: 'estimated',
    adjacent: ['bolt'],
    strip: { stage: 4, offset: [0, 0, 24], order: 0, motion: 'right' },
    mass: 4,
    internal: true,
  },
  {
    id: 'recoil_spring_left',
    name: 'Recoil spring, left',
    group: 'action',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 3.2, length: 70, turns: 18, wire: 1.0 },
    position: [-40, -16, -10],
    parent: 'slide',
    function: 'One of the two recoil springs on parallel guide rods low in the slide; together they return the slide and bolt to battery.',
    notes: ['Guide rod not modelled'],
    confidence: 'estimated',
    adjacent: ['slide', 'frame', 'recoil_spring_right'],
    strip: { stage: 3, offset: [-40, -30, 0], order: 0, motion: 'rear' },
    mass: 18,
    internal: true,
  },
  {
    id: 'recoil_spring_right',
    name: 'Recoil spring, right',
    group: 'action',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 3.2, length: 70, turns: 18, wire: 1.0 },
    position: [-40, -16, 10],
    parent: 'slide',
    function: 'One of the two recoil springs on parallel guide rods low in the slide; together they return the slide and bolt to battery.',
    notes: ['Guide rod not modelled'],
    confidence: 'estimated',
    adjacent: ['slide', 'frame', 'recoil_spring_left'],
    strip: { stage: 3, offset: [-40, -30, 0], order: 0, motion: 'rear' },
    mass: 18,
    internal: true,
  },
  {
    id: 'ambi_safety',
    name: 'Safety, ambidextrous',
    group: 'fire-control',
    material: 'blued-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: ngon(3.5), depth: 36 } },
        { geometry: { kind: 'extrude', shape: rect(16, 5), depth: 2.6, bevel: 0.5 }, position: [-7, -1, -17.2] },
        { geometry: { kind: 'extrude', shape: rect(16, 5), depth: 2.6, bevel: 0.5 }, position: [-7, -1, 17.2] },
      ],
    },
    position: [-70, 0, 0],
    pivot: [0, 0, 0],
    parent: 'slide',
    function: 'Slide-mounted lever on both sides; in the down position shown it blocks the firing pin and disconnects the hammer.',
    notes: ['Rest pose shown SAFE (levers down)'],
    confidence: 'published',
    adjacent: ['slide', 'firing_pin', 'hammer'],
    strip: { stage: 5, offset: [0, 0, -44], order: 2, motion: 'left' },
    mass: 22,
  },

  // ------------------------------------------------------------ fire control
  {
    id: 'hammer',
    name: 'Hammer',
    group: 'fire-control',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: hammerProfile, depth: 7, bevel: 0.6 },
    position: [-100, -30, 0],
    pivot: [0, 0, 0],
    function: 'Exposed spur hammer, held at full cock by the sear; the slide re-cocks it on every shot.',
    notes: ['Rest pose shown cocked'],
    confidence: 'estimated',
    adjacent: ['frame', 'firing_pin', 'trigger', 'ambi_safety'],
    strip: { stage: 5, offset: [-30, 30, 0], order: 3, motion: 'rear' },
    mass: 35,
  },
  {
    id: 'trigger',
    name: 'Trigger',
    group: 'fire-control',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: triggerProfile, depth: 8, bevel: 0.8 },
    position: [6, -45, 0],
    pivot: [0, 0, 0],
    function: 'Pivoting single-action trigger; a bar along the right of the frame carries the pull to the sear.',
    notes: ['Pull weight about 1.8 kgf (published)'],
    confidence: 'estimated',
    adjacent: ['frame', 'hammer'],
    strip: { stage: 5, offset: [0, 0, -44], order: 2, motion: 'left' },
    mass: 12,
  },
  {
    id: 'slide_release',
    name: 'Slide release',
    group: 'fire-control',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: slideReleaseProfile, depth: 2.6 },
    position: [-20, -30, -13.4],
    function: 'Left-side lever, lifted by the follower on the last round to hold the slide open.',
    confidence: 'estimated',
    adjacent: ['frame', 'slide', 'follower'],
    strip: { stage: 5, offset: [0, 0, -46], order: 1, motion: 'left' },
    mass: 10,
  },
  {
    id: 'mag_catch',
    name: 'Magazine catch',
    group: 'fire-control',
    material: 'blued-steel',
    geometry: { kind: 'cylinder', radius: 5, length: 26, axis: 'z' },
    position: [-22, -64, 0],
    function: 'Push-button behind the trigger guard; pressed from the left it frees the magazine.',
    confidence: 'published',
    adjacent: ['frame', 'magazine'],
    strip: { stage: 5, offset: [0, 0, 46], order: 2, motion: 'right' },
    mass: 10,
  },

  // ------------------------------------------------------------ feed
  {
    id: 'magazine',
    name: 'Magazine, 7-round',
    group: 'feed',
    material: 'blued-steel',
    materialLabel: 'Steel, single column',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: [[-14, -26], [-58, -26], [-93, -134], [-49, -134]], depth: 15, bevel: 1.0 } },
        { geometry: { kind: 'extrude', shape: rect(48, 3), depth: 16 }, position: [-71, -135.5, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Single-column box magazine for the fat .50 AE case; seven rounds in a grip already at the limit of most hands.',
    notes: ['7 rounds .50 AE; 8 in .44 Magnum, 9 in .357 Magnum'],
    confidence: 'published',
    adjacent: ['frame', 'mag_catch', 'follower', 'slide_release'],
    strip: { stage: 1, offset: [0, -150, 0], rotate: [0, 0, 0.03], motion: 'down' },
    mass: 150,
  },
  {
    id: 'follower',
    name: 'Follower',
    group: 'feed',
    material: 'polymer-black',
    geometry: { kind: 'box', size: [36, 5, 12], radius: 1 },
    position: [-53, -78, 0],
    parent: 'magazine',
    function: 'Lifts the column; on the last round it raises the slide release.',
    confidence: 'estimated',
    adjacent: ['magazine', 'magazine_spring', 'slide_release'],
    strip: { stage: 5, offset: [0, 40, 0], order: 2, motion: 'up' },
    mass: 6,
    internal: true,
  },
  {
    id: 'magazine_spring',
    name: 'Magazine spring',
    group: 'feed',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 5.5, length: 44, turns: 6, wire: 1.0, axis: 'y' },
    position: [-62, -106, 0],
    parent: 'magazine',
    function: 'Provides the lift that feeds the last heavy round as reliably as the first.',
    confidence: 'estimated',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, 25, 0], order: 3, motion: 'up' },
    mass: 8,
    internal: true,
  },
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `round_${i + 1}`,
    name: `Cartridge, .50 Action Express (${i + 1})`,
    group: 'ammunition' as const,
    material: 'brass' as const,
    geometry: { kind: 'cartridge' as const, caseDiameter: 13.9, caseLength: 32.6, bulletDiameter: 12.7, bulletLength: 23, rimDiameter: 12.9, shoulder: 0.9 },
    position: [-56 - i * 4.6, -34 - i * 14.2, 0] as Vec3,
    parent: 'magazine',
    function: 'Single column; the rebated rim lets the .50 AE share a bolt face with the .44 Magnum.',
    confidence: 'published' as const,
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5 as const, offset: [0, 60 + i * 14, 0] as Vec3, order: 0, motion: 'up' as const },
    mass: 33,
    internal: true,
  })),
];

export const desertEagle: FirearmDefinition = {
  id: 'desert_eagle',
  name: 'Desert Eagle Mark XIX',
  shortName: 'Desert Eagle',
  spec: {
    manufacturer: 'Magnum Research, Inc. (design by Israel Military Industries)',
    designation: 'Desert Eagle Mark XIX, .50 AE',
    origin: 'United States / Israel',
    designed: { value: 1983, confidence: 'published', note: 'Mark I 1983; Mark XIX 1996' },
    category: 'handgun',
    categoryLabel: 'Gas-operated pistol',
    cartridge: '.50 Action Express (12.7×33 mmRB)',
    action: 'gas-operated-rotating-bolt',
    actionLabel: 'Gas-operated, rotating bolt',
    feed: 'box-magazine',
    capacity: { value: '7-round detachable box', confidence: 'published' },
    overallLength: { value: 273, unit: 'mm', confidence: 'published', note: '10.75 in, 6 in barrel' },
    barrelLength: { value: 152, unit: 'mm', confidence: 'published', note: '6 in' },
    mass: { value: 1998, unit: 'g', confidence: 'published', note: '4 lb 6.6 oz, unloaded with magazine' },
    muzzleVelocity: { value: 470, unit: 'm/s', confidence: 'published', note: '300 gr JHP, 6 in barrel, manufacturer / ammunition-maker figure' },
    rateOfFire: { value: 'Semi-automatic', confidence: 'published' },
    effectiveRange: { value: 200, unit: 'm', confidence: 'estimated', note: 'about 50 m with iron sights, up to about 200 m with an optic on the rail' },
    twist: { value: '1 in 19 in (483 mm), RH, polygonal', confidence: 'published' },
    sights: 'Fixed blade front and square-notch rear, both on the barrel; integral Weaver-style rail',
    identification: 'Very large, squared-off pistol whose barrel with its top rail forms the whole upper; only the lower rear block with the cocking serrations moves. The exposed hammer, triangular trigger guard and thick rubber grip are all oversize.',
    mechanism: 'Gas tapped near the muzzle drives a short-stroke piston in the frame rearward against the slide. The slide’s cam track rotates the three-lug bolt out of the barrel extension, the bolt and slide extract and eject, and two recoil springs return them. The barrel never moves, which is why both sights sit on it.',
  },
  provenance: {
    configuration: 'Desert Eagle Mark XIX, .50 AE, 6 in barrel with integral rail, black oxide finish, rubber grips, 7-round magazine',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'Magnum Research, Desert Eagle Mark XIX specification sheet and owner’s manual', covers: ['overallLength', 'barrelLength', 'height', 'width', 'mass', 'capacity', 'twist', 'fieldStrip'] },
      { label: 'SAAMI .50 Action Express cartridge and chamber drawing', covers: ['cartridge'] },
      { label: 'Ammunition manufacturer ballistics tables, .50 AE 300 gr from a 6 in barrel', covers: ['muzzleVelocity'] },
    ],
    notes: [
      'Exterior proportions follow the published dimensions; the gas piston, cylinder, bolt and recoil spring geometry are estimated from the published cutaways.',
      'The slide is modelled as a solid profile; its channels for the barrel and bolt are not cut, and the cocking serrations are not modelled.',
      'The trigger bar, sear, hammer strut and recoil spring guide rods are omitted.',
      'Composites are built from extrusions only; lathes, springs and the rail builder are used as single geometries.',
    ],
  },
  components,
  actions: {
    cycle: {
      id: 'cycle',
      label: 'Rack the slide',
      duration: 1.1,
      interruptible: false,
      steps: [
        { component: 'slide', t: [0.0, 0.45], translate: [-SLIDE_TRAVEL, 0, 0], easing: 'inOutCubic' },
        { component: 'bolt', t: [0.0, 0.12], rotate: [0.52, 0, 0], easing: 'inOutCubic' },
        { component: 'gas_piston', t: [0.0, 0.1], translate: [-18, 0, 0], easing: 'outQuad' },
        { component: 'recoil_spring_left', t: [0.0, 0.45], translate: [SLIDE_TRAVEL / 2, 0, 0], easing: 'inOutCubic' },
        { component: 'recoil_spring_right', t: [0.0, 0.45], translate: [SLIDE_TRAVEL / 2, 0, 0], easing: 'inOutCubic' },
        { component: 'hammer', t: [0.08, 0.32], rotate: [0, 0, 0], easing: 'outQuad' },
        { component: 'gas_piston', t: [0.3, 0.45], reset: true, easing: 'springReturn' },
        { component: 'slide', t: [0.55, 0.8], reset: true, easing: 'springReturn' },
        { component: 'recoil_spring_left', t: [0.55, 0.8], reset: true, easing: 'springReturn' },
        { component: 'recoil_spring_right', t: [0.55, 0.8], reset: true, easing: 'springReturn' },
        { component: 'bolt', t: [0.72, 0.82], reset: true, easing: 'mechanicalSnap' },
      ],
      audio: [
        { event: 'charge_pull', at: 0.0, component: 'slide', caption: 'Slide drawn rearward; bolt rotates out of the barrel extension' },
        { event: 'casing_eject', at: 0.4, component: 'bolt_extractor', caption: 'Case ejected to the right' },
        { event: 'bolt_release', at: 0.55, component: 'slide', caption: 'Slide released' },
        { event: 'bolt_battery', at: 0.82, component: 'bolt', caption: 'Bolt lugs rotate into lock' },
      ],
    },
    dryFire: {
      id: 'dryFire',
      label: 'Dry fire',
      duration: 0.7,
      steps: [
        { component: 'trigger', t: [0.0, 0.18], rotate: [0, 0, -0.2], easing: 'inQuad' },
        { component: 'hammer', t: [0.18, 0.24], rotate: [0, 0, -0.95], easing: 'mechanicalSnap' },
        { component: 'firing_pin', t: [0.23, 0.26], translate: [3, 0, 0], easing: 'mechanicalSnap' },
        { component: 'firing_pin', t: [0.3, 0.4], reset: true, easing: 'springReturn' },
        { component: 'trigger', t: [0.45, 0.62], reset: true, easing: 'outQuad' },
      ],
      audio: [
        { event: 'trigger_break', at: 0.18, component: 'trigger', caption: 'Sear releases the hammer' },
        { event: 'hammer_fall', at: 0.24, component: 'hammer', caption: 'Hammer falls on the firing pin' },
        { event: 'trigger_reset', at: 0.6, component: 'trigger', caption: 'Trigger resets' },
      ],
    },
    reload: {
      id: 'reload',
      label: 'Magazine change',
      duration: 1.6,
      steps: [
        { component: 'mag_catch', t: [0.0, 0.08], translate: [0, 0, 3], easing: 'outQuad' },
        { component: 'magazine', t: [0.06, 0.42], translate: [0, -150, 0], rotate: [0, 0, 0.04], easing: 'outQuad' },
        { component: 'mag_catch', t: [0.3, 0.4], reset: true, easing: 'outQuad' },
        { component: 'magazine', t: [0.9, 1.12], reset: true, easing: 'mechanicalSnap' },
      ],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pressed' },
        { event: 'mag_out', at: 0.1, component: 'magazine', caption: 'Magazine drops free' },
        { event: 'mag_seat', at: 1.1, component: 'magazine', caption: 'Magazine seats and locks' },
      ],
    },
    safety: {
      id: 'safety',
      label: 'Safety',
      duration: 0.35,
      steps: [{ component: 'ambi_safety', t: [0.0, 0.22], rotate: [0, 0, -0.6], easing: 'detent' }],
      audio: [{ event: 'selector', at: 0.2, component: 'ambi_safety', caption: 'Safety swept up to FIRE' }],
    },
  },
  acoustic: {
    mass: 1998,
    receiver: 'steel-forged',
    action: 'gas-operated-rotating-bolt',
    reciprocatingMass: 560,
    spring: { frequency: 24, damping: 0.3 },
    furniture: 'polymer',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'In battery',
      description: 'Fully assembled, bolt locked into the barrel extension, hammer cocked, magazine seated.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Magazine withdrawn',
      description: 'The heavy single-column magazine drops from the grip once the catch is released; the chamber is checked before anything else moves.',
      camera: 'side',
      focus: ['magazine', 'mag_catch', 'frame'],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pressed' },
        { event: 'mag_out', at: 0.15, component: 'magazine', caption: 'Magazine withdrawn' },
      ],
    },
    {
      stage: 2,
      title: 'Barrel and slide off the frame',
      description: 'A quarter turn of the barrel latch frees the barrel; it and the slide lift off the frame together, and the barrel then slides forward out of the slide. Swapping barrels for another calibre starts the same way.',
      camera: 'side-left',
      focus: ['barrel_latch', 'barrel', 'slide', 'frame'],
      audio: [
        { event: 'selector', at: 0.0, component: 'barrel_latch', caption: 'Barrel latch turned' },
        { event: 'receiver_split', at: 0.3, component: 'slide', caption: 'Barrel and slide lift off the frame' },
        { event: 'component_out', at: 0.6, component: 'barrel', caption: 'Barrel separates from the slide' },
      ],
    },
    {
      stage: 3,
      title: 'Bolt and recoil springs out',
      description: 'The two recoil springs on their guide rods come rearward out of the slide, and the bolt is pushed forward out of the front. This is the extent of the field strip.',
      camera: 'iso',
      focus: ['bolt', 'recoil_spring_left', 'recoil_spring_right', 'slide'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'recoil_spring_left', caption: 'Recoil springs withdrawn' },
        { event: 'component_out', at: 0.35, component: 'bolt', caption: 'Bolt out of the slide' },
      ],
    },
    {
      stage: 4,
      title: 'Bolt detail',
      description: 'Beyond the field strip: the extractor lifts out of the bolt head, and the firing pin and its spring come out of the rear of the bolt, exposing the three locking lugs.',
      camera: 'detail-action',
      focus: ['bolt', 'bolt_lugs', 'bolt_extractor', 'firing_pin', 'firing_pin_spring'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'bolt_extractor', caption: 'Extractor out' },
        { event: 'component_out', at: 0.25, component: 'firing_pin', caption: 'Firing pin withdrawn' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis: gas cylinder and piston forward out of the frame, hammer and safety out of the rear, grips and controls sideways, magazine internals up.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 273 mm', from: [HAMMER_TIP, -152, 0], to: [MUZZLE + 1.5, -152, 0] },
      { label: 'Barrel 152 mm', from: [0, 36, 0], to: [MUZZLE, 36, 0] },
    ],
  },
  cartridge: { caseDiameter: 13.9, caseLength: 32.6, bulletDiameter: 12.7, bulletLength: 23, rimDiameter: 12.9, label: '.50 Action Express' },
  ejection: { position: [2, 4, 14], direction: [0.2, 0.5, 1] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default desertEagle;
