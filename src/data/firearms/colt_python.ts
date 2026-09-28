import type { ComponentDef, FirearmDefinition, GeometrySpec, Vec2, Vec3 } from '@/firearm/schema';

/**
 * Colt Python, .357 Magnum, 6 in barrel, 2020 production.
 *
 * Frame: bore axis y=0, origin at the rear face of the cylinder, +x toward the
 * muzzle, +z shooter's right. The cylinder axis sits 12.7 mm below the bore;
 * the barrel runs from the cylinder gap forward, so the muzzle is at
 * x = 41 + 152 = 193 mm. All dimensions mm.
 *
 * Published dimensions (Colt catalogue, Python 6 in, 2020 production):
 * overall 292 mm (11.5 in), barrel 152 mm (6 in), height 140 mm (5.5 in),
 * width 39 mm (1.55 in), mass 1,304 g (46 oz). The original 1955 to 2005
 * Python 6 in weighed 43.5 oz (1,233 g); the 2020 gun is heavier through its
 * thicker top strap and stainless construction. Lock-work is estimated.
 */

// ---- layout constants (mm) --------------------------------------------------
const CYL_LEN = 40.6; // 1.6 in
const CYL_AXIS = -12.7; // below the bore
const CYL_R = 19.5;
const GAP = 0.4;
const BARREL_START = CYL_LEN + GAP; // forcing cone
const MUZZLE = BARREL_START + 152; // 193
const CRANE_PIVOT: Vec3 = [46, -38, -8];
const INDEX = (Math.PI * 2) / 6;
const SWING = -1.5; // about x, cylinder to the left

/**
 * Geometry note: composites are built only from extrusions (a box is an extruded
 * rectangle, a shaft an extruded polygon). Lathes and rails are used on their own.
 */
const rect = (w: number, h: number): Vec2[] => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
const ngon = (r: number, n = 24): Vec2[] => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r] as Vec2);

const frameProfile: Vec2[] = [
  [-46, 14], // top strap, rear
  [48, 14],
  [52, 10], // frame front face
  [52, -40],
  [30, -42], // underside ahead of the trigger guard
  [28, -48],
  [22, -66], // trigger guard
  [4, -72],
  [-16, -70],
  [-26, -62],
  [-30, -56], // front strap top
  [-46, -118], // front strap bottom
  [-92, -120], // butt
  [-88, -96], // backstrap
  [-72, -66],
  [-58, -48],
  [-50, -30],
  [-47, -10],
];

const cylinderWindow: Vec2[] = [
  [-3, 8],
  [44, 8],
  [44, -34],
  [-3, -34],
];

const triggerOpening: Vec2[] = [
  [22, -46],
  [18, -62],
  [2, -67],
  [-14, -65],
  [-22, -56],
  [-22, -46],
];

/** Hammer drawn DOWN (at rest for a double-action revolver), about its pin. */
const hammerProfile: Vec2[] = [
  [-5, -8],
  [6, -8],
  [8, 0],
  [6, 6],
  [0, 10],
  [-8, 12],
  [-16, 16],
  [-22, 18], // spur
  [-24, 14],
  [-18, 10],
  [-10, 6],
  [-7, 0],
];

const triggerProfile: Vec2[] = [
  [-3, 2],
  [3, 2],
  [5, -6],
  [5, -14],
  [2, -20],
  [-3, -19],
  [-5, -10],
];

const sideplateProfile: Vec2[] = [
  [-44, 10],
  [-8, 10],
  [-6, -30],
  [-14, -46],
  [-28, -50],
  [-46, -44],
  [-48, -20],
];

/** Target grip panel: covers the grip frame with 3 mm of steel showing at the straps. */
const gripPanelProfile: Vec2[] = [
  [-33, -60],
  [-47, -114],
  [-86, -116],
  [-84, -96],
  [-70, -68],
  [-60, -54],
];

/** Ventilated rib, side profile with four slots as holes. */
const ribProfile: Vec2[] = [
  [44, 9.5],
  [190, 9.5],
  [190, 15],
  [44, 15],
];
const ribSlots: Vec2[][] = Array.from({ length: 4 }, (_, i) => rect(24, 3).map(([x, y]) => [x + 66 + i * 34, y + 12.2] as Vec2));

/** Full-length underlug, side profile with a rounded nose. */
const underlugProfile: Vec2[] = [
  [44, -10],
  [186, -10],
  [190, -13],
  [190, -19],
  [186, -22],
  [44, -22],
];

/** Crane (yoke): upright arm at the front of the window and the arbor the cylinder turns on, one L-shaped profile. */
const craneProfile: Vec2[] = [
  [43, -40],
  [48, -40],
  [48, -12],
  [46, -9.5],
  [4, -9.5],
  [4, -15.9],
  [43, -15.9],
];

/** Six-armed extractor star drawn in the cylinder end plane (extruded along x). */
const starProfile: Vec2[] = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + Math.PI / 6;
  const r = i % 2 === 0 ? 13.5 : 7;
  return [Math.cos(a) * r, Math.sin(a) * r] as Vec2;
});

/** Fluted six-chamber cylinder as an extruded drum with six flute slabs; built along +x, rear face at x=0. */
const cylinderGeometry: GeometrySpec = {
  kind: 'composite',
  parts: [
    { geometry: { kind: 'extrude', shape: ngon(CYL_R, 48), depth: CYL_LEN, axis: 'x' }, position: [CYL_LEN / 2, 0, 0] },
    ...Array.from({ length: 6 }, (_, i): { geometry: GeometrySpec; position: Vec3; rotation: Vec3 } => {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      return { geometry: { kind: 'extrude', shape: rect(22, 2.4), depth: 7 }, position: [23, Math.cos(a) * (CYL_R - 0.3), Math.sin(a) * (CYL_R - 0.3)], rotation: [a, 0, 0] };
    }),
  ],
};

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver
  {
    id: 'frame',
    name: 'Frame',
    group: 'receiver',
    material: 'blued-steel',
    materialLabel: 'Stainless steel, polished (2020); Royal Blue carbon steel on the original',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: frameProfile, depth: 22, bevel: 1.0, holes: [cylinderWindow, triggerOpening] } },
        // standing breech / recoil shield, as wide as the cylinder (cross-section extruded along x)
        { geometry: { kind: 'extrude', shape: rect(36, 42), depth: 9, axis: 'x' }, position: [-7.5, CYL_AXIS, 0] },
        // crane housing at the front of the window
        { geometry: { kind: 'extrude', shape: rect(30, 30), depth: 8, axis: 'x' }, position: [48, -22, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'One-piece frame with the solid top strap that encloses the cylinder window; the standing breech behind the cylinder carries the firing pin bushing.',
    notes: ['I-frame size', 'Hand-fitted lock-work on the original; CNC-cut on the 2020 gun'],
    confidence: 'published',
    adjacent: ['barrel', 'cylinder', 'crane', 'sideplate', 'hammer', 'trigger'],
    mass: 420,
    thermal: 0.15,
  },
  {
    id: 'sideplate',
    name: 'Sideplate',
    group: 'receiver',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: sideplateProfile, depth: 2.5, bevel: 0.5 },
    position: [0, 0, 10],
    function: 'Fitted plate on the right of the frame; with it off, the hammer, trigger, hand and rebound lever are exposed in place.',
    confidence: 'estimated',
    adjacent: ['frame', 'hammer', 'trigger', 'rebound_lever'],
    strip: { stage: 3, offset: [0, 0, 44], order: 1, motion: 'right' },
    mass: 30,
  },
  {
    id: 'grip_left',
    name: 'Grip panel, left',
    group: 'furniture',
    material: 'wood-walnut',
    materialLabel: 'Checkered walnut target grip with gold medallion',
    geometry: { kind: 'extrude', shape: gripPanelProfile, depth: 4, bevel: 1.2, curveSegments: 4 },
    position: [0, 0, -13],
    parent: 'frame',
    function: 'One of two target-style walnut panels, joined through the grip frame by a single screw.',
    confidence: 'estimated',
    adjacent: ['frame', 'grip_screw'],
    strip: { stage: 3, offset: [0, 0, -40], order: 2, motion: 'left' },
    mass: 40,
  },
  {
    id: 'grip_right',
    name: 'Grip panel, right',
    group: 'furniture',
    material: 'wood-walnut',
    materialLabel: 'Checkered walnut target grip with gold medallion',
    geometry: { kind: 'extrude', shape: gripPanelProfile, depth: 4, bevel: 1.2, curveSegments: 4 },
    position: [0, 0, 13],
    parent: 'frame',
    function: 'One of two target-style walnut panels, joined through the grip frame by a single screw.',
    confidence: 'estimated',
    adjacent: ['frame', 'grip_screw'],
    strip: { stage: 3, offset: [0, 0, 40], order: 2, motion: 'right' },
    mass: 40,
  },
  {
    id: 'grip_screw',
    name: 'Grip screw',
    group: 'furniture',
    material: 'blued-steel',
    geometry: { kind: 'cylinder', radius: 2.4, length: 30, axis: 'z' },
    position: [-66, -92, 0],
    function: 'Single through-screw clamping both grip panels to the frame.',
    confidence: 'published',
    adjacent: ['grip_left', 'grip_right'],
    strip: { stage: 3, offset: [0, 0, 58], order: 0, motion: 'right' },
    mass: 3,
  },

  // ------------------------------------------------------------ barrel
  {
    id: 'barrel',
    name: 'Barrel, 6 in',
    group: 'barrel',
    material: 'blued-steel',
    materialLabel: 'Stainless steel, 6-groove LH rifling, 1 in 14 in',
    geometry: { kind: 'lathe', profile: [[0, BARREL_START], [9.8, BARREL_START], [9.8, 62], [9.2, 64], [8.6, MUZZLE], [4.6, MUZZLE], [0, MUZZLE]], segments: 40 },
    position: [0, 0, 0],
    function: 'Screwed into the frame ahead of the cylinder gap; the rib and underlug it carries add weight forward to steady the sights.',
    notes: ['Length 152 mm measured from the forcing cone at the cylinder face, so the muzzle sits at x = 193 mm in the frame', 'Rib and underlug are one forging with the barrel; modelled as children so the profile stays clean'],
    confidence: 'published',
    adjacent: ['frame', 'cylinder', 'barrel_rib', 'barrel_underlug', 'ejector_rod'],
    strip: { stage: 5, offset: [70, 0, 0], order: 0, motion: 'forward' },
    mass: 300,
    thermal: 0.65,
  },
  {
    id: 'barrel_rib',
    name: 'Ventilated rib',
    group: 'barrel',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: ribProfile, depth: 8, holes: ribSlots },
    position: [0, 0, 0],
    parent: 'barrel',
    function: 'Solid sighting rib along the top of the barrel with four ventilation slots; a Python signature borrowed from target shotguns.',
    notes: ['Slot count simplified to four'],
    confidence: 'estimated',
    adjacent: ['barrel', 'front_sight', 'rear_sight'],
    mass: 40,
    thermal: 0.5,
  },
  {
    id: 'barrel_underlug',
    name: 'Full-length underlug',
    group: 'barrel',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: underlugProfile, depth: 12, bevel: 1.5, curveSegments: 4 },
    position: [0, 0, 0],
    parent: 'barrel',
    function: 'Shroud under the barrel that encloses and protects the ejector rod and carries much of the forward weight.',
    confidence: 'estimated',
    adjacent: ['barrel', 'ejector_rod'],
    mass: 60,
    thermal: 0.45,
  },
  {
    id: 'front_sight',
    name: 'Front sight, ramp',
    group: 'sights',
    material: 'blued-steel',
    materialLabel: 'Steel ramp with red insert',
    geometry: { kind: 'extrude', shape: [[0, 0], [14, 0], [14, 5], [4, 5]], depth: 3 },
    position: [176, 15, 0],
    parent: 'barrel',
    function: 'Pinned ramp blade on the rib; interchangeable on the 2020 gun.',
    confidence: 'published',
    adjacent: ['barrel_rib'],
    strip: { stage: 5, offset: [0, 30, 0], order: 1, motion: 'up' },
    mass: 3,
  },
  {
    id: 'rear_sight',
    name: 'Rear sight, adjustable',
    group: 'sights',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: [[-12, 0], [12, 0], [12, 5], [-8, 5], [-8, 9], [-12, 9]], depth: 20, bevel: 0.5 },
    position: [-26, 14, 0],
    function: 'Click-adjustable for windage and elevation; sits in a channel milled into the top strap.',
    confidence: 'published',
    adjacent: ['frame'],
    strip: { stage: 5, offset: [0, 36, 0], order: 1, motion: 'up' },
    mass: 12,
  },

  // ------------------------------------------------------------ crane + cylinder
  {
    id: 'crane_shaft',
    name: 'Crane pivot shaft',
    group: 'action',
    material: 'blued-steel',
    geometry: { kind: 'cylinder', radius: 3.4, length: 34 },
    position: [CRANE_PIVOT[0] - 14, CRANE_PIVOT[1], CRANE_PIVOT[2]],
    function: 'Runs in the frame below the front of the cylinder window; the crane turns on it, and with the crane screw out the whole crane and cylinder slide forward off the frame.',
    confidence: 'estimated',
    adjacent: ['frame', 'crane', 'crane_screw'],
    strip: { stage: 2, offset: [46, -26, 0], order: 1, motion: 'forward' },
    mass: 8,
    internal: true,
  },
  {
    id: 'crane_screw',
    name: 'Crane screw',
    group: 'receiver',
    material: 'blued-steel',
    geometry: { kind: 'cylinder', radius: 2.4, length: 4, axis: 'z' },
    position: [40, -38, 12],
    function: 'Right-side screw retaining the crane in the frame; the first fastener out in a detail strip.',
    confidence: 'published',
    adjacent: ['frame', 'crane_shaft'],
    strip: { stage: 2, offset: [0, 0, 36], order: 0, motion: 'right' },
    mass: 1,
  },
  {
    id: 'crane',
    name: 'Crane (yoke)',
    group: 'action',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: craneProfile, depth: 7, bevel: 0.8 },
    // the shaft sits at the pivot line, so this child's frame is brought back to the firearm origin
    position: [-(CRANE_PIVOT[0] - 14), -CRANE_PIVOT[1], -CRANE_PIVOT[2]],
    pivot: CRANE_PIVOT,
    parent: 'crane_shaft',
    function: 'L-shaped arm carrying the cylinder arbor; it swings about its shaft to carry the cylinder out of the left side of the frame for loading.',
    notes: ['Swings about 85 degrees'],
    confidence: 'estimated',
    adjacent: ['crane_shaft', 'cylinder', 'frame', 'cylinder_release'],
    strip: { stage: 1, offset: [0, 0, 0], rotate: [SWING, 0, 0], motion: 'left' },
    mass: 35,
  },
  {
    id: 'cylinder',
    name: 'Cylinder, six chambers',
    group: 'action',
    material: 'blued-steel',
    materialLabel: 'Stainless steel, six flutes',
    geometry: cylinderGeometry,
    // relative to the crane's pivot point (children sit in the parent's pivot frame)
    position: [-CRANE_PIVOT[0], CYL_AXIS - CRANE_PIVOT[1], -CRANE_PIVOT[2]],
    pivot: [0, 0, 0],
    parent: 'crane',
    function: 'Turns clockwise on the crane arbor, indexed one chamber per stroke by the hand; the bolt locks it with the top chamber on the bore.',
    notes: ['Colt cylinders rotate clockwise seen from the rear, into the frame', 'Length 40.6 mm, diameter 39 mm', 'Chambers are not bored; the cartridges sit at the chamber positions'],
    confidence: 'published',
    adjacent: ['crane', 'frame', 'barrel', 'extractor_star', 'hand', 'ejector_rod'],
    strip: { stage: 5, offset: [60, 0, 0], order: 2, motion: 'forward' },
    mass: 125,
    thermal: 0.55,
  },
  {
    id: 'ejector_rod',
    name: 'Ejector rod',
    group: 'action',
    material: 'blued-steel',
    geometry: { kind: 'lathe', profile: [[0, -2], [2.6, -2], [2.6, 96], [3.6, 98], [3.6, 108], [0, 108]], segments: 20 },
    position: [0, 0, 0],
    parent: 'cylinder',
    function: 'Runs through the cylinder axis and forward inside the underlug; pressed rearward with the cylinder open, it pushes the extractor star and all six cases out together.',
    confidence: 'estimated',
    adjacent: ['cylinder', 'extractor_star', 'barrel_underlug'],
    strip: { stage: 5, offset: [90, 0, 0], order: 3, motion: 'forward' },
    mass: 18,
    internal: true,
  },
  {
    id: 'extractor_star',
    name: 'Extractor star',
    group: 'action',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: starProfile, depth: 1.8, axis: 'x' },
    position: [-0.9, 0, 0],
    parent: 'cylinder',
    function: 'Six-armed plate recessed into the rear face of the cylinder; its arms sit under the case rims and its ratchet teeth are what the hand pushes to index the cylinder.',
    confidence: 'estimated',
    adjacent: ['cylinder', 'ejector_rod', 'hand'],
    strip: { stage: 5, offset: [-30, 0, 0], order: 3, motion: 'rear' },
    mass: 10,
  },
  ...Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return {
      id: `round_${i + 1}`,
      name: `Cartridge, .357 Magnum (${i + 1})`,
      group: 'ammunition' as const,
      material: 'brass' as const,
      // builder bulletLength includes the seated third; 11 mm gives the real 40.4 mm overall length so the round sits inside the 40.6 mm cylinder
      geometry: { kind: 'cartridge' as const, caseDiameter: 9.6, caseLength: 33.0, bulletDiameter: 9.07, bulletLength: 11, rimDiameter: 11.2, shoulder: 0.9 },
      position: [0.3, Math.cos(a) * -CYL_AXIS, Math.sin(a) * -CYL_AXIS] as Vec3,
      parent: 'cylinder',
      function: 'Rimmed cartridge headspacing on the cylinder face; the top chamber is the one in line with the bore.',
      confidence: 'published' as const,
      adjacent: ['cylinder', 'extractor_star'],
      strip: { stage: 5 as const, offset: [-42 - i * 5, 0, 0] as Vec3, order: 3, motion: 'rear' as const },
      mass: 15,
      internal: true,
    };
  }),
  {
    id: 'cylinder_release',
    name: 'Cylinder release latch',
    group: 'action',
    material: 'blued-steel',
    geometry: { kind: 'box', size: [18, 7, 3], radius: 1 },
    position: [-16, -4, -12.5],
    function: 'Left-side latch drawn rearward to withdraw the bolt from the rear of the cylinder so the crane can swing out.',
    notes: ['Colt latches pull back; Smith & Wesson latches push forward'],
    confidence: 'published',
    adjacent: ['frame', 'crane'],
    strip: { stage: 5, offset: [0, 0, -40], order: 2, motion: 'left' },
    mass: 6,
  },

  // ------------------------------------------------------------ lock-work
  {
    id: 'hammer',
    name: 'Hammer',
    group: 'fire-control',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: hammerProfile, depth: 7, bevel: 0.6 },
    position: [-36, -22, 0],
    pivot: [0, 0, 0],
    function: 'Rests down against the frame; cocked by thumb for single action, or raised and released by the trigger in double action.',
    notes: ['Rest pose shown down (uncocked)', 'Cocks through about 35 degrees'],
    confidence: 'estimated',
    adjacent: ['frame', 'trigger', 'mainspring', 'rebound_lever', 'sideplate'],
    strip: { stage: 4, offset: [0, 0, 40], order: 0, motion: 'right' },
    mass: 28,
  },
  {
    id: 'trigger',
    name: 'Trigger',
    group: 'fire-control',
    material: 'blued-steel',
    geometry: { kind: 'extrude', shape: triggerProfile, depth: 8, bevel: 0.8 },
    position: [-6, -43, 0],
    pivot: [0, 0, 0],
    function: 'Pivots in the frame; in double action its long stroke raises the hammer, indexes the cylinder through the hand and then lets the hammer fall.',
    notes: ['Double-action pull about 4 kgf, single-action about 1.4 kgf (published range)'],
    confidence: 'estimated',
    adjacent: ['frame', 'hammer', 'hand', 'rebound_lever'],
    strip: { stage: 4, offset: [0, 0, 40], order: 1, motion: 'right' },
    mass: 14,
  },
  {
    id: 'hand',
    name: 'Hand (pawl)',
    group: 'fire-control',
    material: 'blued-steel',
    geometry: { kind: 'box', size: [3, 26, 2], radius: 0.5 },
    position: [-8, -34, 5],
    function: 'Rises with the trigger and pushes on the ratchet teeth of the extractor star to turn the cylinder one chamber; the Colt hand also holds the cylinder tight against the bolt at the moment of firing.',
    confidence: 'estimated',
    adjacent: ['trigger', 'extractor_star', 'cylinder'],
    strip: { stage: 4, offset: [0, 0, 36], order: 2, motion: 'right' },
    mass: 3,
    internal: true,
  },
  {
    id: 'rebound_lever',
    name: 'Rebound lever',
    group: 'fire-control',
    material: 'blued-steel',
    geometry: { kind: 'box', size: [28, 5, 4], radius: 1 },
    position: [-32, -42, 0],
    function: 'Colt’s combined trigger-return and hammer-rebound lever, pressed by the mainspring; it lifts the hammer off the firing pin after each shot.',
    confidence: 'estimated',
    adjacent: ['hammer', 'trigger', 'mainspring'],
    strip: { stage: 4, offset: [0, 0, 44], order: 3, motion: 'right' },
    mass: 6,
    internal: true,
  },
  {
    id: 'mainspring',
    name: 'Mainspring, V-type',
    group: 'fire-control',
    material: 'stainless-steel',
    materialLabel: 'Flat V-spring',
    geometry: { kind: 'extrude', shape: [[-1, -22], [1, -22], [8, 20], [6, 22], [0, 4], [-4, 20], [-6, 20]], depth: 6 },
    position: [-62, -72, 0],
    function: 'Flat V-spring in the grip frame that powers the hammer and, through the rebound lever, returns the trigger.',
    confidence: 'estimated',
    adjacent: ['hammer', 'rebound_lever', 'frame'],
    strip: { stage: 4, offset: [0, 0, 44], order: 3, motion: 'right' },
    mass: 10,
    internal: true,
  },
];

export const coltPython: FirearmDefinition = {
  id: 'colt_python',
  name: 'Colt Python',
  shortName: 'Python',
  spec: {
    manufacturer: 'Colt’s Manufacturing Company, Hartford',
    designation: 'Python, .357 Magnum, 6 in',
    origin: 'United States',
    designed: { value: 1955, confidence: 'published', note: 'original production 1955 to 2005; reintroduced 2020' },
    category: 'revolver',
    categoryLabel: 'Double-action revolver',
    cartridge: '.357 Magnum (9×33 mmR)',
    action: 'revolver-da-sa',
    actionLabel: 'Double-action / single-action revolver, swing-out cylinder',
    feed: 'cylinder',
    capacity: { value: '6-round cylinder', confidence: 'published' },
    overallLength: { value: 292, unit: 'mm', confidence: 'published', note: '11.5 in, 6 in barrel, 2020 production' },
    barrelLength: { value: 152, unit: 'mm', confidence: 'published', note: '6 in, measured from the cylinder face' },
    mass: { value: 1304, unit: 'g', confidence: 'published', note: '46 oz, 2020 production, unloaded; original Python 6 in was 43.5 oz (1,233 g)' },
    muzzleVelocity: { value: 440, unit: 'm/s', confidence: 'estimated', note: '.357 Magnum 158 gr from a 6 in barrel; ammunition tables range about 400 to 450 m/s' },
    rateOfFire: { value: 'Double-action, six shots', confidence: 'published' },
    effectiveRange: { value: 50, unit: 'm', confidence: 'estimated', note: 'typical service-revolver figure; not stated by the manufacturer' },
    twist: { value: '1 in 14 in (356 mm), LH, 6 grooves', confidence: 'published' },
    sights: 'Ramp front with red insert, fully adjustable rear',
    identification: 'Large-frame revolver with a heavy 6 in barrel carrying a ventilated rib on top and a full-length underlug beneath, a fluted six-shot cylinder that swings out to the left, and oversize checkered walnut target grips. The polished finish (Royal Blue on the original) is part of its reputation.',
    mechanism: 'Trigger stroke raises the hammer against the V-mainspring while the hand pushes the extractor star ratchet to turn the cylinder one sixth of a turn, clockwise, into the bolt. The Colt lock-work holds the cylinder against the bolt at the instant of firing, which is why the design is prized for accuracy and known for demanding hand fitting.',
  },
  provenance: {
    configuration: 'Colt Python, 2020 production, 6 in barrel, stainless steel polished, walnut target grips, adjustable rear sight',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'Colt catalogue, Python 6 in (2020 production) specification', covers: ['overallLength', 'barrelLength', 'height', 'width', 'mass', 'capacity', 'twist', 'sights'] },
      { label: 'Colt Python original catalogue data (1955 to 2005)', covers: ['mass (original)', 'designed'] },
      { label: 'SAAMI .357 Magnum cartridge drawing', covers: ['cartridge'] },
      { label: 'Ammunition manufacturer ballistics tables, .357 Magnum 158 gr, 6 in barrel', covers: ['muzzleVelocity'] },
    ],
    notes: [
      'Origin is the rear face of the cylinder; the barrel is placed from the cylinder gap forward, so the muzzle is at x = 193 mm although the barrel length is 152 mm.',
      'The crane is split into a pivot shaft that leaves the frame and the swinging yoke so that the swing-out and the removal read as two stages.',
      'The crane swings about an axis parallel to the bore (x), which is the real motion; the cylinder ends beside and below the frame.',
      'Chambers are not bored; the cartridges are placed at the chamber positions. The bolt, cylinder stop and firing pin are omitted.',
      'Barrel length is measured from the forcing cone, as revolver barrels are, so the bore line ends at x = 193 mm while the barrel length is 152 mm; the validator note on bore.muzzle is expected.',
      'Composites are built from extrusions only; lathes and the rail builder are used as single geometries.',
    ],
  },
  components,
  actions: {
    cycle: {
      id: 'cycle',
      label: 'Cock the hammer',
      duration: 0.7,
      interruptible: false,
      steps: [
        { component: 'hammer', t: [0.0, 0.38], rotate: [0, 0, 0.6], easing: 'inOutCubic' },
        { component: 'trigger', t: [0.05, 0.38], rotate: [0, 0, -0.08], easing: 'inOutCubic' },
        { component: 'hand', t: [0.05, 0.36], translate: [0, 6, 0], easing: 'inOutCubic' },
        { component: 'cylinder', t: [0.08, 0.36], rotate: [INDEX, 0, 0], easing: 'detent' },
      ],
      audio: [
        { event: 'charge_pull', at: 0.0, component: 'hammer', caption: 'Hammer drawn back to full cock' },
        { event: 'cylinder_index', at: 0.34, component: 'cylinder', caption: 'Cylinder indexes one chamber and locks' },
        { event: 'ui_detent', at: 0.4, component: 'hammer', caption: 'Sear engages' },
      ],
    },
    dryFire: {
      id: 'dryFire',
      label: 'Double-action pull',
      duration: 0.9,
      steps: [
        { component: 'trigger', t: [0.0, 0.42], rotate: [0, 0, -0.25], easing: 'inOutCubic' },
        { component: 'hammer', t: [0.02, 0.42], rotate: [0, 0, 0.6], easing: 'inOutCubic' },
        { component: 'hand', t: [0.02, 0.4], translate: [0, 6, 0], easing: 'inOutCubic' },
        { component: 'cylinder', t: [0.06, 0.4], rotate: [INDEX, 0, 0], easing: 'detent' },
        { component: 'hammer', t: [0.43, 0.48], rotate: [0, 0, 0], easing: 'mechanicalSnap' },
        { component: 'trigger', t: [0.62, 0.82], reset: true, easing: 'outQuad' },
        { component: 'hand', t: [0.62, 0.82], reset: true, easing: 'outQuad' },
      ],
      audio: [
        { event: 'cylinder_index', at: 0.38, component: 'cylinder', caption: 'Cylinder indexes and locks' },
        { event: 'trigger_break', at: 0.43, component: 'trigger', caption: 'Hammer released at the top of the stroke' },
        { event: 'hammer_fall', at: 0.48, component: 'hammer', caption: 'Hammer falls' },
        { event: 'trigger_reset', at: 0.8, component: 'trigger', caption: 'Rebound lever returns the trigger' },
      ],
    },
    reload: {
      id: 'reload',
      label: 'Cylinder out',
      duration: 2.0,
      steps: [
        { component: 'cylinder_release', t: [0.0, 0.1], translate: [-4, 0, 0], easing: 'outQuad' },
        { component: 'crane', t: [0.1, 0.5], rotate: [SWING, 0, 0], easing: 'outBack' },
        { component: 'cylinder_release', t: [0.5, 0.6], reset: true, easing: 'outQuad' },
        { component: 'ejector_rod', t: [0.7, 0.85], translate: [-18, 0, 0], easing: 'inOutCubic' },
        { component: 'extractor_star', t: [0.7, 0.85], translate: [-18, 0, 0], easing: 'inOutCubic' },
        ...Array.from({ length: 6 }, (_, i) => ({ component: `round_${i + 1}`, t: [0.7, 0.85] as [number, number], translate: [-18, 0, 0] as Vec3, easing: 'inOutCubic' as const })),
        { component: 'ejector_rod', t: [0.95, 1.1], reset: true, easing: 'springReturn' },
        { component: 'extractor_star', t: [0.95, 1.1], reset: true, easing: 'springReturn' },
        ...Array.from({ length: 6 }, (_, i) => ({ component: `round_${i + 1}`, t: [0.95, 1.1] as [number, number], reset: true, easing: 'springReturn' as const })),
        { component: 'crane', t: [1.45, 1.8], reset: true, easing: 'inOutCubic' },
      ],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'cylinder_release', caption: 'Latch drawn back' },
        { event: 'cylinder_open', at: 0.15, component: 'crane', caption: 'Cylinder swings out on the crane' },
        { event: 'casing_eject', at: 0.85, component: 'ejector_rod', caption: 'Ejector rod pressed; cases lift on the star' },
        { event: 'bolt_battery', at: 1.8, component: 'cylinder', caption: 'Cylinder swings home and latches' },
      ],
    },
  },
  acoustic: {
    mass: 1304,
    receiver: 'steel-forged',
    action: 'revolver-da-sa',
    reciprocatingMass: 125,
    spring: { frequency: 30, damping: 0.35 },
    furniture: 'wood',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'Closed and locked',
      description: 'Cylinder latched in the frame with the top chamber on the bore, hammer down on the rebound lever.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Cylinder swings out',
      description: 'With the latch drawn back, the crane carries the cylinder out of the left side of the frame and all six chambers are exposed. This is as far as an owner normally goes.',
      camera: 'side-left',
      focus: ['crane', 'cylinder', 'cylinder_release', 'extractor_star'],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'cylinder_release', caption: 'Latch drawn back' },
        { event: 'cylinder_open', at: 0.2, component: 'crane', caption: 'Cylinder swings out' },
      ],
    },
    {
      stage: 2,
      title: 'Crane and cylinder off the frame',
      description: 'The crane screw comes out of the right side of the frame and the crane, still carrying the cylinder, slides forward off its seat.',
      camera: 'iso',
      focus: ['crane_screw', 'crane_shaft', 'crane', 'cylinder'],
      audio: [
        { event: 'pin_push', at: 0.0, component: 'crane_screw', caption: 'Crane screw out' },
        { event: 'component_out', at: 0.3, component: 'crane', caption: 'Crane and cylinder withdrawn' },
      ],
    },
    {
      stage: 3,
      title: 'Sideplate and grips off',
      description: 'Grip screw, grip panels and the fitted sideplate come away from the frame; the sideplate is lifted, never prised, because its fit is what keeps the lock-work in line.',
      camera: 'side',
      focus: ['grip_screw', 'grip_left', 'grip_right', 'sideplate'],
      audio: [
        { event: 'pin_push', at: 0.0, component: 'grip_screw', caption: 'Grip screw out' },
        { event: 'component_out', at: 0.25, component: 'grip_right', caption: 'Grips off' },
        { event: 'component_out', at: 0.5, component: 'sideplate', caption: 'Sideplate lifted' },
      ],
    },
    {
      stage: 4,
      title: 'Lock-work exposed',
      description: 'Hammer, trigger, hand, rebound lever and the V-mainspring lift out of the right side of the frame: the hand-fitted Colt action that the Python is known for.',
      camera: 'detail-action',
      focus: ['hammer', 'trigger', 'hand', 'rebound_lever', 'mainspring'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'hammer', caption: 'Hammer lifted out' },
        { event: 'component_out', at: 0.25, component: 'trigger', caption: 'Trigger and hand out' },
        { event: 'component_out', at: 0.5, component: 'mainspring', caption: 'Mainspring and rebound lever out' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis: barrel and ejector rod forward, sights up, cylinder off the crane, cartridges out of the chambers.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 292 mm', from: [-93, -140, 0], to: [MUZZLE, -140, 0] },
      { label: 'Barrel 152 mm', from: [BARREL_START, 32, 0], to: [MUZZLE, 32, 0] },
    ],
  },
  cartridge: { caseDiameter: 9.6, caseLength: 33.0, bulletDiameter: 9.07, bulletLength: 16, rimDiameter: 11.2, label: '.357 Magnum' },
  ejection: { position: [0, CYL_AXIS - 20, -24], direction: [-0.4, -0.85, -0.3] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default coltPython;
