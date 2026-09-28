import type { ComponentDef, FirearmDefinition, GeometrySpec, Vec2, Vec3 } from '@/firearm/schema';

/**
 * Accuracy International AX338 (AXMC pattern), 27 in barrel, folding stock
 * extended, full-length rail, bipod folded, no optic fitted.
 *
 * Frame: bore axis y=0, bolt face (in battery) at x=0, +x toward the muzzle,
 * +z shooter's right. All dimensions mm.
 *
 * Published dimensions: overall 1,250 mm (stock extended, 27 in barrel),
 * barrel 686 mm, mass 6.8 kg without scope (Accuracy International AX338 /
 * AXMC product data). The action is a steel flat-bottomed turn-bolt with a
 * 60 degree lift; the chassis is an aluminium folding-stock A-frame. Internal
 * layout is estimated from the AX pattern and marked as such; it is a
 * visualisation, not a machining reference.
 */

// ---- layout constants (mm) --------------------------------------------------
const MUZZLE = 686; // barrel length from the bolt face
const BRAKE_TIP = 771; // front face of the muzzle brake
const BUTT = -479; // rear face of the butt pad
const ACTION_REAR = -178;
const ACTION_FRONT = 42;
const ACTION_R = 17.5; // action body radius
const ACTION_BASE = -16; // flat underside of the action = chassis top
const RAIL_Y = 19;
const FOREND_START = 62;
const FOREND_LENGTH = 240;
const HINGE: Vec3 = [-214, -20, -25]; // folding-stock hinge axis (vertical)
const BOLT_TRAVEL = 105;
const BOLT_LIFT = -Math.PI / 3; // 60 degree lift, rotates about x
const HANDLE_REST = 0.44; // 25 degrees below horizontal, pointing right

const chassisProfile: Vec2[] = [
  [-212, ACTION_BASE],
  [58, ACTION_BASE],
  [58, -50],
  [40, -54],
  [-98, -54],
  [-118, -58],
  [-186, -58],
  [-200, -50],
  [-212, -40],
];

const gripProfile: Vec2[] = [
  [-128, -56],
  [-182, -56],
  [-212, -150],
  [-214, -158],
  [-178, -160],
  [-160, -130],
  [-140, -90],
  [-128, -66],
];

// Folding stock: top line below the bolt axis so the shroud clears it at full travel.
const stockProfile: Vec2[] = [
  [-216, -14],
  [-300, -15],
  [-459, -18],
  [-459, -86],
  [-440, -88],
  [-400, -72],
  [-320, -54],
  [-250, -46],
  [-226, -38],
  [-216, -32],
];

// 10-round double-stack .338 magazine: 104 mm long, hangs 58 mm below the chassis.
const magProfile: Vec2[] = [
  [-22, ACTION_BASE],
  [82, ACTION_BASE],
  [82, -108],
  [76, -112],
  [-16, -112],
  [-22, -106],
];

const triggerProfile: Vec2[] = [
  [0, 4],
  [8, 4],
  [8, -3],
  [6, -14],
  [2, -24],
  [-4, -31],
  [-11, -32],
  [-10, -22],
  [-6, -10],
  [-5, -2],
];

const triggerGuard: GeometrySpec = {
  kind: 'composite',
  parts: [
    { geometry: { kind: 'box', size: [6, 22, 14] }, position: [-62, -66, 0] },
    { geometry: { kind: 'box', size: [74, 5, 14], radius: 1.5 }, position: [-96, -78, 0] },
    { geometry: { kind: 'box', size: [6, 24, 14] }, position: [-130, -68, 0] },
  ],
};

// Octagonal KeySlot forend section, drawn in the (-z, y) plane, extruded along x.
const forendOuter: Vec2[] = Array.from({ length: 16 }, (_, i): Vec2 => {
  const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
  return [Math.cos(a) * 23, Math.sin(a) * 23];
});
const forendInner: Vec2[] = Array.from({ length: 24 }, (_, i): Vec2 => {
  const a = (i / 24) * Math.PI * 2;
  return [Math.cos(a) * 18.5, Math.sin(a) * 18.5];
});

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver / action body
  {
    id: 'action_body',
    name: 'Action body',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Alloy steel, flat-bottomed, phosphate finish',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: ACTION_R, length: ACTION_FRONT - ACTION_REAR, segments: 40 }, position: [(ACTION_FRONT + ACTION_REAR) / 2, 0, 0] },
        // flat base that bolts to the chassis
        { geometry: { kind: 'box', size: [ACTION_FRONT - ACTION_REAR, 12, 36], radius: 1 }, position: [(ACTION_FRONT + ACTION_REAR) / 2, -10, 0] },
        // front ring where the forend bridges onto the action
        { geometry: { kind: 'lathe', profile: [[ACTION_R, 0], [24, 0], [24, 20], [ACTION_R, 20]], segments: 32 }, position: [ACTION_FRONT, 0, 0] },
        // rear tang
        { geometry: { kind: 'box', size: [22, 14, 30], radius: 2 }, position: [ACTION_REAR - 4, -8, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Steel body that carries the barrel, guides the bolt and locks the three bolt lugs; the flat underside bolts to the aluminium chassis.',
    notes: ['Bolt lift 60 degrees, three-lug lock-up', 'Ejection port on the right, loading port over the magazine'],
    confidence: 'estimated',
    adjacent: ['chassis', 'barrel', 'bolt_body', 'top_rail', 'trigger_housing', 'forend'],
    mass: 1150,
    thermal: 0.3,
  },
  {
    id: 'top_rail',
    name: 'Full-length top rail',
    group: 'sights',
    material: 'anodised-aluminium-black',
    materialLabel: 'Aluminium, hardcoat anodised; action section 20 MOA',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'rail', length: 470, width: 21.2, height: 6 }, position: [0, 0, 0] },
        // riser over the action so the rail bridges action and forend at one height
        { geometry: { kind: 'box', size: [214, 3, 21.2] }, position: [-128, -1.5, 0] },
      ],
    },
    position: [63, RAIL_Y, 0],
    function: 'Continuous MIL-STD-1913 rail from the rear of the action to the front of the forend for a day scope, clip-on night sight and laser in one line.',
    confidence: 'estimated',
    adjacent: ['action_body', 'forend'],
    strip: { stage: 5, offset: [0, 90, 0], order: 0, motion: 'up' },
    mass: 260,
    thermal: 0.15,
  },
  {
    id: 'action_screws',
    name: 'Action screws (2)',
    group: 'receiver',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 36, axis: 'y' }, position: [-150, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 4, length: 36, axis: 'y' }, position: [28, 0, 0] },
      ],
    },
    position: [0, -34, 0],
    function: 'Two screws up through the chassis into the action base; they are the only fasteners between the barrelled action and the chassis.',
    confidence: 'estimated',
    adjacent: ['action_body', 'chassis'],
    strip: { stage: 3, offset: [0, -70, 0], order: 0, motion: 'down' },
    mass: 30,
    internal: true,
  },
  {
    id: 'bolt_stop',
    name: 'Bolt release lever',
    group: 'receiver',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [30, 9, 5], radius: 1.5 }, position: [0, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 3, length: 8, axis: 'z' }, position: [12, 0, -2] },
      ],
    },
    position: [-150, 4, -20],
    pivot: [12, 0, 0],
    function: 'Left-side lever that stops the bolt at the end of its travel; pressed to let the bolt out of the action.',
    confidence: 'estimated',
    adjacent: ['action_body', 'bolt_body'],
    strip: { stage: 5, offset: [0, 0, -50], order: 2, motion: 'left' },
    mass: 12,
  },

  // ------------------------------------------------------------ barrel / muzzle
  {
    id: 'barrel',
    name: 'Barrel, 27 in heavy fluted',
    group: 'barrel',
    material: 'parkerised-steel',
    materialLabel: 'Stainless steel match barrel, 1 in 9.35 in twist, phosphate/black finish',
    geometry: {
      kind: 'lathe',
      profile: [
        [0, -6], [14, -6], [14, 38], [15, 40], [15, 130], [13, 175], [13, 560], [12.4, 566], [12.4, 664], [9, 666], [9, MUZZLE], [4.3, MUZZLE], [0, MUZZLE],
      ],
      segments: 48,
    },
    position: [0, 0, 0],
    function: 'Free-floating 686 mm match barrel; the threaded tenon screws into the action and the muzzle is threaded for the brake.',
    notes: ['Length 686 mm measured from the bolt face', 'Longitudinal flutes are not modelled; the profile is shown smooth'],
    confidence: 'published',
    adjacent: ['action_body', 'muzzle_brake', 'forend'],
    strip: { stage: 5, offset: [60, 0, 0], order: 1, motion: 'forward' },
    mass: 2300,
    thermal: 0.7,
  },
  {
    id: 'muzzle_brake',
    name: 'Muzzle brake, double chamber',
    group: 'muzzle',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[9.2, -20], [15, -20], [15, 0], [17, 2], [17, 82], [15, 85], [6, 85], [6, 84], [0, 84]], segments: 36 }, position: [0, 0, 0] },
        // two baffle chambers: side ports cut as thin recesses either side
        { geometry: { kind: 'box', size: [22, 22, 4] }, position: [22, 0, 17] },
        { geometry: { kind: 'box', size: [22, 22, 4] }, position: [22, 0, -17] },
        { geometry: { kind: 'box', size: [22, 22, 4] }, position: [54, 0, 17] },
        { geometry: { kind: 'box', size: [22, 22, 4] }, position: [54, 0, -17] },
      ],
    },
    position: [MUZZLE, 0, 0],
    function: 'Two expansion chambers vent gas sideways and rearward, cutting recoil so the firer can see the strike through the scope.',
    notes: ['Overall length to the brake face 771 mm'],
    confidence: 'estimated',
    adjacent: ['barrel'],
    strip: { stage: 5, offset: [220, 0, 0], order: 0, motion: 'forward' },
    mass: 260,
    thermal: 0.85,
  },

  // ------------------------------------------------------------ chassis / furniture
  {
    id: 'chassis',
    name: 'Chassis, folding A-frame',
    group: 'furniture',
    material: 'anodised-aluminium-black',
    materialLabel: 'Aluminium alloy chassis, hardcoat anodised, polymer side panels',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: chassisProfile, depth: 56, bevel: 2 } },
        // hinge knuckle on the left rear
        { geometry: { kind: 'box', size: [24, 44, 14], radius: 3 }, position: [HINGE[0], HINGE[1], HINGE[2] + 1] },
      ],
    },
    position: [0, 0, 0],
    function: 'Aluminium A-frame that beds the action on its flat base, houses the magazine well and carries the grip and folding stock.',
    confidence: 'estimated',
    adjacent: ['action_body', 'action_screws', 'magazine', 'pistol_grip', 'stock', 'trigger_guard'],
    strip: { stage: 3, offset: [0, -150, 0], order: 1, motion: 'down' },
    mass: 1400,
    thermal: 0.1,
  },
  {
    id: 'forend',
    name: 'KeySlot forend',
    group: 'furniture',
    material: 'anodised-aluminium-black',
    materialLabel: 'Aluminium tube with KeySlot accessory interface',
    geometry: { kind: 'extrude', shape: forendOuter, holes: [forendInner], depth: FOREND_LENGTH, axis: 'x' },
    position: [FOREND_START + FOREND_LENGTH / 2, -3, 0],
    function: 'Octagonal tube fixed to the front of the action; the barrel floats inside it and accessories key into the slots.',
    confidence: 'estimated',
    adjacent: ['action_body', 'barrel', 'top_rail', 'bipod'],
    strip: { stage: 5, offset: [380, 0, 0], order: 2, motion: 'forward' },
    mass: 520,
    thermal: 0.2,
  },
  {
    id: 'bipod',
    name: 'Bipod, folded forward',
    group: 'accessory',
    material: 'anodised-aluminium-black',
    materialLabel: 'Aluminium legs, steel feet',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [40, 14, 48], radius: 3 }, position: [0, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 7, length: 160 }, position: [95, -4, 26] },
        { geometry: { kind: 'cylinder', radius: 7, length: 160 }, position: [95, -4, -26] },
        { geometry: { kind: 'cylinder', radius: 9, length: 18 }, position: [182, -4, 26] },
        { geometry: { kind: 'cylinder', radius: 9, length: 18 }, position: [182, -4, -26] },
      ],
    },
    position: [270, -34, 0],
    pivot: [0, 0, 0],
    function: 'Two spring-loaded legs swing forward along the forend when folded and drop to support the rifle for prone shooting.',
    confidence: 'estimated',
    adjacent: ['forend'],
    strip: { stage: 5, offset: [0, -90, 0], order: 3, motion: 'down' },
    mass: 480,
  },
  {
    id: 'pistol_grip',
    name: 'Pistol grip',
    group: 'furniture',
    material: 'polymer-black',
    materialLabel: 'Glass-filled polymer',
    geometry: { kind: 'extrude', shape: gripProfile, depth: 32, bevel: 3, curveSegments: 6 },
    position: [0, 0, 0],
    parent: 'chassis',
    function: 'Vertical grip bolted to the chassis behind the trigger; interchangeable for hand size.',
    confidence: 'estimated',
    adjacent: ['chassis', 'trigger'],
    strip: { stage: 5, offset: [0, -80, 0], order: 2, motion: 'down' },
    mass: 110,
  },
  {
    id: 'trigger_guard',
    name: 'Trigger guard',
    group: 'furniture',
    material: 'anodised-aluminium-black',
    geometry: triggerGuard,
    position: [0, 0, 0],
    parent: 'chassis',
    function: 'Open aluminium guard bolted under the chassis; deep enough for a gloved finger.',
    confidence: 'estimated',
    adjacent: ['chassis', 'trigger'],
    strip: { stage: 5, offset: [0, -60, 0], order: 3, motion: 'down' },
    mass: 30,
  },
  {
    id: 'mag_release',
    name: 'Magazine release lever',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [10, 24, 14], radius: 2 },
    position: [-40, -66, 0],
    pivot: [0, 12, 0],
    parent: 'chassis',
    function: 'Paddle ahead of the trigger guard; pushed forward it lifts the catch out of the magazine and the magazine drops free.',
    confidence: 'estimated',
    adjacent: ['chassis', 'magazine'],
    strip: { stage: 5, offset: [0, -40, 30], order: 3, motion: 'right' },
    mass: 15,
  },
  {
    id: 'hinge_pin',
    name: 'Stock hinge pin',
    group: 'furniture',
    material: 'stainless-steel',
    geometry: { kind: 'cylinder', radius: 5, length: 52, axis: 'y' },
    position: HINGE,
    parent: 'chassis',
    function: 'Vertical pin on the left rear of the chassis about which the stock folds.',
    confidence: 'estimated',
    adjacent: ['chassis', 'stock'],
    strip: { stage: 5, offset: [0, 70, 0], order: 1, motion: 'up' },
    mass: 20,
  },
  {
    id: 'stock',
    name: 'Folding stock',
    group: 'furniture',
    material: 'polymer-black',
    materialLabel: 'Aluminium spine with polymer shell',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: stockProfile, depth: 40, bevel: 3, curveSegments: 6 } },
        // hinge knuckle on the stock side, mates with the chassis knuckle
        { geometry: { kind: 'box', size: [22, 40, 12], radius: 3 }, position: [HINGE[0] - 4, HINGE[1], HINGE[2] - 12] },
      ],
    },
    position: [0, 0, 0],
    pivot: HINGE,
    parent: 'chassis',
    function: 'Folds to the left about the hinge pin to shorten the rifle for transport; locks straight for firing.',
    notes: ['Shown extended (1,250 mm overall)', 'Folds left, around the hinge on the chassis rear'],
    confidence: 'estimated',
    adjacent: ['chassis', 'hinge_pin', 'cheek_piece', 'butt_pad', 'monopod'],
    strip: { stage: 5, offset: [-120, -20, 0], order: 0, motion: 'rear' },
    mass: 620,
  },
  {
    id: 'cheek_piece',
    name: 'Adjustable cheek piece',
    group: 'furniture',
    material: 'polymer-black',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [100, 20, 34], radius: 4 }, position: [0, -2, 0] },
        { geometry: { kind: 'cylinder', radius: 4, length: 24, axis: 'y' }, position: [-30, -18, 0] },
        { geometry: { kind: 'cylinder', radius: 4, length: 24, axis: 'y' }, position: [30, -18, 0] },
      ],
    },
    // children of the stock are relative to its hinge pivot
    position: [-368 - HINGE[0], -HINGE[1], -HINGE[2]],
    parent: 'stock',
    function: 'Rises on two posts to put the eye on the scope axis; sits far enough back to clear the bolt shroud at full travel.',
    confidence: 'estimated',
    adjacent: ['stock'],
    strip: { stage: 5, offset: [0, 60, 0], order: 1, motion: 'up' },
    mass: 90,
  },
  {
    id: 'butt_pad',
    name: 'Butt pad',
    group: 'furniture',
    material: 'rubber-black',
    geometry: { kind: 'box', size: [20, 82, 42], radius: 3 },
    position: [BUTT + 10 - HINGE[0], -50 - HINGE[1], -HINGE[2]],
    parent: 'stock',
    function: 'Rubber pad; spacers behind it set the length of pull.',
    confidence: 'estimated',
    adjacent: ['stock'],
    strip: { stage: 5, offset: [-60, 0, 0], order: 2, motion: 'rear' },
    mass: 70,
  },
  {
    id: 'monopod',
    name: 'Rear monopod',
    group: 'accessory',
    material: 'anodised-aluminium-black',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 6, length: 36, axis: 'y' }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [30, 6, 20], radius: 2 }, position: [0, -20, 0] },
      ],
    },
    position: [-438 - HINGE[0], -104 - HINGE[1], -HINGE[2]],
    parent: 'stock',
    function: 'Screw-adjusted spike under the butt that holds the rifle at elevation without the firer supporting it.',
    confidence: 'estimated',
    adjacent: ['stock'],
    strip: { stage: 5, offset: [0, -60, 0], order: 3, motion: 'down' },
    mass: 60,
  },

  // ------------------------------------------------------------ bolt group
  {
    id: 'bolt_body',
    name: 'Bolt body',
    group: 'action',
    material: 'nitride-steel',
    materialLabel: 'Alloy steel, ground; three locking lugs at the head',
    geometry: {
      kind: 'lathe',
      profile: [[0, -152], [9, -152], [9, -140], [10, -138], [10, -14], [9.5, -14], [9.5, 0], [0, 0]],
      segments: 36,
    },
    position: [0, 0, 0],
    function: 'Turns 60 degrees to unlock and travels 105 mm to extract, eject and feed the next round; the handle, head, firing pin and shroud ride with it.',
    notes: ['Bolt travel 105 mm', 'Reciprocating mass about 420 g with the shroud'],
    confidence: 'estimated',
    adjacent: ['action_body', 'bolt_head', 'bolt_handle', 'firing_pin', 'bolt_shroud', 'bolt_stop'],
    strip: { stage: 2, offset: [-330, 0, 0], order: 0, motion: 'rear' },
    mass: 300,
    thermal: 0.35,
  },
  {
    id: 'bolt_handle',
    name: 'Bolt handle',
    group: 'action',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 12, length: 14 }, position: [0, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 5.5, length: 50, axis: 'z' }, position: [0, 0, 34] },
      ],
    },
    position: [-128, 0, 0],
    rotation: [HANDLE_REST, 0, 0],
    pivot: [0, 0, 0],
    parent: 'bolt_body',
    function: 'Lifts 60 degrees about the bolt axis to unlock the lugs, then draws the bolt back; the short throw clears a scope with a large ocular.',
    confidence: 'estimated',
    adjacent: ['bolt_body', 'bolt_knob', 'action_body'],
    strip: { stage: 5, offset: [0, 0, 60], order: 1, motion: 'right' },
    mass: 60,
  },
  {
    id: 'bolt_knob',
    name: 'Bolt knob',
    group: 'action',
    material: 'polymer-black',
    materialLabel: 'Polymer over a steel stud',
    geometry: { kind: 'sphere', radius: 12 },
    position: [0, 0, 64],
    parent: 'bolt_handle',
    function: 'Oversize knob at the end of the handle for a gloved hand.',
    confidence: 'estimated',
    adjacent: ['bolt_handle'],
    mass: 25,
  },
  {
    id: 'bolt_head',
    name: 'Bolt head, three lugs',
    group: 'action',
    material: 'steel-worn',
    materialLabel: 'Alloy steel, three symmetrical locking lugs',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, -14], [9.5, -14], [9.5, -1], [8.5, 0], [0, 0]], segments: 28 } },
        ...Array.from({ length: 3 }, (_, i): { geometry: GeometrySpec; position: Vec3; rotation: Vec3 } => {
          const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
          return { geometry: { kind: 'box', size: [12, 4.5, 7] }, position: [-7, Math.cos(a) * 11.5, Math.sin(a) * 11.5], rotation: [-a, 0, 0] };
        }),
      ],
    },
    position: [0, 0, 0],
    pivot: [0, 0, 0],
    parent: 'bolt_body',
    function: 'Three lugs turn 60 degrees into recesses in the action to lock the breech; the extractor claw sits in the head face.',
    confidence: 'estimated',
    adjacent: ['bolt_body', 'extractor', 'action_body', 'barrel'],
    strip: { stage: 4, offset: [60, 0, 0], order: 3, motion: 'forward' },
    mass: 45,
    thermal: 0.45,
  },
  {
    id: 'extractor',
    name: 'Extractor',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [12, 4, 3.5], radius: 0.8 },
    position: [-6, 0, 9],
    parent: 'bolt_head',
    function: 'Spring-loaded claw in the bolt face grips the rim and draws the fired case from the chamber.',
    confidence: 'estimated',
    adjacent: ['bolt_head'],
    strip: { stage: 4, offset: [0, 0, 30], order: 3, motion: 'right' },
    mass: 6,
    internal: true,
  },
  {
    id: 'firing_pin',
    name: 'Firing pin',
    group: 'action',
    material: 'chrome',
    materialLabel: 'Tool steel, polished',
    geometry: { kind: 'lathe', profile: [[0, -196], [4, -196], [4, -150], [2.6, -146], [2.6, -6], [1.2, -2], [0, -2]], segments: 20 },
    position: [0, 0, 0],
    parent: 'bolt_body',
    function: 'Runs the length of the bolt; the cocking piece behind it holds it back against its spring until the sear releases.',
    confidence: 'estimated',
    adjacent: ['bolt_body', 'cocking_piece', 'bolt_head', 'trigger_housing'],
    strip: { stage: 4, offset: [-230, 0, 0], order: 2, motion: 'rear' },
    mass: 35,
    internal: true,
  },
  {
    id: 'cocking_piece',
    name: 'Cocking piece',
    group: 'action',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, -176], [8, -176], [8, -152], [0, -152]], segments: 24 } },
        { geometry: { kind: 'box', size: [14, 10, 6], radius: 1 }, position: [-166, -10, 0] },
      ],
    },
    position: [0, 0, 0],
    parent: 'bolt_body',
    function: 'Threads onto the firing pin; its lug rides the cam on the bolt so the lift cocks the pin, and the sear holds it.',
    confidence: 'estimated',
    adjacent: ['firing_pin', 'bolt_shroud', 'bolt_body'],
    strip: { stage: 4, offset: [-90, -45, 0], order: 1, motion: 'rear' },
    mass: 40,
    internal: true,
  },
  {
    id: 'bolt_shroud',
    name: 'Bolt shroud',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'lathe', profile: [[9.5, -198], [12, -196], [12, -150], [10, -150]], segments: 32 },
    position: [0, 0, 0],
    parent: 'bolt_body',
    function: 'Screws onto the rear of the bolt body and covers the cocking piece; the safety acts on the pin through it.',
    confidence: 'estimated',
    adjacent: ['bolt_body', 'cocking_piece', 'safety_lever'],
    strip: { stage: 4, offset: [-120, 45, 0], order: 0, motion: 'rear' },
    mass: 45,
  },

  // ------------------------------------------------------------ fire control
  {
    id: 'trigger_housing',
    name: 'Trigger unit, two-stage',
    group: 'fire-control',
    material: 'parkerised-steel',
    materialLabel: 'Steel housing, adjustable sear engagement',
    geometry: { kind: 'box', size: [70, 30, 24], radius: 2 },
    position: [-118, -33, 0],
    parent: 'action_body',
    function: 'Self-contained two-stage unit bolted under the action; the sear holds the cocking piece until the second stage breaks.',
    notes: ['Pull weight adjustable, published range about 1.5 to 2 kgf'],
    confidence: 'estimated',
    adjacent: ['action_body', 'trigger', 'cocking_piece', 'safety_lever'],
    strip: { stage: 5, offset: [0, -70, 0], order: 1, motion: 'down' },
    mass: 160,
    internal: true,
  },
  {
    id: 'trigger',
    name: 'Trigger blade',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: triggerProfile, depth: 8, bevel: 0.6 },
    position: [-96, -48, 0],
    pivot: [0, 4, 0],
    parent: 'action_body',
    function: 'Takes up the first stage then breaks the sear; the blade position is adjustable fore and aft.',
    confidence: 'estimated',
    adjacent: ['trigger_housing', 'trigger_guard', 'pistol_grip'],
    strip: { stage: 5, offset: [0, -70, -40], order: 1, motion: 'left' },
    mass: 15,
  },
  {
    id: 'safety_lever',
    name: 'Safety lever, three position',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [28, 8, 5], radius: 2 }, position: [-12, 0, 2] },
        { geometry: { kind: 'cylinder', radius: 4.5, length: 8, axis: 'z' }, position: [0, 0, 0] },
      ],
    },
    position: [-168, 6, 20],
    pivot: [0, 0, 0],
    function: 'Thumb lever on the right of the tang: rearward locks bolt and firing pin, middle frees the bolt for unloading, forward is fire.',
    notes: ['Rest pose is SAFE (lever rearward)'],
    confidence: 'estimated',
    adjacent: ['action_body', 'bolt_shroud', 'trigger_housing'],
    strip: { stage: 5, offset: [0, 0, 50], order: 2, motion: 'right' },
    mass: 18,
  },

  // ------------------------------------------------------------ feed
  {
    id: 'magazine',
    name: 'Magazine, 10-round',
    group: 'feed',
    material: 'parkerised-steel',
    materialLabel: 'Steel box, double stack, polymer follower',
    geometry: { kind: 'extrude', shape: magProfile, depth: 34, bevel: 2, curveSegments: 6 },
    position: [0, 0, 0],
    function: 'Double-stack steel box holding ten .338 Lapua Magnum rounds; seats in the chassis well below the loading port.',
    notes: ['Overall height about 96 mm, 58 mm proud of the chassis'],
    confidence: 'estimated',
    adjacent: ['chassis', 'mag_release', 'follower', 'bolt_head'],
    strip: { stage: 1, offset: [0, -150, 0], motion: 'down' },
    mass: 280,
  },
  {
    id: 'follower',
    name: 'Follower',
    group: 'feed',
    material: 'polymer-black',
    geometry: { kind: 'box', size: [88, 8, 30], radius: 2 },
    position: [30, -76, 0],
    parent: 'magazine',
    function: 'Lifts the staggered stack so the top round sits against the feed lips for the bolt to strip.',
    confidence: 'estimated',
    adjacent: ['magazine', 'magazine_spring'],
    strip: { stage: 5, offset: [0, 70, 0], order: 1, motion: 'up' },
    mass: 12,
    internal: true,
  },
  {
    id: 'magazine_spring',
    name: 'Magazine spring',
    group: 'feed',
    material: 'stainless-steel',
    geometry: { kind: 'spring', radius: 12, length: 28, turns: 4, wire: 1.4, axis: 'y' },
    position: [30, -94, 0],
    parent: 'magazine',
    function: 'Compressed under the follower; supplies the lift for the whole ten-round stack.',
    confidence: 'estimated',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, 45, 0], order: 2, motion: 'up' },
    mass: 20,
    internal: true,
  },
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `round_${i + 1}`,
    name: `Cartridge, .338 Lapua Magnum (${i + 1})`,
    group: 'ammunition' as const,
    material: 'brass' as const,
    geometry: { kind: 'cartridge' as const, caseDiameter: 14.91, caseLength: 69.2, bulletDiameter: 8.61, bulletLength: 41, rimDiameter: 14.93, shoulder: 0.78 },
    position: [-16, -26 - i * 14, i % 2 === 0 ? 7 : -7] as Vec3,
    parent: 'magazine',
    function: 'Staggered in the magazine; the bolt strips the top round forward into the chamber on each closing stroke.',
    confidence: 'published' as const,
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5 as const, offset: [0, 40 + i * 14, 0] as Vec3, order: 3, motion: 'up' as const },
    mass: 47,
    internal: true,
  })),
];

export const aiax338: FirearmDefinition = {
  id: 'aiax338',
  name: 'Accuracy International AX338',
  shortName: 'AX338',
  spec: {
    manufacturer: 'Accuracy International Ltd, Portsmouth',
    designation: 'AX338 (AXMC pattern), .338 Lapua Magnum',
    origin: 'United Kingdom',
    designed: { value: 2010, confidence: 'published', note: 'AX series introduced 2010; AXMC multi-calibre variant 2014' },
    category: 'sniper',
    categoryLabel: 'Bolt-action precision rifle',
    cartridge: '.338 Lapua Magnum',
    action: 'turn-bolt',
    actionLabel: 'Manual turn-bolt, three lugs, 60 degree lift',
    feed: 'box-magazine',
    capacity: { value: '10-round detachable double-stack box', confidence: 'published' },
    overallLength: { value: 1250, unit: 'mm', confidence: 'published', note: 'stock extended, 27 in barrel, with muzzle brake' },
    overallLengthCollapsed: { value: 1000, unit: 'mm', confidence: 'estimated', note: 'stock folded; derived from the modelled butt section' },
    barrelLength: { value: 686, unit: 'mm', confidence: 'published', note: '27 in' },
    mass: { value: 6800, unit: 'g', confidence: 'published', note: 'without scope, 27 in barrel' },
    muzzleVelocity: { value: 915, unit: 'm/s', confidence: 'published', note: 'Lapua 250 gr Scenar, nominal from a 27 in barrel' },
    rateOfFire: { value: null, confidence: 'unverified', note: 'N/A' },
    effectiveRange: { value: 1500, unit: 'm', confidence: 'estimated', note: 'not published by the maker; figure commonly cited for .338 Lapua Magnum service rifles' },
    twist: { value: '1 in 9.35 in (237 mm), RH', confidence: 'published' },
    sights: 'No iron sights; full-length MIL-STD-1913 rail, 20 MOA over the action, shown without an optic',
    identification: 'Long, heavy fluted barrel ending in a squat double-chamber brake, an octagonal forend under a rail that runs the whole length, a skeletal folding stock with a raised cheek piece, and a bolt knob the size of a golf ball on the right.',
    mechanism: 'A manually operated turn-bolt. Lifting the handle 60 degrees turns three lugs out of their recesses and cocks the firing pin; drawing the bolt back 105 mm extracts and ejects, and the closing stroke strips a round from the double-stack magazine and locks the lugs again.',
  },
  provenance: {
    configuration: 'AX338 (AXMC pattern), 27 in fluted barrel with double-chamber muzzle brake, full-length top rail, KeySlot forend, folding stock extended with adjustable cheek piece and monopod, bipod folded forward, 10-round magazine, no optic',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'Accuracy International AX338 / AXMC product data sheet', covers: ['overallLength', 'barrelLength', 'mass', 'capacity', 'twist', 'actionLabel'] },
      { label: 'Lapua .338 Lapua Magnum ballistics data, 250 gr Scenar', covers: ['muzzleVelocity'] },
      { label: 'C.I.P. TDCC, .338 Lapua Magnum', covers: ['cartridge'] },
      { label: 'MIL-STD-1913 rail dimensions', covers: ['rail geometry'] },
    ],
    notes: [
      'Exterior proportions follow published dimensions; the internal layout of the bolt, trigger unit and chassis is estimated from the AX pattern.',
      'Barrel flutes are not modelled; the barrel is shown as a smooth stepped profile.',
      'The forend is treated as fixed to the action and the chassis separates downward with the stock and grip; the exact bedding hardware is simplified.',
      'Folded length is derived from the model, not from a maker figure.',
    ],
  },
  components,
  actions: {
    cycle: {
      id: 'cycle',
      label: 'Cycle the bolt',
      duration: 1.7,
      interruptible: false,
      steps: [
        { component: 'bolt_handle', t: [0.0, 0.28], rotate: [BOLT_LIFT, 0, 0], easing: 'inOutCubic' },
        { component: 'bolt_head', t: [0.0, 0.28], rotate: [BOLT_LIFT, 0, 0], easing: 'inOutCubic' },
        { component: 'bolt_body', t: [0.32, 0.72], translate: [-BOLT_TRAVEL, 0, 0], easing: 'inOutCubic' },
        { component: 'bolt_body', t: [0.92, 1.3], reset: true, easing: 'inOutCubic' },
        { component: 'bolt_handle', t: [1.36, 1.6], reset: true, easing: 'inOutCubic' },
        { component: 'bolt_head', t: [1.36, 1.6], reset: true, easing: 'inOutCubic' },
      ],
      audio: [
        { event: 'bolt_lift', at: 0.02, component: 'bolt_handle', caption: 'Bolt handle lifts 60 degrees; lugs unlock, firing pin cocks' },
        { event: 'charge_pull', at: 0.34, component: 'bolt_body', caption: 'Bolt drawn rearward 105 mm; case extracted and ejected' },
        { event: 'bolt_close', at: 0.94, component: 'bolt_body', caption: 'Bolt runs forward and strips a round from the magazine' },
        { event: 'bolt_battery', at: 1.58, component: 'bolt_head', caption: 'Handle turns down; three lugs lock' },
      ],
    },
    dryFire: {
      id: 'dryFire',
      label: 'Dry fire',
      duration: 0.75,
      steps: [
        { component: 'trigger', t: [0.0, 0.12], rotate: [0, 0, -0.06], easing: 'inQuad' },
        { component: 'trigger', t: [0.12, 0.2], rotate: [0, 0, -0.12], easing: 'inQuad' },
        { component: 'firing_pin', t: [0.2, 0.25], translate: [6, 0, 0], easing: 'mechanicalSnap' },
        { component: 'cocking_piece', t: [0.2, 0.25], translate: [6, 0, 0], easing: 'mechanicalSnap' },
        { component: 'trigger', t: [0.45, 0.62], reset: true, easing: 'outQuad' },
      ],
      audio: [
        { event: 'trigger_break', at: 0.2, component: 'trigger', caption: 'Second stage breaks' },
        { event: 'striker_fall', at: 0.24, component: 'firing_pin', caption: 'Firing pin falls 6 mm onto the primer' },
        { event: 'trigger_reset', at: 0.6, component: 'trigger', caption: 'Trigger resets to the first stage' },
      ],
    },
    reload: {
      id: 'reload',
      label: 'Magazine change',
      duration: 1.6,
      steps: [
        { component: 'mag_release', t: [0.0, 0.1], rotate: [0, 0, 0.35], easing: 'outQuad' },
        { component: 'magazine', t: [0.08, 0.42], translate: [0, -140, 0], easing: 'outQuad' },
        { component: 'mag_release', t: [0.35, 0.45], reset: true, easing: 'outQuad' },
        { component: 'magazine', t: [0.95, 1.15], reset: true, easing: 'mechanicalSnap' },
      ],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_release', caption: 'Release paddle pushed forward' },
        { event: 'mag_out', at: 0.12, component: 'magazine', caption: 'Magazine drops from the chassis well' },
        { event: 'mag_seat', at: 1.14, component: 'magazine', caption: 'Magazine seats and the catch snaps over' },
      ],
    },
    safety: {
      id: 'safety',
      label: 'Safety',
      duration: 0.4,
      steps: [{ component: 'safety_lever', t: [0.0, 0.25], rotate: [0, 0, -0.55], easing: 'detent' }],
      audio: [{ event: 'selector', at: 0.22, component: 'safety_lever', caption: 'Safety lever forward to FIRE' }],
    },
    extra: [
      {
        id: 'fold',
        label: 'Fold stock',
        duration: 2.1,
        steps: [
          { component: 'stock', t: [0.0, 0.8], rotate: [0, -Math.PI, 0], easing: 'inOutCubic' },
          { component: 'stock', t: [1.3, 2.05], reset: true, easing: 'inOutCubic' },
        ],
        audio: [
          { event: 'component_out', at: 0.05, component: 'stock', caption: 'Stock unlatched and folded to the left' },
          { event: 'component_seat', at: 2.0, component: 'stock', caption: 'Stock locks straight' },
        ],
        camera: 'top',
      },
    ],
  },
  acoustic: {
    mass: 6800,
    receiver: 'steel-forged',
    action: 'turn-bolt',
    reciprocatingMass: 420,
    spring: { frequency: 22, damping: 0.36 },
    furniture: 'polymer',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'In battery',
      description: 'Fully assembled, bolt closed and locked on three lugs, magazine seated, stock extended.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Magazine withdrawn',
      description: 'The ten-round box drops out of the chassis well; with the bolt open the rifle is then visibly empty.',
      camera: 'side',
      focus: ['magazine', 'mag_release', 'chassis'],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_release', caption: 'Release paddle pushed' },
        { event: 'mag_out', at: 0.15, component: 'magazine', caption: 'Magazine withdrawn' },
      ],
    },
    {
      stage: 2,
      title: 'Bolt withdrawn',
      description: 'With the bolt release held, the bolt slides straight out of the rear of the action, taking handle, head, firing pin and shroud with it.',
      camera: 'side',
      focus: ['bolt_body', 'bolt_handle', 'bolt_stop', 'action_body'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'bolt_stop', caption: 'Bolt release held' },
        { event: 'component_out', at: 0.25, component: 'bolt_body', caption: 'Bolt withdrawn from the action' },
      ],
    },
    {
      stage: 3,
      title: 'Chassis separated',
      description: 'The two action screws come out and the chassis, with grip, trigger guard and folding stock, drops away from the barrelled action.',
      camera: 'iso',
      focus: ['action_screws', 'chassis', 'action_body', 'stock'],
      audio: [
        { event: 'pin_push', at: 0.0, component: 'action_screws', caption: 'Action screws withdrawn' },
        { event: 'receiver_split', at: 0.3, component: 'chassis', caption: 'Chassis separates from the barrelled action' },
      ],
    },
    {
      stage: 4,
      title: 'Bolt stripped',
      description: 'The shroud unscrews, freeing the cocking piece and firing pin from the bolt body; the head with its three lugs and extractor comes off the front.',
      camera: 'detail-action',
      focus: ['bolt_body', 'bolt_shroud', 'cocking_piece', 'firing_pin', 'bolt_head', 'extractor'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'bolt_shroud', caption: 'Shroud unscrewed' },
        { event: 'component_out', at: 0.2, component: 'cocking_piece', caption: 'Cocking piece off' },
        { event: 'component_out', at: 0.4, component: 'firing_pin', caption: 'Firing pin withdrawn' },
        { event: 'component_out', at: 0.6, component: 'bolt_head', caption: 'Bolt head off' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis. Barrel, brake, rail and forend are armourer items, not field-strip items; they are shown to complete the atlas.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 1,250 mm', from: [BUTT, -190, 0], to: [BRAKE_TIP, -190, 0] },
      { label: 'Barrel 686 mm', from: [0, 110, 0], to: [MUZZLE, 110, 0] },
    ],
  },
  cartridge: { caseDiameter: 14.91, caseLength: 69.2, bulletDiameter: 8.61, bulletLength: 41, rimDiameter: 14.93, label: '.338 Lapua Magnum' },
  ejection: { position: [-20, 8, 18], direction: [0.25, 0.6, 1] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default aiax338;
