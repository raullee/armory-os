import type { ComponentDef, FirearmDefinition, Vec2, Vec3 } from '@/firearm/schema';

/**
 * Glock 19 Gen5, 9×19 mm.
 *
 * Frame: bore axis y=0, breech face (slide breech block face in battery) at x=0,
 * +x toward the muzzle, +z shooter's right. All dimensions mm.
 *
 * Published dimensions (Glock Gen5 technical data sheet): overall 187 mm,
 * barrel 102 mm, height 128 mm incl. magazine, width 34 mm, mass 600 g without
 * magazine / 670 g with an empty magazine. The exterior silhouette follows the
 * data sheet; the striker, trigger bar and connector layout is estimated from
 * the Safe Action pattern and marked as such.
 */

// ---- layout constants (mm) --------------------------------------------------
const MUZZLE = 102;
const SLIDE_REAR = -72;
const SLIDE_FRONT = 101.5; // barrel recessed 1 mm behind the slide face
const SLIDE_TOP = 11;
const SLIDE_BOTTOM = -15; // frame rail plane
const BEAVERTAIL = -84;
const SLIDE_TRAVEL = 45;
const STRIKER_FALL = 6;

/**
 * Geometry note: composites are built only from extrusions (a box is an extruded
 * rectangle, a shaft an extruded polygon). Lathes and rails are used on their own.
 */
const rect = (w: number, h: number): Vec2[] => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
const ngon = (r: number, n = 20): Vec2[] => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r] as Vec2);

const frameProfile: Vec2[] = [
  [BEAVERTAIL, -16], // beavertail tang tip
  [-74, SLIDE_BOTTOM], // rear of the frame rails
  [71, SLIDE_BOTTOM], // dust cover, top front
  [71, -30], // dust cover front face
  [20, -31], // dust cover underside to the trigger guard
  [18, -50], // trigger guard, front
  [-24, -52], // trigger guard, rear
  [-28, -56], // front strap top
  [-38, -108], // front strap bottom
  [-85, -108], // grip bottom rear
  [-70, -28], // back strap top, under the tang
  [BEAVERTAIL, -21], // tang underside
];

const triggerOpening: Vec2[] = [
  [14, -33],
  [14, -46],
  [-22, -48],
  [-24, -33],
];

const gripBlock: Vec2[] = [
  [-34, -30],
  [-29, -57],
  [-39, -108],
  [-84, -108],
  [-70, -29],
];

const slideProfile: Vec2[] = [
  [SLIDE_REAR, SLIDE_BOTTOM],
  [SLIDE_FRONT, SLIDE_BOTTOM],
  [SLIDE_FRONT, 6],
  [97.5, SLIDE_TOP], // chamfered nose
  [-68, SLIDE_TOP],
  [SLIDE_REAR, 4],
];

/** Trigger shoe, drawn about its pivot (top). */
const triggerProfile: Vec2[] = [
  [-2, 2],
  [3, 2],
  [4, -4],
  [4.5, -9],
  [3.5, -13.5],
  [1, -16],
  [-2.5, -15],
  [-3, -11],
  [-2.5, -6],
];

const slideStopProfile: Vec2[] = [
  [0, 0],
  [14, 0],
  [26, -3],
  [26, -8],
  [12, -8],
  [0, -6],
];

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver
  {
    id: 'frame',
    name: 'Frame, Gen5',
    group: 'receiver',
    material: 'polymer-black',
    materialLabel: 'Glass-reinforced nylon polymer with four steel rail inserts',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: frameProfile, depth: 26, bevel: 1.2, holes: [triggerOpening] } },
        // grip is wider than the rail section; Gen5 has no finger grooves
        { geometry: { kind: 'extrude', shape: gripBlock, depth: 28, bevel: 2.5, curveSegments: 6 } },
        // Gen5 flared magazine well
        { geometry: { kind: 'extrude', shape: rect(50, 4), depth: 33, bevel: 1 }, position: [-61, -110, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Polymer receiver carrying the steel slide rails, the trigger mechanism housing, the locking block and the magazine well; the beavertail and the flared magazine well identify the Gen5.',
    notes: ['Front and rear steel rail inserts moulded into the polymer', 'No finger grooves on Gen5; ambidextrous slide stop'],
    confidence: 'published',
    adjacent: ['slide', 'locking_block', 'trigger', 'trigger_housing', 'magazine', 'slide_lock'],
    mass: 150,
    thermal: 0.1,
  },
  {
    id: 'accessory_rail',
    name: 'Accessory rail',
    group: 'accessory',
    material: 'polymer-black',
    geometry: { kind: 'rail', length: 28, width: 21, height: 4, slotPitch: 10.01 },
    position: [50, -30, 0],
    rotation: [Math.PI, 0, 0],
    parent: 'frame',
    function: 'Moulded rail under the dust cover for a light or laser; Glock pattern, close to but not identical with MIL-STD-1913.',
    confidence: 'published',
    adjacent: ['frame'],
    mass: 5,
  },
  {
    id: 'locking_block',
    name: 'Locking block',
    group: 'receiver',
    material: 'nitride-steel',
    materialLabel: 'Steel, phosphate finish',
    geometry: { kind: 'box', size: [18, 14, 22], radius: 1.5 },
    position: [14, -23, 0],
    function: 'Steel insert in the frame whose ramp cams the barrel lug down to unlock as the slide moves rearward.',
    confidence: 'estimated',
    adjacent: ['frame', 'barrel', 'locking_block_pin', 'recoil_guide_rod'],
    strip: { stage: 5, offset: [0, 40, 0], order: 1, motion: 'up' },
    mass: 18,
    thermal: 0.3,
    internal: true,
  },
  {
    id: 'locking_block_pin',
    name: 'Locking block pin',
    group: 'receiver',
    material: 'nitride-steel',
    geometry: { kind: 'cylinder', radius: 2, length: 28, axis: 'z' },
    position: [14, -24, 0],
    function: 'Cross pin retaining the locking block in the frame; the upper of the two Gen5 frame pins.',
    confidence: 'published',
    adjacent: ['frame', 'locking_block'],
    strip: { stage: 5, offset: [0, 0, 40], order: 0, motion: 'right' },
    mass: 2,
  },
  {
    id: 'trigger_pin',
    name: 'Trigger pin',
    group: 'receiver',
    material: 'nitride-steel',
    geometry: { kind: 'cylinder', radius: 2, length: 28, axis: 'z' },
    position: [-6, -30, 0],
    function: 'Cross pin on which the trigger pivots and which locates the slide stop lever.',
    confidence: 'published',
    adjacent: ['frame', 'trigger', 'slide_stop'],
    strip: { stage: 5, offset: [0, 0, -40], order: 0, motion: 'left' },
    mass: 2,
  },

  // ------------------------------------------------------------ slide
  {
    id: 'slide',
    name: 'Slide',
    group: 'action',
    material: 'nitride-steel',
    materialLabel: 'Steel, nDLC (diamond-like carbon) finish',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: slideProfile, depth: 25.4, bevel: 1.5 } },
        // rear cocking serrations (five) and Gen5 front serrations (four)
        ...Array.from({ length: 5 }, (_, i) => ({ geometry: { kind: 'extrude' as const, shape: rect(1.6, 17), depth: 26.6 }, position: [-62 + i * 5, -3, 0] as Vec3 })),
        ...Array.from({ length: 4 }, (_, i) => ({ geometry: { kind: 'extrude' as const, shape: rect(1.6, 15), depth: 26.6 }, position: [70 + i * 5, -4, 0] as Vec3 })),
        // breech block face behind the chamber
        { geometry: { kind: 'extrude', shape: rect(6, 18), depth: 18 }, position: [-3, -2, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Reciprocates on the frame rails; carries the striker, extractor and sights, and cams the barrel down out of lock-up on recoil.',
    notes: ['Slide travel about 45 mm', 'Front serrations introduced on Gen5'],
    confidence: 'published',
    adjacent: ['frame', 'barrel', 'striker', 'extractor', 'recoil_guide_rod', 'slide_lock'],
    strip: { stage: 2, offset: [SLIDE_TRAVEL, 55, 0], order: 1, motion: 'forward' },
    mass: 340,
    thermal: 0.35,
  },
  {
    id: 'slide_cover_plate',
    name: 'Slide cover plate',
    group: 'action',
    material: 'polymer-black',
    geometry: { kind: 'box', size: [3, 22, 24], radius: 0.8 },
    position: [-73.5, -2, 0],
    parent: 'slide',
    function: 'Polymer plate closing the rear of the slide; it slides down off its rails to release the striker assembly.',
    confidence: 'published',
    adjacent: ['slide', 'striker_spring', 'spring_cups'],
    strip: { stage: 4, offset: [0, -32, 0], order: 0, motion: 'down' },
    mass: 4,
  },
  {
    id: 'striker',
    name: 'Striker (firing pin)',
    group: 'action',
    material: 'stainless-steel',
    materialLabel: 'Steel firing pin with lug and polymer spacer sleeve',
    geometry: {
      kind: 'lathe',
      profile: [[0, 0], [2.6, 0], [2.6, 8], [4, 10], [4, 30], [2.2, 32], [2.2, 58], [1.2, 60], [1.2, 62], [0, 62]],
      segments: 20,
    },
    position: [-66, 0, 0],
    parent: 'slide',
    function: 'Partially cocked by the slide, fully cocked by the trigger bar and released to fly forward and strike the primer; there is no hammer.',
    notes: ['Rests at partial cock; the trigger pull completes cocking'],
    confidence: 'estimated',
    adjacent: ['slide', 'striker_spring', 'spring_cups', 'trigger_bar', 'fp_safety_plunger'],
    strip: { stage: 4, offset: [-72, 0, 0], order: 3, motion: 'rear' },
    mass: 12,
    internal: true,
  },
  {
    id: 'striker_spring',
    name: 'Striker spring',
    group: 'action',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 3.4, length: 30, turns: 12, wire: 0.8 },
    position: [-45, 0, 0],
    parent: 'slide',
    function: 'Compressed around the striker shank between the spring cups and the rear of the slide channel; drives the striker forward on release.',
    confidence: 'estimated',
    adjacent: ['striker', 'spring_cups', 'slide_cover_plate'],
    strip: { stage: 4, offset: [-40, -16, 0], order: 2, motion: 'rear' },
    mass: 3,
    internal: true,
  },
  {
    id: 'spring_cups',
    name: 'Spring cups',
    group: 'action',
    material: 'polymer-black',
    geometry: { kind: 'cylinder', radius: 3.9, length: 4 },
    position: [-30, 0, 0],
    parent: 'slide',
    function: 'Two polymer half-cups clipped into the striker neck; the spring bears on them.',
    confidence: 'published',
    adjacent: ['striker', 'striker_spring'],
    strip: { stage: 4, offset: [-14, -12, 0], order: 1, motion: 'rear' },
    mass: 1,
    internal: true,
  },
  {
    id: 'extractor',
    name: 'Extractor',
    group: 'action',
    material: 'nitride-steel',
    geometry: { kind: 'box', size: [22, 6, 3], radius: 0.8 },
    position: [8, 3, 12.5],
    parent: 'slide',
    function: 'Spring-loaded claw on the right of the breech face that holds the case rim and pulls the fired case from the chamber; also the loaded-chamber indicator.',
    confidence: 'published',
    adjacent: ['slide', 'barrel'],
    strip: { stage: 4, offset: [0, 0, 30], order: 1, motion: 'right' },
    mass: 6,
  },
  {
    id: 'fp_safety_plunger',
    name: 'Firing pin safety plunger',
    group: 'action',
    material: 'stainless-steel',
    geometry: { kind: 'cylinder', radius: 2.2, length: 9, axis: 'y' },
    position: [-16, -5, 0],
    parent: 'slide',
    function: 'Spring-loaded plunger that blocks the striker channel until the trigger bar lifts it during the final part of the trigger pull.',
    confidence: 'published',
    adjacent: ['slide', 'striker', 'trigger_bar'],
    strip: { stage: 4, offset: [0, -26, 0], order: 2, motion: 'down' },
    mass: 1,
    internal: true,
  },

  // ------------------------------------------------------------ barrel / recoil
  {
    id: 'barrel',
    name: 'Barrel, 102 mm',
    group: 'barrel',
    material: 'nitride-steel',
    materialLabel: 'Glock Marksman Barrel, hammer-forged steel, polygonal rifling, nDLC finish',
    geometry: {
      kind: 'lathe',
      profile: [[0, 0], [7.6, 0], [7.6, 30], [6.3, 33], [6.3, MUZZLE - 1], [5.6, MUZZLE], [4.5, MUZZLE], [0, MUZZLE]],
      segments: 40,
    },
    position: [0, 0, 0],
    pivot: [10, -12, 0],
    parent: 'slide',
    function: 'Locks into the slide by its rectangular hood; after about 3 mm of recoil the lug rides down the locking block ramp, tilting the breech end down to unlock.',
    notes: ['Length 102 mm measured from the breech face', 'Right-hand hexagonal polygonal rifling, 1 in 250 mm', 'Travels with the slide in the model so the field strip choreography reads correctly'],
    confidence: 'published',
    adjacent: ['slide', 'locking_block', 'recoil_guide_rod', 'extractor'],
    strip: { stage: 3, offset: [0, -35, 0], order: 1, motion: 'down' },
    mass: 105,
    thermal: 0.7,
  },
  {
    id: 'barrel_lugs',
    name: 'Barrel hood and locking lug',
    group: 'barrel',
    material: 'nitride-steel',
    geometry: {
      kind: 'composite',
      parts: [
        // hood: rises into the ejection port and locks against the slide
        { geometry: { kind: 'extrude', shape: rect(22, 5), depth: 14, bevel: 0.8 }, position: [11, 9, 0] },
        // locking lug under the chamber with its cam surface
        { geometry: { kind: 'extrude', shape: rect(16, 9), depth: 12, bevel: 1 }, position: [12, -11, 0] },
      ],
    },
    // child of the barrel: positions are relative to the barrel's pivot at the lug
    position: [-10, 12, 0],
    parent: 'barrel',
    function: 'The rectangular hood locks the barrel into the slide; the lug beneath the chamber rides the locking block ramp to unlock it. Integral with the barrel.',
    confidence: 'estimated',
    adjacent: ['barrel', 'slide', 'locking_block'],
    mass: 0,
    thermal: 0.6,
  },
  {
    id: 'recoil_guide_rod',
    name: 'Recoil spring guide rod',
    group: 'action',
    material: 'stainless-steel',
    materialLabel: 'Steel rod with polymer front flange (captive dual-spring assembly)',
    geometry: {
      kind: 'lathe',
      profile: [[0, 0], [4.6, 0], [4.6, 5], [2.6, 6], [2.6, 64], [3.6, 65], [3.6, 68], [0, 68]],
      segments: 20,
    },
    position: [8, -10.5, 0],
    parent: 'slide',
    function: 'Seats against the barrel lug and the front of the slide; guides the captive dual recoil spring so it cannot kink under compression.',
    confidence: 'estimated',
    adjacent: ['recoil_spring', 'barrel', 'slide', 'locking_block'],
    strip: { stage: 3, offset: [55, -30, 0], order: 0, motion: 'forward' },
    mass: 22,
    thermal: 0.3,
    internal: true,
  },
  {
    id: 'recoil_spring',
    name: 'Recoil spring, dual',
    group: 'action',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 4.1, length: 54, turns: 16, wire: 1.0 },
    position: [40, -10.5, 0],
    parent: 'slide',
    function: 'Outer of the two nested springs; compressed by the slide on recoil, it returns the slide and strips the next round from the magazine.',
    confidence: 'estimated',
    adjacent: ['recoil_guide_rod', 'slide'],
    strip: { stage: 3, offset: [55, -30, 0], order: 0, motion: 'forward' },
    mass: 12,
    internal: true,
  },

  // ------------------------------------------------------------ fire control
  {
    id: 'trigger',
    name: 'Trigger',
    group: 'fire-control',
    material: 'polymer-black',
    materialLabel: 'Polymer trigger shoe on a steel trigger bar',
    geometry: { kind: 'extrude', shape: triggerProfile, depth: 8, bevel: 0.8 },
    position: [-6, -30, 0],
    pivot: [0, 0, 0],
    function: 'Pivots on the trigger pin and draws the trigger bar rearward; about 12 mm of travel to the break.',
    notes: ['Pull weight about 2.6 kgf (published, Gen5 standard)'],
    confidence: 'estimated',
    adjacent: ['trigger_safety', 'trigger_bar', 'trigger_pin', 'frame'],
    strip: { stage: 5, offset: [0, 0, -40], order: 2, motion: 'left' },
    mass: 6,
  },
  {
    id: 'trigger_safety',
    name: 'Trigger safety blade',
    group: 'fire-control',
    material: 'polymer-black',
    geometry: { kind: 'box', size: [1.6, 10, 3], radius: 0.4 },
    position: [5, -5.5, 0],
    pivot: [0, 5, 0],
    parent: 'trigger',
    function: 'Lever set into the trigger face; unless it is depressed it blocks the trigger from moving rearward.',
    confidence: 'published',
    adjacent: ['trigger'],
    strip: { stage: 5, offset: [10, 0, 0], order: 3, motion: 'forward' },
    mass: 1,
  },
  {
    id: 'trigger_bar',
    name: 'Trigger bar',
    group: 'fire-control',
    material: 'nitride-steel',
    geometry: { kind: 'tube', path: [[-4, -26, 12], [-28, -22, 12], [-56, -22, 12], [-66, -20, 11]], radius: 1.6, segments: 18 },
    position: [0, 0, 0],
    function: 'Steel bar joining the trigger to the striker lug; its cruciform rear engages the connector and its upward lobe lifts the firing pin safety.',
    confidence: 'estimated',
    adjacent: ['trigger', 'connector', 'striker', 'fp_safety_plunger'],
    strip: { stage: 5, offset: [0, 0, 40], order: 2, motion: 'right' },
    mass: 10,
    internal: true,
  },
  {
    id: 'connector',
    name: 'Connector',
    group: 'fire-control',
    material: 'nitride-steel',
    geometry: { kind: 'box', size: [12, 9, 1.5] },
    position: [-70.5, -38, 7.5],
    function: 'Angled steel plate in the trigger housing; its ramp forces the trigger bar down off the striker lug to release the striker, and sets the pull weight.',
    confidence: 'estimated',
    adjacent: ['trigger_bar', 'trigger_housing'],
    strip: { stage: 5, offset: [0, 0, 45], order: 3, motion: 'right' },
    mass: 3,
    internal: true,
  },
  {
    id: 'trigger_housing',
    name: 'Trigger mechanism housing with ejector',
    group: 'fire-control',
    material: 'polymer-black',
    materialLabel: 'Polymer housing with steel ejector and connector',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: rect(7, 34), depth: 12, bevel: 1 }, position: [0, 0, 0] },
        // ejector blade, left of the breech
        { geometry: { kind: 'extrude', shape: rect(22, 4), depth: 2 }, position: [12, 14, -5] },
      ],
    },
    position: [-70.5, -40, 0],
    function: 'Sits at the rear of the grip behind the magazine; carries the connector, the trigger spring and the ejector blade that kicks the case out of the port.',
    confidence: 'estimated',
    adjacent: ['frame', 'connector', 'trigger_bar', 'magazine'],
    strip: { stage: 5, offset: [0, 50, 0], order: 3, motion: 'up' },
    mass: 12,
    internal: true,
  },
  {
    id: 'slide_lock',
    name: 'Slide lock (takedown lever)',
    group: 'fire-control',
    material: 'nitride-steel',
    geometry: { kind: 'box', size: [4, 6, 34], radius: 1 },
    position: [-2, -22, 0],
    function: 'Spring-loaded bar spanning the frame above the trigger; pulled down on both sides it releases the slide to run forward off the frame.',
    confidence: 'published',
    adjacent: ['frame', 'slide', 'locking_block'],
    strip: { stage: 2, offset: [0, -5, 0], order: 0, motion: 'down' },
    mass: 4,
  },
  {
    id: 'slide_stop',
    name: 'Slide stop lever',
    group: 'fire-control',
    material: 'nitride-steel',
    geometry: { kind: 'extrude', shape: slideStopProfile, depth: 2.5 },
    position: [-30, -16, -14.5],
    function: 'Lifted by the follower on an empty magazine to hold the slide open; pressed down, or the slide drawn back, to release it.',
    notes: ['Ambidextrous on Gen5; the right-hand lever is omitted for clarity'],
    confidence: 'estimated',
    adjacent: ['frame', 'slide', 'trigger_pin', 'follower'],
    strip: { stage: 5, offset: [0, 0, -45], order: 1, motion: 'left' },
    mass: 5,
  },
  {
    id: 'mag_catch',
    name: 'Magazine catch',
    group: 'fire-control',
    material: 'polymer-black',
    geometry: { kind: 'box', size: [9, 11, 5], radius: 1.2 },
    position: [-42, -46, -15.5],
    function: 'Reversible button behind the trigger guard; pressing it withdraws the catch from the magazine notch.',
    confidence: 'published',
    adjacent: ['frame', 'magazine'],
    strip: { stage: 5, offset: [0, 0, -45], order: 2, motion: 'left' },
    mass: 3,
  },

  // ------------------------------------------------------------ sights
  {
    id: 'front_sight',
    name: 'Front sight',
    group: 'sights',
    material: 'polymer-black',
    materialLabel: 'Polymer post with white dot (standard) ',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: rect(4.5, 5), depth: 5 }, position: [0, 0, 0] },
        { geometry: { kind: 'extrude', shape: ngon(1.2, 12), depth: 0.6, axis: 'x' }, position: [-2.5, 0.8, 0] },
      ],
    },
    position: [90, SLIDE_TOP + 2.5, 0],
    parent: 'slide',
    function: 'Fixed post retained by a nut from inside the slide.',
    confidence: 'published',
    adjacent: ['slide'],
    strip: { stage: 5, offset: [0, 30, 0], order: 0, motion: 'up' },
    mass: 2,
  },
  {
    id: 'rear_sight',
    name: 'Rear sight',
    group: 'sights',
    material: 'polymer-black',
    materialLabel: 'Polymer with white outline (standard)',
    geometry: { kind: 'box', size: [12, 5.5, 20], radius: 0.8 },
    position: [-58, SLIDE_TOP + 2.7, 0],
    parent: 'slide',
    function: 'Dovetailed notch sight; drifts sideways in its dovetail for windage.',
    confidence: 'published',
    adjacent: ['slide'],
    strip: { stage: 5, offset: [0, 0, -40], order: 0, motion: 'left' },
    mass: 4,
  },

  // ------------------------------------------------------------ feed
  {
    id: 'magazine',
    name: 'Magazine, 15-round',
    group: 'feed',
    material: 'polymer-black',
    materialLabel: 'Steel-lined polymer body, orange Gen5 follower',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: [[-26, -18], [-60, -18], [-77, -108], [-43, -108]], depth: 22, bevel: 1.5 } },
        // Gen5 extended floor plate
        { geometry: { kind: 'extrude', shape: rect(40, 4), depth: 25, bevel: 0.8 }, position: [-60, -110.5, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Double-column, single-feed box magazine following the grip angle; the notch on the front wall engages the reversible catch.',
    notes: ['15 rounds 9×19 mm', 'Height about 106 mm'],
    confidence: 'published',
    adjacent: ['frame', 'mag_catch', 'follower', 'slide_stop', 'trigger_housing'],
    strip: { stage: 1, offset: [0, -140, 0], rotate: [0, 0, 0.04], motion: 'down' },
    mass: 70,
  },
  {
    id: 'follower',
    name: 'Follower',
    group: 'feed',
    material: 'polymer-fde',
    materialLabel: 'Orange polymer (Gen5)',
    geometry: { kind: 'box', size: [30, 6, 18], radius: 1.5 },
    position: [-50, -54, 0],
    parent: 'magazine',
    function: 'Lifts the cartridge stack into the feed lips and, on the last round, raises the slide stop lever.',
    confidence: 'estimated',
    adjacent: ['magazine', 'magazine_spring', 'slide_stop'],
    strip: { stage: 5, offset: [0, 40, 0], order: 1, motion: 'up' },
    mass: 4,
    internal: true,
  },
  {
    id: 'magazine_spring',
    name: 'Magazine spring',
    group: 'feed',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 7, length: 46, turns: 7, wire: 1.0, axis: 'y' },
    position: [-55, -83, 0],
    parent: 'magazine',
    function: 'Provides the lift that feeds the last round as reliably as the first.',
    confidence: 'estimated',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, -70, 0], order: 2, motion: 'down' },
    mass: 6,
    internal: true,
  },
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `round_${i + 1}`,
    name: `Cartridge, 9×19 mm Parabellum (${i + 1})`,
    group: 'ammunition' as const,
    material: 'brass' as const,
    geometry: { kind: 'cartridge' as const, caseDiameter: 9.93, caseLength: 19.15, bulletDiameter: 9.01, bulletLength: 15.5, rimDiameter: 9.96, shoulder: 0.9 },
    position: [-58 - i * 1.9, -24 - i * 10, i % 2 === 0 ? 3.2 : -3.2] as Vec3,
    parent: 'magazine',
    function: 'Staggered in the magazine; the top round is stripped forward into the chamber by the slide breech face on each cycle.',
    confidence: 'published' as const,
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5 as const, offset: [0, 36 + i * 12, 0] as Vec3, order: 3, motion: 'up' as const },
    mass: 12,
    internal: true,
  })),
];

export const glock19: FirearmDefinition = {
  id: 'glock19',
  name: 'Glock 19 Gen5',
  shortName: 'G19',
  spec: {
    manufacturer: 'Glock Ges.m.b.H., Deutsch-Wagram',
    designation: 'Glock 19 Gen5',
    origin: 'Austria',
    designed: { value: 1988, confidence: 'published', note: 'Glock 19 introduced 1988; Gen5 revision 2017' },
    category: 'handgun',
    categoryLabel: 'Semi-automatic pistol',
    cartridge: '9×19 mm Parabellum',
    action: 'short-recoil-tilting-barrel',
    actionLabel: 'Short recoil, tilting barrel, striker-fired (Safe Action)',
    feed: 'box-magazine',
    capacity: { value: '15-round detachable box (standard)', confidence: 'published' },
    overallLength: { value: 187, unit: 'mm', confidence: 'published' },
    barrelLength: { value: 102, unit: 'mm', confidence: 'published' },
    mass: { value: 670, unit: 'g', confidence: 'published', note: 'with empty magazine; 600 g without magazine' },
    muzzleVelocity: { value: 375, unit: 'm/s', confidence: 'published', note: '124 gr (8 g) FMJ, Glock technical data' },
    rateOfFire: { value: 'Semi-automatic', confidence: 'published' },
    effectiveRange: { value: 50, unit: 'm', confidence: 'estimated', note: 'typical service-pistol figure; not stated by the manufacturer' },
    twist: { value: '1 in 250 mm (9.84 in), RH, hexagonal polygonal', confidence: 'published' },
    sights: 'Fixed polymer white-dot front and white-outline rear, dovetailed',
    identification: 'Compact polymer-framed pistol with a squared-off slide, no external hammer and no manual safety lever. The Gen5 has no finger grooves, a flared magazine well, front slide serrations and an ambidextrous slide stop.',
    mechanism: 'Browning-type short recoil. Barrel and slide recoil together for about 3 mm, then the barrel lug rides down the locking block ramp, unlocking the hood from the ejection port. The trigger pull completes the cocking of the partially tensioned striker and lifts the firing pin safety before the connector drops the trigger bar to release it.',
  },
  provenance: {
    configuration: 'Glock 19 Gen5, 102 mm Glock Marksman Barrel, nDLC slide and barrel, standard polymer sights, 15-round magazine',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'Glock Ges.m.b.H., Glock 19 Gen5 technical data sheet', covers: ['overallLength', 'barrelLength', 'mass', 'capacity', 'muzzleVelocity', 'twist', 'height', 'width'] },
      { label: 'Glock Safe Action pistol armorer’s manual (component nomenclature and disassembly order)', covers: ['components', 'fieldStrip'] },
      { label: 'C.I.P. TDCC, 9 mm Luger cartridge dimensions', covers: ['cartridge'] },
    ],
    notes: [
      'Exterior proportions follow the published dimensions; the trigger bar, connector and striker geometry are estimated from the Safe Action pattern.',
      'The barrel and recoil spring assembly are modelled as children of the slide so that they travel with it when the slide leaves the frame.',
      'The ejection port cut and the right-hand slide stop lever are omitted.',
      'Composites are built from extrusions only; lathes and the rail builder are used as single geometries.',
    ],
  },
  components,
  actions: {
    cycle: {
      id: 'cycle',
      label: 'Rack the slide',
      duration: 1.0,
      interruptible: false,
      steps: [
        { component: 'slide', t: [0.0, 0.4], translate: [-SLIDE_TRAVEL, 0, 0], easing: 'inOutCubic' },
        // barrel is a child of the slide: +42 relative = 3 mm rearward in the frame, then it tilts about the lug
        { component: 'barrel', t: [0.0, 0.4], translate: [SLIDE_TRAVEL - 3, 0, 0], rotate: [0, 0, 0.05], easing: 'inOutCubic' },
        { component: 'recoil_guide_rod', t: [0.0, 0.4], translate: [SLIDE_TRAVEL, 0, 0], easing: 'inOutCubic' },
        { component: 'recoil_spring', t: [0.0, 0.4], translate: [SLIDE_TRAVEL / 2, 0, 0], easing: 'inOutCubic' },
        { component: 'striker', t: [0.05, 0.3], translate: [-2, 0, 0], easing: 'outQuad' },
        { component: 'slide', t: [0.5, 0.72], reset: true, easing: 'springReturn' },
        { component: 'barrel', t: [0.5, 0.72], reset: true, easing: 'springReturn' },
        { component: 'recoil_guide_rod', t: [0.5, 0.72], reset: true, easing: 'springReturn' },
        { component: 'recoil_spring', t: [0.5, 0.72], reset: true, easing: 'springReturn' },
        { component: 'striker', t: [0.5, 0.72], reset: true, easing: 'springReturn' },
      ],
      audio: [
        { event: 'charge_pull', at: 0.0, component: 'slide', caption: 'Slide drawn rearward; barrel unlocks and drops' },
        { event: 'casing_eject', at: 0.36, component: 'extractor', caption: 'Case ejected to the right' },
        { event: 'bolt_release', at: 0.5, component: 'slide', caption: 'Slide released' },
        { event: 'bolt_battery', at: 0.72, component: 'barrel', caption: 'Barrel hood locks into the slide' },
      ],
    },
    dryFire: {
      id: 'dryFire',
      label: 'Dry fire',
      duration: 0.65,
      steps: [
        { component: 'trigger_safety', t: [0.0, 0.07], rotate: [0, 0, -0.3], easing: 'outQuad' },
        { component: 'trigger', t: [0.03, 0.2], rotate: [0, 0, -0.17], easing: 'inQuad' },
        { component: 'fp_safety_plunger', t: [0.12, 0.2], translate: [0, 2, 0], easing: 'outQuad' },
        { component: 'striker', t: [0.2, 0.245], translate: [STRIKER_FALL, 0, 0], easing: 'mechanicalSnap' },
        { component: 'trigger', t: [0.42, 0.58], reset: true, easing: 'outQuad' },
        { component: 'trigger_safety', t: [0.42, 0.58], reset: true, easing: 'outQuad' },
        { component: 'fp_safety_plunger', t: [0.42, 0.5], reset: true, easing: 'outQuad' },
        { component: 'striker', t: [0.5, 0.62], reset: true, easing: 'outQuad' },
      ],
      audio: [
        { event: 'trigger_break', at: 0.2, component: 'trigger', caption: 'Connector releases the trigger bar' },
        { event: 'striker_fall', at: 0.245, component: 'striker', caption: 'Striker falls' },
        { event: 'trigger_reset', at: 0.56, component: 'trigger', caption: 'Trigger resets' },
      ],
    },
    reload: {
      id: 'reload',
      label: 'Magazine change',
      duration: 1.5,
      steps: [
        { component: 'mag_catch', t: [0.0, 0.08], translate: [0, 0, 3], easing: 'outQuad' },
        { component: 'magazine', t: [0.06, 0.38], translate: [0, -130, 0], rotate: [0, 0, 0.05], easing: 'outQuad' },
        { component: 'mag_catch', t: [0.3, 0.4], reset: true, easing: 'outQuad' },
        { component: 'magazine', t: [0.85, 1.05], reset: true, easing: 'mechanicalSnap' },
      ],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pressed' },
        { event: 'mag_out', at: 0.1, component: 'magazine', caption: 'Magazine drops free' },
        { event: 'mag_seat', at: 1.04, component: 'magazine', caption: 'Magazine seats and locks' },
      ],
    },
  },
  acoustic: {
    mass: 670,
    receiver: 'polymer',
    action: 'short-recoil-tilting-barrel',
    reciprocatingMass: 445,
    spring: { frequency: 34, damping: 0.3 },
    furniture: 'polymer',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'In battery',
      description: 'Fully assembled, barrel hood locked into the slide, striker at partial cock, magazine seated.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Magazine withdrawn',
      description: 'The magazine drops free of the grip once the catch is released; the pistol is only clear after the chamber has been checked as well.',
      camera: 'side',
      focus: ['magazine', 'mag_catch', 'frame'],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pressed' },
        { event: 'mag_out', at: 0.15, component: 'magazine', caption: 'Magazine withdrawn' },
      ],
    },
    {
      stage: 2,
      title: 'Slide off the frame',
      description: 'With the slide lock drawn down on both sides, the whole slide assembly runs forward off the rails carrying the barrel, recoil spring and striker with it. The trigger must have been pressed first, which is why the chamber check matters.',
      camera: 'side',
      focus: ['slide', 'slide_lock', 'frame', 'barrel'],
      audio: [
        { event: 'pin_push', at: 0.0, component: 'slide_lock', caption: 'Slide lock drawn down' },
        { event: 'receiver_split', at: 0.3, component: 'slide', caption: 'Slide runs forward off the frame' },
      ],
    },
    {
      stage: 3,
      title: 'Barrel and recoil spring out',
      description: 'The captive recoil spring assembly lifts out from under the barrel, and the barrel drops out of the slide through the open underside. Four parts and no tools: this is the whole field strip.',
      camera: 'iso',
      focus: ['barrel', 'recoil_guide_rod', 'recoil_spring', 'slide'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'recoil_guide_rod', caption: 'Recoil spring assembly lifted out' },
        { event: 'component_out', at: 0.3, component: 'barrel', caption: 'Barrel withdrawn from the slide' },
      ],
    },
    {
      stage: 4,
      title: 'Striker assembly detail',
      description: 'Beyond the field strip: the slide cover plate slides down, releasing the striker, its spring and the spring cups from the rear of the slide, with the extractor and firing pin safety alongside.',
      camera: 'detail-action',
      focus: ['slide_cover_plate', 'striker', 'striker_spring', 'spring_cups', 'extractor', 'fp_safety_plunger'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'slide_cover_plate', caption: 'Cover plate slides off' },
        { event: 'component_out', at: 0.2, component: 'spring_cups', caption: 'Spring cups released' },
        { event: 'component_out', at: 0.45, component: 'striker', caption: 'Striker withdrawn' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis: frame pins and locking block, the trigger group and its housing, the sights and the magazine internals. Thirty-four parts in the complete pistol.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 187 mm', from: [-86, -128, 0], to: [103, -128, 0] },
      { label: 'Barrel 102 mm', from: [0, 30, 0], to: [MUZZLE, 30, 0] },
    ],
  },
  cartridge: { caseDiameter: 9.93, caseLength: 19.15, bulletDiameter: 9.01, bulletLength: 15.5, rimDiameter: 9.96, label: '9×19 mm Parabellum' },
  ejection: { position: [6, 8, 13], direction: [0.3, 0.6, 1] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default glock19;
