import type { ComponentDef, FirearmDefinition, Vec2, Vec3 } from '@/firearm/schema';

/**
 * Colt M1911A1, .45 ACP, WWII production pattern.
 *
 * Frame: bore axis y=0, slide breech face (in battery) at x=0, +x toward the
 * muzzle, +z shooter's right. All dimensions mm.
 *
 * Published dimensions (US Army FM 23-35, 1940; Colt Government Model data):
 * overall 219 mm (8.6 in), barrel 127 mm (5 in), height 140 mm, mass 1,105 g
 * (2 lb 7 oz) unloaded, 7-round magazine. The lock-work layout follows the
 * Browning pattern and is estimated; it is a visualisation, not a gauge.
 */

// ---- layout constants (mm) --------------------------------------------------
const MUZZLE = 127;
const SLIDE_REAR = -63;
const SLIDE_FRONT = 130;
const SLIDE_TOP = 10;
const RAIL = -18; // frame rail plane / slide underside
const TANG_TIP = -88; // grip safety tang, rearmost point
const SLIDE_TRAVEL = 48;
const SPRING_AXIS = -12.5;

/**
 * Geometry note: composites are built only from extrusions (a box is an extruded
 * rectangle, a shaft an extruded polygon). Lathes and rails are used on their own.
 */
const rect = (w: number, h: number): Vec2[] => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
const ngon = (r: number, n = 20): Vec2[] => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r] as Vec2);

const frameProfile: Vec2[] = [
  [-62, RAIL], // rear of the frame rails
  [65, RAIL], // dust cover, top front
  [65, -31], // dust cover nose
  [20, -32], // underside to the trigger guard front
  [19, -44],
  [12, -52], // rounded trigger guard
  [-8, -54],
  [-18, -51],
  [-20, -55], // front strap top
  [-30, -124], // front strap bottom
  [-74, -126], // butt, front of the mainspring housing
  [-64, -66], // mainspring housing channel
  [-60, -46], // rear of the frame under the grip safety
  [-62, -30],
];

const triggerOpening: Vec2[] = [
  [12, -35],
  [10, -45],
  [-6, -48],
  [-15, -45],
  [-16, -35],
];

const slideProfile: Vec2[] = [
  [SLIDE_REAR, RAIL],
  [SLIDE_FRONT, RAIL],
  [SLIDE_FRONT, 4],
  [126, SLIDE_TOP],
  [-60, SLIDE_TOP],
  [SLIDE_REAR, 4],
];

const mainspringHousingProfile: Vec2[] = [
  [-74, -126],
  [-88, -126],
  [-88, -110],
  [-84, -88], // arched (M1911A1 pattern)
  [-76, -70],
  [-68, -62],
  [-65, -64],
];

/** Hammer drawn in the cocked pose about its pin. */
const hammerProfile: Vec2[] = [
  [-5, -7],
  [6, -7],
  [7, 0],
  [5, 7],
  [0, 10],
  [-10, 10],
  [-24, 6], // spur
  [-32, 3],
  [-34, -2],
  [-30, -5],
  [-18, -2],
  [-8, -3],
];

/** Grip safety about its pivot at the thumb-safety pin. */
const gripSafetyProfile: Vec2[] = [
  [0, 3],
  [-8, 6],
  [-22, 8], // tang
  [-28, 4],
  [-27, -1],
  [-12, -5],
  [-7, -20],
  [-9, -32],
  [-5, -38],
  [-3, -24],
  [-2, -8],
];

const gripPanelProfile: Vec2[] = [
  [-24, -60],
  [-34, -122],
  [-70, -122],
  [-64, -62],
];

const slideStopLever: Vec2[] = [
  [2, 4],
  [-6, 5],
  [-30, 7],
  [-40, 4],
  [-40, -1],
  [-30, -3],
  [-6, -4],
  [2, -4],
];

const thumbSafetyLever: Vec2[] = [
  [0, 3],
  [-6, 5],
  [-24, 9],
  [-30, 8],
  [-30, 4],
  [-8, -2],
  [0, -3],
];

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver
  {
    id: 'frame',
    name: 'Receiver (frame)',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Forged carbon steel, parkerised',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: frameProfile, depth: 22, bevel: 1.0, holes: [triggerOpening] } },
        // grip frame is slightly narrower than the dust cover; grip panels sit on it
        { geometry: { kind: 'extrude', shape: rect(4, 6), depth: 22 }, position: [-58, -22, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Forged steel receiver carrying the slide rails, the lock-work, the magazine well and the arched mainspring housing at the rear of the grip.',
    notes: ['M1911A1 changes: arched housing, shorter trigger, longer grip safety tang, relief cuts behind the trigger'],
    confidence: 'published',
    adjacent: ['slide', 'slide_stop', 'trigger', 'hammer', 'mainspring_housing', 'magazine'],
    mass: 300,
    thermal: 0.1,
  },
  {
    id: 'mainspring_housing',
    name: 'Mainspring housing, arched',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Steel, checkered, parkerised',
    geometry: { kind: 'extrude', shape: mainspringHousingProfile, depth: 21, bevel: 0.8 },
    position: [0, 0, 0],
    function: 'Slides into a dovetail at the rear of the grip; houses the mainspring that powers the hammer and forms the arched backstrap of the A1.',
    confidence: 'published',
    adjacent: ['frame', 'hammer', 'grip_safety'],
    strip: { stage: 5, offset: [0, -60, 0], order: 0, motion: 'down' },
    mass: 45,
  },
  {
    id: 'grip_left',
    name: 'Grip panel, left',
    group: 'furniture',
    material: 'wood-walnut',
    materialLabel: 'Checkered walnut (early WWII) or brown plastic (late WWII)',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: gripPanelProfile, depth: 5, bevel: 1.2, curveSegments: 4 } },
        { geometry: { kind: 'extrude', shape: ngon(2.4, 12), depth: 1 }, position: [-28, -66, -2.5] },
        { geometry: { kind: 'extrude', shape: ngon(2.4, 12), depth: 1 }, position: [-62, -116, -2.5] },
      ],
    },
    position: [0, 0, -13.5],
    parent: 'frame',
    function: 'Two screws per side hold the panel to the grip frame.',
    confidence: 'estimated',
    adjacent: ['frame'],
    strip: { stage: 5, offset: [0, 0, -34], order: 1, motion: 'left' },
    mass: 20,
  },
  {
    id: 'grip_right',
    name: 'Grip panel, right',
    group: 'furniture',
    material: 'wood-walnut',
    materialLabel: 'Checkered walnut (early WWII) or brown plastic (late WWII)',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: gripPanelProfile, depth: 5, bevel: 1.2, curveSegments: 4 } },
        { geometry: { kind: 'extrude', shape: ngon(2.4, 12), depth: 1 }, position: [-28, -66, 2.5] },
        { geometry: { kind: 'extrude', shape: ngon(2.4, 12), depth: 1 }, position: [-62, -116, 2.5] },
      ],
    },
    position: [0, 0, 13.5],
    parent: 'frame',
    function: 'Two screws per side hold the panel to the grip frame.',
    confidence: 'estimated',
    adjacent: ['frame'],
    strip: { stage: 5, offset: [0, 0, 34], order: 1, motion: 'right' },
    mass: 20,
  },

  // ------------------------------------------------------------ slide
  {
    id: 'slide',
    name: 'Slide',
    group: 'action',
    material: 'parkerised-steel',
    materialLabel: 'Forged carbon steel, parkerised',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: slideProfile, depth: 22.9, bevel: 1.2 } },
        // rear cocking serrations, vertical (seventeen fine grooves on the original; eight shown)
        ...Array.from({ length: 8 }, (_, i) => ({ geometry: { kind: 'extrude' as const, shape: rect(1.2, 20), depth: 24 }, position: [-56 + i * 3.2, -4, 0] as Vec3 })),
      ],
    },
    position: [0, 0, 0],
    function: 'Reciprocates on the frame rails; its two internal locking recesses engage the barrel lugs in battery, and it carries the firing pin, extractor and sights.',
    notes: ['Slide travel about 48 mm'],
    confidence: 'published',
    adjacent: ['frame', 'barrel', 'barrel_bushing', 'firing_pin', 'extractor', 'slide_stop'],
    strip: { stage: 2, offset: [55, 45, 0], order: 1, motion: 'forward' },
    mass: 400,
    thermal: 0.35,
  },
  {
    id: 'barrel_bushing',
    name: 'Barrel bushing',
    group: 'barrel',
    material: 'parkerised-steel',
    geometry: { kind: 'lathe', profile: [[7.6, 0], [9.3, 0], [9.3, 13], [9.8, 13], [9.8, 17], [7.6, 17]], segments: 32 },
    position: [113, 0, 0],
    parent: 'slide',
    function: 'Locks into the slide nose with a quarter turn; supports the muzzle end of the barrel and retains the recoil spring plug.',
    confidence: 'published',
    adjacent: ['slide', 'barrel', 'recoil_plug'],
    strip: { stage: 3, offset: [32, 0, 0], order: 0, motion: 'forward' },
    mass: 20,
    thermal: 0.4,
  },
  {
    id: 'firing_pin_stop',
    name: 'Firing pin stop',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [3, 16, 14], radius: 0.6 },
    position: [-61.5, -3, 0],
    parent: 'slide',
    function: 'Plate at the rear of the slide that retains the firing pin and extractor; it slides down out of its channel once the firing pin is pushed forward.',
    confidence: 'published',
    adjacent: ['slide', 'firing_pin', 'extractor', 'hammer'],
    strip: { stage: 4, offset: [-14, -26, 0], order: 0, motion: 'down' },
    mass: 6,
  },
  {
    id: 'firing_pin',
    name: 'Firing pin',
    group: 'action',
    material: 'stainless-steel',
    materialLabel: 'Steel, 56 mm',
    geometry: { kind: 'lathe', profile: [[0, 0], [3, 0], [3, 4], [1.8, 6], [1.8, 50], [1.2, 52], [1.2, 56], [0, 56]], segments: 20 },
    position: [-60, 0, 0],
    parent: 'slide',
    function: 'Inertia firing pin, shorter than its channel: it only reaches the primer when struck hard by the hammer.',
    confidence: 'estimated',
    adjacent: ['slide', 'firing_pin_spring', 'firing_pin_stop', 'hammer'],
    strip: { stage: 4, offset: [-62, 0, 0], order: 1, motion: 'rear' },
    mass: 6,
    internal: true,
  },
  {
    id: 'firing_pin_spring',
    name: 'Firing pin spring',
    group: 'action',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 2.3, length: 30, turns: 14, wire: 0.6 },
    position: [-36, 0, 0],
    parent: 'slide',
    function: 'Returns the firing pin to the rear after each strike so it cannot rest against a primer.',
    confidence: 'estimated',
    adjacent: ['firing_pin', 'slide'],
    strip: { stage: 4, offset: [-40, -12, 0], order: 2, motion: 'rear' },
    mass: 1,
    internal: true,
  },
  {
    id: 'extractor',
    name: 'Extractor',
    group: 'action',
    material: 'parkerised-steel',
    materialLabel: 'Spring-steel internal extractor',
    geometry: { kind: 'box', size: [62, 4, 3], radius: 0.8 },
    position: [-30, 1, 8.8],
    parent: 'slide',
    function: 'Long internal spring-steel bar down the right side of the slide; its own tension provides the claw force on the case rim.',
    confidence: 'estimated',
    adjacent: ['slide', 'firing_pin_stop', 'barrel'],
    strip: { stage: 4, offset: [-72, 8, 0], order: 2, motion: 'rear' },
    mass: 10,
    internal: true,
  },
  {
    id: 'front_sight',
    name: 'Front sight',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [3, 4, 2.6] },
    position: [118, SLIDE_TOP + 2, 0],
    parent: 'slide',
    function: 'Fixed blade, staked into the slide.',
    confidence: 'published',
    adjacent: ['slide'],
    strip: { stage: 5, offset: [0, 30, 0], order: 0, motion: 'up' },
    mass: 1,
  },
  {
    id: 'rear_sight',
    name: 'Rear sight',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [10, 4, 16], radius: 0.6 },
    position: [-48, SLIDE_TOP + 2, 0],
    parent: 'slide',
    function: 'Fixed square-notch sight in a dovetail; drifted for windage only.',
    confidence: 'published',
    adjacent: ['slide'],
    strip: { stage: 5, offset: [0, 0, -36], order: 0, motion: 'left' },
    mass: 3,
  },

  // ------------------------------------------------------------ barrel / recoil
  {
    id: 'barrel',
    name: 'Barrel, 127 mm',
    group: 'barrel',
    material: 'parkerised-steel',
    materialLabel: 'Ordnance steel, 6-groove left-hand rifling',
    geometry: { kind: 'lathe', profile: [[0, 0], [7.9, 0], [7.9, 28], [7.5, 30], [7.5, MUZZLE], [5.8, MUZZLE], [0, MUZZLE]], segments: 40 },
    position: [0, 0, 0],
    pivot: [6, -13, 0],
    parent: 'slide',
    function: 'Two lugs on top of the chamber lock into recesses in the slide; on recoil the swinging link pulls the breech end down out of engagement.',
    notes: ['Length 127 mm from the breech face', 'Left-hand twist, 1 in 16 in (406 mm)', 'Travels with the slide in the model so the field strip choreography reads correctly'],
    confidence: 'published',
    adjacent: ['slide', 'barrel_link', 'barrel_bushing', 'slide_stop', 'extractor'],
    strip: { stage: 3, offset: [90, -32, 0], order: 2, motion: 'forward' },
    mass: 115,
    thermal: 0.7,
  },
  {
    id: 'barrel_lugs',
    name: 'Barrel hood and locking lugs',
    group: 'barrel',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        // hood over the chamber and the two upper locking lugs
        { geometry: { kind: 'extrude', shape: rect(24, 3.4), depth: 13, bevel: 0.5 }, position: [12, 8.4, 0] },
        { geometry: { kind: 'extrude', shape: rect(3, 2.2), depth: 12 }, position: [28, 8.6, 0] },
        { geometry: { kind: 'extrude', shape: rect(3, 2.2), depth: 12 }, position: [34, 8.6, 0] },
        // lower lug carrying the link pin
        { geometry: { kind: 'extrude', shape: rect(14, 8), depth: 12, bevel: 1 }, position: [8, -11, 0] },
      ],
    },
    // child of the barrel: positions are relative to the barrel's pivot at the link pin
    position: [-6, 13, 0],
    parent: 'barrel',
    function: 'Two lugs on top of the chamber lock into the slide; the lower lug carries the link pin. Integral with the barrel.',
    confidence: 'estimated',
    adjacent: ['barrel', 'slide', 'barrel_link'],
    mass: 0,
    thermal: 0.6,
  },
  {
    id: 'barrel_link',
    name: 'Barrel link',
    group: 'barrel',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: [[-3.5, 3.5], [3.5, 3.5], [3.5, -11.5], [-3.5, -11.5]], depth: 3, bevel: 0.5 },
    // relative to the barrel's pivot, which is the link's upper pin
    position: [0, 0, 0],
    pivot: [0, 0, 0],
    parent: 'barrel',
    function: 'Swinging link pinned to the barrel lug above and to the slide stop pin below; it converts rearward travel into the downward tilt that unlocks the barrel.',
    confidence: 'published',
    adjacent: ['barrel', 'slide_stop'],
    strip: { stage: 3, offset: [0, -16, 0], order: 3, rotate: [0, 0, 1.2], motion: 'down' },
    mass: 3,
  },
  {
    id: 'recoil_guide',
    name: 'Recoil spring guide',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'lathe', profile: [[0, 0], [5.5, 0], [5.5, 3], [2.6, 4], [2.6, 44], [0, 44]], segments: 20 },
    position: [16, SPRING_AXIS, 0],
    parent: 'slide',
    function: 'Flanged rod bearing on the barrel lug; keeps the rear of the recoil spring straight.',
    confidence: 'estimated',
    adjacent: ['recoil_spring', 'barrel', 'slide'],
    strip: { stage: 3, offset: [60, -40, 0], order: 1, motion: 'forward' },
    mass: 12,
    internal: true,
  },
  {
    id: 'recoil_spring',
    name: 'Recoil spring',
    group: 'action',
    material: 'parkerised-steel',
    materialLabel: 'Music wire, 16 lb standard',
    geometry: { kind: 'spring', radius: 4.0, length: 82, turns: 24, wire: 1.1 },
    position: [65, SPRING_AXIS, 0],
    parent: 'slide',
    function: 'Compressed between the guide flange and the plug as the slide recoils; returns the slide and feeds the next round.',
    confidence: 'estimated',
    adjacent: ['recoil_guide', 'recoil_plug', 'slide'],
    strip: { stage: 3, offset: [60, -40, 0], order: 1, motion: 'forward' },
    mass: 14,
    internal: true,
  },
  {
    id: 'recoil_plug',
    name: 'Recoil spring plug',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'lathe', profile: [[0, 0], [5, 0], [5, 21], [4.2, 22], [0, 22]], segments: 24 },
    position: [106, SPRING_AXIS, 0],
    parent: 'slide',
    function: 'Cap at the front of the spring tunnel, held by the bushing lip; the first part released in a field strip.',
    confidence: 'published',
    adjacent: ['recoil_spring', 'barrel_bushing', 'slide'],
    strip: { stage: 3, offset: [60, -40, 0], order: 1, motion: 'forward' },
    mass: 10,
  },

  // ------------------------------------------------------------ fire control
  {
    id: 'slide_stop',
    name: 'Slide stop',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: ngon(3.2), depth: 27 } },
        { geometry: { kind: 'extrude', shape: slideStopLever, depth: 2.6 }, position: [0, 0, -12.8] },
      ],
    },
    position: [6, -21, 0],
    function: 'Its cross pin passes through the frame and the barrel link; the lever holds the slide open on an empty magazine and, drawn out to the left, releases the slide from the frame.',
    confidence: 'published',
    adjacent: ['frame', 'barrel_link', 'slide', 'follower'],
    strip: { stage: 2, offset: [0, 0, -42], order: 0, motion: 'left' },
    mass: 18,
  },
  {
    id: 'thumb_safety',
    name: 'Thumb safety',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: ngon(3), depth: 25 } },
        { geometry: { kind: 'extrude', shape: thumbSafetyLever, depth: 2.6 }, position: [0, 0, -12.5] },
      ],
    },
    position: [-58, -24, 0],
    pivot: [0, 0, 0],
    function: 'Left-side lever; up (as shown) it blocks the sear and locks the slide, down it clears them. Its pin is also the grip safety pivot.',
    notes: ['Rest pose shown ON'],
    confidence: 'published',
    adjacent: ['frame', 'sear', 'grip_safety', 'slide'],
    strip: { stage: 5, offset: [0, 0, -40], order: 1, motion: 'left' },
    mass: 12,
  },
  {
    id: 'grip_safety',
    name: 'Grip safety',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: gripSafetyProfile, depth: 20, bevel: 1.0, curveSegments: 6 },
    position: [-60, -26, 0],
    pivot: [0, 0, 0],
    function: 'Pivoting backstrap lever with the long A1 tang; unless squeezed by the hand it blocks the trigger bow.',
    confidence: 'estimated',
    adjacent: ['frame', 'thumb_safety', 'mainspring_housing', 'trigger'],
    strip: { stage: 5, offset: [-34, -12, 0], order: 2, motion: 'rear' },
    mass: 20,
  },
  {
    id: 'hammer',
    name: 'Hammer, spur',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: hammerProfile, depth: 7, bevel: 0.6 },
    position: [-52, -14, 0],
    pivot: [0, 0, 0],
    function: 'Held at full cock by the sear; on release it swings forward and drives the inertia firing pin through the slide.',
    notes: ['Rest pose shown cocked (condition one carry)'],
    confidence: 'estimated',
    adjacent: ['sear', 'firing_pin', 'mainspring_housing', 'frame'],
    strip: { stage: 5, offset: [0, 40, 0], order: 3, motion: 'up' },
    mass: 30,
  },
  {
    id: 'sear',
    name: 'Sear',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [6, 12, 7], radius: 1 },
    position: [-44, -30, 0],
    function: 'Holds the hammer at full cock and releases it when pushed by the disconnector.',
    confidence: 'estimated',
    adjacent: ['hammer', 'disconnector', 'thumb_safety'],
    strip: { stage: 5, offset: [0, 0, 40], order: 3, motion: 'right' },
    mass: 4,
    internal: true,
  },
  {
    id: 'disconnector',
    name: 'Disconnector',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'cylinder', radius: 2.4, length: 22, axis: 'y' },
    position: [-38, -30, 0],
    function: 'Rises into a recess under the slide only when the slide is fully forward, so one trigger pull fires one shot.',
    confidence: 'estimated',
    adjacent: ['sear', 'trigger', 'slide'],
    strip: { stage: 5, offset: [0, 0, -40], order: 3, motion: 'left' },
    mass: 3,
    internal: true,
  },
  {
    id: 'trigger',
    name: 'Trigger with bow',
    group: 'fire-control',
    material: 'parkerised-steel',
    materialLabel: 'Steel, short A1 trigger',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: rect(4, 13), depth: 8, bevel: 0.8 }, position: [0, 0, 0] },
        // stirrup around the magazine well
        { geometry: { kind: 'extrude', shape: rect(44, 9), depth: 1.5 }, position: [-24, 10, 8.5] },
        { geometry: { kind: 'extrude', shape: rect(44, 9), depth: 1.5 }, position: [-24, 10, -8.5] },
        { geometry: { kind: 'extrude', shape: rect(2, 9), depth: 18 }, position: [-50, 10, 0] },
      ],
    },
    position: [-10, -40, 0],
    function: 'Slides straight back in the frame; the stirrup passes around the magazine to press the disconnector and sear.',
    notes: ['Travel about 3 mm to the break'],
    confidence: 'estimated',
    adjacent: ['frame', 'disconnector', 'grip_safety', 'magazine'],
    strip: { stage: 5, offset: [0, 0, -46], order: 2, motion: 'left' },
    mass: 10,
  },
  {
    id: 'ejector',
    name: 'Ejector',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [16, 8, 3], radius: 0.6 },
    position: [-14, -13, -7],
    function: 'Fixed blade on the left of the frame that the case base strikes as the slide recoils, kicking it out of the port.',
    confidence: 'estimated',
    adjacent: ['frame', 'slide'],
    strip: { stage: 5, offset: [0, 34, 0], order: 3, motion: 'up' },
    mass: 4,
    internal: true,
  },
  {
    id: 'mag_catch',
    name: 'Magazine catch',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'cylinder', radius: 4.5, length: 24, axis: 'z' },
    position: [-22, -42, 0],
    function: 'Push-button behind the trigger guard; pressing it from the left frees the magazine.',
    confidence: 'published',
    adjacent: ['frame', 'magazine'],
    strip: { stage: 5, offset: [0, 0, 44], order: 2, motion: 'right' },
    mass: 8,
  },

  // ------------------------------------------------------------ feed
  {
    id: 'magazine',
    name: 'Magazine, 7-round',
    group: 'feed',
    material: 'parkerised-steel',
    materialLabel: 'Steel, single column, welded base',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: [[-24, -20], [-58, -20], [-71, -125], [-37, -125]], depth: 14, bevel: 1.0 } },
        { geometry: { kind: 'extrude', shape: rect(36, 3), depth: 15 }, position: [-54, -126.5, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Single-column box magazine; the top round is held by the feed lips directly behind the chamber.',
    notes: ['7 rounds .45 ACP'],
    confidence: 'published',
    adjacent: ['frame', 'mag_catch', 'follower', 'trigger', 'slide_stop'],
    strip: { stage: 1, offset: [0, -140, 0], rotate: [0, 0, 0.03], motion: 'down' },
    mass: 70,
  },
  {
    id: 'follower',
    name: 'Follower',
    group: 'feed',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [28, 4, 11], radius: 1 },
    position: [-46, -54, 0],
    parent: 'magazine',
    function: 'Steel follower lifting the column; its rear lip raises the slide stop on the last round.',
    confidence: 'estimated',
    adjacent: ['magazine', 'magazine_spring', 'slide_stop'],
    strip: { stage: 5, offset: [0, 30, 0], order: 2, motion: 'up' },
    mass: 4,
    internal: true,
  },
  {
    id: 'magazine_spring',
    name: 'Magazine spring',
    group: 'feed',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 5, length: 56, turns: 7, wire: 0.9, axis: 'y' },
    position: [-52, -88, 0],
    parent: 'magazine',
    function: 'Flat-wire spring that lifts the column into the feed lips.',
    confidence: 'estimated',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, 20, 0], order: 3, motion: 'up' },
    mass: 6,
    internal: true,
  },
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `round_${i + 1}`,
    name: `Cartridge, .45 ACP Ball M1911 (${i + 1})`,
    group: 'ammunition' as const,
    material: 'brass' as const,
    geometry: { kind: 'cartridge' as const, caseDiameter: 12.1, caseLength: 22.8, bulletDiameter: 11.5, bulletLength: 17, rimDiameter: 12.2, shoulder: 0.9 },
    position: [-56 - i * 1.3, -26 - i * 12.2, 0] as Vec3,
    parent: 'magazine',
    function: 'Single column; the slide breech face strips the top round forward into the chamber on each cycle.',
    confidence: 'published' as const,
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5 as const, offset: [0, 50 + i * 12, 0] as Vec3, order: 0, motion: 'up' as const },
    mass: 21,
    internal: true,
  })),
];

export const m1911: FirearmDefinition = {
  id: 'm1911',
  name: 'Colt M1911A1',
  shortName: 'M1911A1',
  spec: {
    manufacturer: 'Colt’s Patent Fire Arms Manufacturing Company (also Remington Rand, Ithaca, Union Switch & Signal under WWII contract)',
    designation: 'Pistol, Caliber .45, Automatic, M1911A1',
    origin: 'United States',
    designed: { value: 1911, confidence: 'published', note: 'John M. Browning; A1 revisions adopted 1926' },
    category: 'handgun',
    categoryLabel: 'Semi-automatic pistol',
    cartridge: '.45 ACP (11.43×23 mm)',
    action: 'short-recoil-tilting-barrel',
    actionLabel: 'Short recoil, tilting barrel on a swinging link, single-action hammer',
    feed: 'box-magazine',
    capacity: { value: '7-round detachable box', confidence: 'published' },
    overallLength: { value: 219, unit: 'mm', confidence: 'published', note: '8.6 in' },
    barrelLength: { value: 127, unit: 'mm', confidence: 'published', note: '5 in' },
    mass: { value: 1105, unit: 'g', confidence: 'published', note: '2 lb 7 oz, unloaded with magazine' },
    muzzleVelocity: { value: 253, unit: 'm/s', confidence: 'published', note: '230 gr Ball M1911, 830 ft/s' },
    rateOfFire: { value: 'Semi-automatic', confidence: 'published' },
    effectiveRange: { value: 50, unit: 'm', confidence: 'estimated', note: 'commonly cited service figure; FM 23-35 gives no single number' },
    twist: { value: '1 in 16 in (406 mm), LH, 6 grooves', confidence: 'published' },
    sights: 'Fixed blade front, fixed square-notch rear in a dovetail',
    identification: 'All-steel single-action pistol with an exposed spur hammer, a grip safety in the backstrap, a thumb safety on the left and a barrel bushing at the slide nose. The A1 has an arched, checkered mainspring housing, a short trigger and scallops in the frame behind the trigger.',
    mechanism: 'Browning short recoil. Barrel and slide recoil locked together for about 3 mm; the swinging link then pulls the breech end of the barrel down, freeing its upper lugs from the slide. The disconnector drops as the slide moves, so the trigger must be released and pulled again for the next shot.',
  },
  provenance: {
    configuration: 'M1911A1, WWII production pattern: 5 in barrel, arched mainspring housing, checkered grip panels, parkerised finish, 7-round magazine',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'US Army FM 23-35, Basic Field Manual, Automatic Pistol, Caliber .45, M1911 and M1911A1 (1940)', covers: ['overallLength', 'barrelLength', 'mass', 'capacity', 'components', 'fieldStrip'] },
      { label: 'US Army TM 43-0001-27, Army Ammunition Data Sheets, Cartridge, Caliber .45, Ball, M1911', covers: ['muzzleVelocity'] },
      { label: 'Colt Government Model specification sheet', covers: ['height', 'twist'] },
      { label: 'SAAMI / C.I.P. .45 Auto cartridge drawing', covers: ['cartridge'] },
    ],
    notes: [
      'Exterior proportions follow the published dimensions; sear, disconnector and hammer geometry are simplified from the Browning pattern.',
      'The barrel, bushing and recoil assembly are modelled as children of the slide so that they travel with it when the slide leaves the frame.',
      'The ejection port cut, the plunger tube and the hammer strut are omitted.',
      'Composites are built from extrusions only; lathes are used as single geometries.',
    ],
  },
  components,
  actions: {
    cycle: {
      id: 'cycle',
      label: 'Rack the slide',
      duration: 1.05,
      interruptible: false,
      steps: [
        { component: 'slide', t: [0.0, 0.42], translate: [-SLIDE_TRAVEL, 0, 0], easing: 'inOutCubic' },
        // barrel is a child of the slide: +45 relative = 3 mm rearward in the frame, then it tilts on the link
        { component: 'barrel', t: [0.0, 0.42], translate: [SLIDE_TRAVEL - 3, 0, 0], rotate: [0, 0, 0.06], easing: 'inOutCubic' },
        { component: 'barrel_link', t: [0.0, 0.42], rotate: [0, 0, 0.35], easing: 'inOutCubic' },
        { component: 'recoil_guide', t: [0.0, 0.42], translate: [SLIDE_TRAVEL - 3, 0, 0], easing: 'inOutCubic' },
        { component: 'recoil_spring', t: [0.0, 0.42], translate: [SLIDE_TRAVEL / 2, 0, 0], easing: 'inOutCubic' },
        { component: 'hammer', t: [0.05, 0.3], rotate: [0, 0, 0], easing: 'outQuad' },
        { component: 'slide', t: [0.52, 0.75], reset: true, easing: 'springReturn' },
        { component: 'barrel', t: [0.52, 0.75], reset: true, easing: 'springReturn' },
        { component: 'barrel_link', t: [0.52, 0.75], reset: true, easing: 'springReturn' },
        { component: 'recoil_guide', t: [0.52, 0.75], reset: true, easing: 'springReturn' },
        { component: 'recoil_spring', t: [0.52, 0.75], reset: true, easing: 'springReturn' },
      ],
      audio: [
        { event: 'charge_pull', at: 0.0, component: 'slide', caption: 'Slide drawn rearward; hammer cocked, barrel unlocks on the link' },
        { event: 'casing_eject', at: 0.38, component: 'extractor', caption: 'Case ejected to the right' },
        { event: 'bolt_release', at: 0.52, component: 'slide', caption: 'Slide released' },
        { event: 'bolt_battery', at: 0.75, component: 'barrel', caption: 'Barrel lugs lock into the slide' },
      ],
    },
    dryFire: {
      id: 'dryFire',
      label: 'Dry fire',
      duration: 0.7,
      steps: [
        { component: 'grip_safety', t: [0.0, 0.1], rotate: [0, 0, 0.06], easing: 'outQuad' },
        { component: 'trigger', t: [0.05, 0.2], translate: [-3, 0, 0], easing: 'inQuad' },
        { component: 'hammer', t: [0.2, 0.25], rotate: [0, 0, -0.75], easing: 'mechanicalSnap' },
        { component: 'firing_pin', t: [0.24, 0.27], translate: [3, 0, 0], easing: 'mechanicalSnap' },
        { component: 'firing_pin', t: [0.3, 0.4], reset: true, easing: 'springReturn' },
        { component: 'trigger', t: [0.45, 0.6], reset: true, easing: 'outQuad' },
        { component: 'grip_safety', t: [0.5, 0.65], reset: true, easing: 'outQuad' },
      ],
      audio: [
        { event: 'trigger_break', at: 0.2, component: 'trigger', caption: 'Sear releases the hammer' },
        { event: 'hammer_fall', at: 0.25, component: 'hammer', caption: 'Hammer falls on the firing pin' },
        { event: 'trigger_reset', at: 0.58, component: 'trigger', caption: 'Trigger resets' },
      ],
    },
    reload: {
      id: 'reload',
      label: 'Magazine change',
      duration: 1.5,
      steps: [
        { component: 'mag_catch', t: [0.0, 0.08], translate: [0, 0, 3], easing: 'outQuad' },
        { component: 'magazine', t: [0.06, 0.38], translate: [0, -135, 0], rotate: [0, 0, 0.04], easing: 'outQuad' },
        { component: 'mag_catch', t: [0.3, 0.4], reset: true, easing: 'outQuad' },
        { component: 'magazine', t: [0.85, 1.05], reset: true, easing: 'mechanicalSnap' },
      ],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pressed' },
        { event: 'mag_out', at: 0.1, component: 'magazine', caption: 'Magazine drops free' },
        { event: 'mag_seat', at: 1.04, component: 'magazine', caption: 'Magazine seats and locks' },
      ],
    },
    safety: {
      id: 'safety',
      label: 'Thumb safety',
      duration: 0.35,
      steps: [{ component: 'thumb_safety', t: [0.0, 0.22], rotate: [0, 0, 0.55], easing: 'detent' }],
      audio: [{ event: 'selector', at: 0.2, component: 'thumb_safety', caption: 'Thumb safety swept down to FIRE' }],
    },
  },
  acoustic: {
    mass: 1105,
    receiver: 'steel-forged',
    action: 'short-recoil-tilting-barrel',
    reciprocatingMass: 520,
    spring: { frequency: 30, damping: 0.32 },
    furniture: 'wood',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'In battery',
      description: 'Fully assembled, barrel lugs locked into the slide, hammer cocked, magazine seated.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Magazine withdrawn',
      description: 'The magazine drops from the grip once the catch is pressed; with the chamber checked the pistol is clear.',
      camera: 'side',
      focus: ['magazine', 'mag_catch', 'frame'],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pressed' },
        { event: 'mag_out', at: 0.15, component: 'magazine', caption: 'Magazine withdrawn' },
      ],
    },
    {
      stage: 2,
      title: 'Slide stop out, slide off',
      description: 'With the slide eased back to its takedown notch, the slide stop pushes out to the left, freeing the barrel link. The slide then runs forward off the frame carrying the barrel, bushing and recoil assembly with it.',
      camera: 'side-left',
      focus: ['slide_stop', 'slide', 'frame', 'barrel_link'],
      audio: [
        { event: 'pin_push', at: 0.0, component: 'slide_stop', caption: 'Slide stop pushed out' },
        { event: 'receiver_split', at: 0.35, component: 'slide', caption: 'Slide runs forward off the frame' },
      ],
    },
    {
      stage: 3,
      title: 'Barrel and recoil assembly out',
      description: 'A quarter turn frees the bushing from the slide nose; the plug, spring and guide leave forward, and the barrel follows out of the front of the slide with its link swung down.',
      camera: 'iso',
      focus: ['barrel_bushing', 'recoil_plug', 'recoil_spring', 'recoil_guide', 'barrel', 'barrel_link'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'barrel_bushing', caption: 'Bushing turned and withdrawn' },
        { event: 'component_out', at: 0.2, component: 'recoil_plug', caption: 'Recoil spring and plug out' },
        { event: 'component_out', at: 0.5, component: 'barrel', caption: 'Barrel withdrawn from the slide' },
      ],
    },
    {
      stage: 4,
      title: 'Firing pin and extractor detail',
      description: 'Beyond the field strip: the firing pin stop slides down out of the slide, releasing the inertia firing pin, its spring and the long internal extractor rearward.',
      camera: 'detail-action',
      focus: ['firing_pin_stop', 'firing_pin', 'firing_pin_spring', 'extractor'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'firing_pin_stop', caption: 'Firing pin stop out' },
        { event: 'component_out', at: 0.25, component: 'firing_pin', caption: 'Firing pin withdrawn' },
        { event: 'component_out', at: 0.45, component: 'extractor', caption: 'Extractor withdrawn' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis: mainspring housing down, grip panels and safeties sideways, the lock-work and sights out of the frame and slide, and the magazine internals up.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 219 mm', from: [TANG_TIP, -142, 0], to: [SLIDE_FRONT, -142, 0] },
      { label: 'Barrel 127 mm', from: [0, 28, 0], to: [MUZZLE, 28, 0] },
    ],
  },
  cartridge: { caseDiameter: 12.1, caseLength: 22.8, bulletDiameter: 11.5, bulletLength: 17, rimDiameter: 12.2, label: '.45 ACP' },
  ejection: { position: [6, 8, 12], direction: [0.3, 0.6, 1] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default m1911;
