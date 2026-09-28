import type { ComponentDef, FirearmDefinition, Vec2, Vec3 } from '@/firearm/schema';

/**
 * Kalashnikov AKM (modernised AK-47), fixed laminate stock, slant compensator.
 *
 * Frame: bore axis y=0, bolt face (in battery) at x=0, +x toward the muzzle,
 * +z shooter's right. All dimensions mm.
 *
 * Published dimensions: overall 880 mm, barrel 415 mm, mass 3.1 kg without
 * magazine, muzzle velocity 715 m/s, cyclic 600 rounds/min (Soviet Army manual
 * NSD-63 for the AKM; Izhmash product data). Internal layout is estimated from
 * the AK pattern and marked as such; it is a visualisation, not a machining
 * reference.
 */

// ---- layout constants (mm) --------------------------------------------------
const MUZZLE = 415; // barrel length from the bolt face
const COMP_BASE = 404; // slant compensator threads onto the muzzle here
const COMP_TIP = 446; // lower-left lip of the compensator
const BUTT = -434; // rear face of the buttplate (880 mm overall)
const RCV_REAR = -245; // rear of the stamped receiver (rear trunnion)
const RCV_FRONT = 45;
const RCV_BOTTOM = -38;
const RCV_TOP = 13; // top edge of the receiver walls; dust cover sits above
const COVER_TOP = 34;
const GAS_AXIS = 27; // gas tube / piston axis above the bore
const GAS_BLOCK_X = 255;
const BOLT_TRAVEL = 120;

// Stamped receiver side profile (one wall; two are placed at z = +/-15.2)
const receiverWall: Vec2[] = [
  [RCV_FRONT, RCV_BOTTOM],
  [RCV_FRONT, RCV_TOP],
  [RCV_REAR + 6, RCV_TOP],
  [RCV_REAR, 6],
  [RCV_REAR, RCV_BOTTOM],
];

// Dust cover cross-section drawn in (u = -z, v = y): flat sides, elliptical crown
const coverSection = (grow: number): Vec2[] => {
  const pts: Vec2[] = [
    [-17 - grow, RCV_TOP - grow],
    [17 + grow, RCV_TOP - grow],
    [17 + grow, 24],
  ];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI;
    pts.push([Math.cos(a) * (17 + grow), 24 + Math.sin(a) * (COVER_TOP - 24 + grow)]);
  }
  pts.push([-17 - grow, 24]);
  return pts;
};

// Laminate stock, side profile (root butts against the receiver rear)
const stockProfile: Vec2[] = [
  [RCV_REAR - 1, 12],
  [-300, 7],
  [-380, -2],
  [-424, -9],
  [-429, -13],
  [-429, -110],
  [-424, -114],
  [-400, -100],
  [-340, -66],
  [-280, -42],
  [RCV_REAR - 1, -34],
];

// Bakelite pistol grip, side profile
const gripProfile: Vec2[] = [
  [-166, -37],
  [-198, -37],
  [-218, -110],
  [-220, -122],
  [-190, -124],
  [-178, -100],
  [-170, -66],
];

// Lower handguard (wood laminate) with the AKM palm swell at the rear
const lowerHandguardProfile: Vec2[] = [
  [56, -6],
  [250, -6],
  [250, -27],
  [180, -30],
  [110, -34],
  [72, -36],
  [58, -34],
];

// Upper handguard (wood laminate) over the gas tube
const upperHandguardProfile: Vec2[] = [
  [100, 16],
  [250, 16],
  [250, 38],
  [200, 42],
  [112, 42],
  [100, 38],
];

// Trigger, relative to its pivot pin
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

// Hammer, drawn upright relative to its pivot pin; rest pose is rotated rearward (cocked)
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

// Selector lever plate, relative to its axle; drawn at SAFE (tip raised)
const selectorProfile: Vec2[] = [
  [-8, -6],
  [8, -8],
  [42, -2],
  [86, 10],
  [97, 14],
  [98, 20],
  [90, 20],
  [44, 6],
  [8, 0],
  [-8, 2],
];

// Curved 30-round steel magazine: straight throat, then an arc of 260 mm radius
const MAG_R = 260;
const MAG_HALF = 33;
const MAG_CX = -50 + MAG_R;
const MAG_CY = -40;
const MAG_PHI = 0.74;
function magArc(radius: number, n: number, reverse: boolean): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = reverse ? 1 - i / n : i / n;
    const a = t * MAG_PHI;
    pts.push([MAG_CX - Math.cos(a) * radius, MAG_CY - Math.sin(a) * radius]);
  }
  return pts;
}
const magProfile: Vec2[] = [
  [-17, -8],
  [-17, MAG_CY],
  ...magArc(MAG_R - MAG_HALF, 8, false),
  ...magArc(MAG_R + MAG_HALF, 8, true),
  [-83, MAG_CY],
  [-83, -8],
];
const magBottom: Vec3 = [MAG_CX - Math.cos(MAG_PHI) * MAG_R, MAG_CY - Math.sin(MAG_PHI) * MAG_R, 0];

const components: ComponentDef[] = [
  // ------------------------------------------------------------ receiver
  {
    id: 'receiver',
    name: 'Stamped receiver',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: '1.0 mm stamped sheet steel, riveted trunnions, phosphate finish',
    geometry: {
      kind: 'composite',
      parts: [
        // two side walls
        { geometry: { kind: 'extrude', shape: receiverWall, depth: 1.6 }, position: [0, 0, 15.2] },
        { geometry: { kind: 'extrude', shape: receiverWall, depth: 1.6 }, position: [0, 0, -15.2] },
        // bottom plates either side of the magazine well
        { geometry: { kind: 'box', size: [58, 3, 32] }, position: [15, RCV_BOTTOM + 1.5, 0] },
        { geometry: { kind: 'box', size: [155, 3, 32] }, position: [-167.5, RCV_BOTTOM + 1.5, 0] },
        // rear trunnion (riveted; carries the stock tang and the recoil spring seat)
        { geometry: { kind: 'box', size: [32, 42, 28], radius: 1 }, position: [RCV_REAR + 16, -10, 0] },
        // pressed reinforcing ribs above the magazine well (AKM stamping)
        { geometry: { kind: 'box', size: [64, 3, 1.4], radius: 0.5 }, position: [-50, -8, 16.4] },
        { geometry: { kind: 'box', size: [64, 3, 1.4], radius: 0.5 }, position: [-50, -8, -16.4] },
        // top guide rails for the carrier
        { geometry: { kind: 'box', size: [270, 3, 4] }, position: [-100, RCV_TOP - 1.5, 13] },
        { geometry: { kind: 'box', size: [270, 3, 4] }, position: [-100, RCV_TOP - 1.5, -13] },
      ],
    },
    position: [0, 0, 0],
    function: 'Stamped steel box that carries the trunnions, guides the bolt carrier on two rails and houses the fire-control group and magazine well.',
    notes: ['AKM stamping replaced the machined AK-47 receiver in 1959', 'Ribs pressed above the magazine well stiffen the sheet'],
    confidence: 'estimated',
    adjacent: ['dust_cover', 'front_trunnion', 'bolt_carrier', 'magazine', 'stock', 'trigger_guard'],
    mass: 420,
    thermal: 0.2,
  },
  {
    id: 'dust_cover',
    name: 'Receiver cover (dust cover)',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: '1.0 mm stamped sheet steel, transverse ribs',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: coverSection(0), depth: 265, axis: 'x' }, position: [0, 0, 0] },
        ...Array.from({ length: 7 }, (_, i): { geometry: ComponentDef['geometry']; position: Vec3 } => ({
          geometry: { kind: 'extrude', shape: coverSection(1), depth: 4, axis: 'x' },
          position: [-100 + i * 26, 0, 0],
        })),
      ],
    },
    position: [-112.5, 0, 0],
    function: 'Sheet-steel lid that closes the top of the receiver; the recoil spring guide latches it at the rear and the rear sight block traps its front.',
    confidence: 'estimated',
    adjacent: ['receiver', 'recoil_spring_assembly', 'rear_sight_block', 'bolt_carrier'],
    strip: { stage: 2, offset: [0, 110, 0], order: 0, motion: 'up' },
    mass: 140,
    thermal: 0.25,
  },
  {
    id: 'front_trunnion',
    name: 'Front trunnion',
    group: 'receiver',
    material: 'parkerised-steel',
    materialLabel: 'Forged steel, machined, riveted into the stamping',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [70, 44, 30], radius: 1.5 }, position: [10, -9, 0] },
        // bolt locking recesses (two)
        { geometry: { kind: 'box', size: [16, 6, 6] }, position: [-16, 0, 12] },
        { geometry: { kind: 'box', size: [16, 6, 6] }, position: [-16, 0, -12] },
      ],
    },
    position: [0, 0, 0],
    function: 'Forged block into which the barrel is pressed and pinned; its two recesses take the bolt lugs so the stamping never bears firing loads.',
    confidence: 'estimated',
    adjacent: ['receiver', 'barrel', 'bolt', 'magazine'],
    strip: { stage: 5, offset: [30, 95, 0], order: 2, motion: 'up' },
    mass: 260,
    thermal: 0.55,
    internal: true,
  },

  // ------------------------------------------------------------ barrel / gas
  {
    id: 'barrel',
    name: 'Barrel, 415 mm',
    group: 'barrel',
    material: 'parkerised-steel',
    materialLabel: 'Chrome-lined steel, cold hammer forged, phosphate exterior',
    geometry: {
      kind: 'lathe',
      profile: [
        [0, 0], [11.6, 0], [11.6, 45], [9.6, 48], [9.6, 92], [8.6, 95], [8.6, 250], [8.2, 252], [8.2, 290], [7.8, 292], [7.8, 380], [7.4, 382], [7.4, 404], [7, 405], [7, MUZZLE], [4, MUZZLE],
      ],
      segments: 48,
    },
    position: [0, 0, 0],
    function: 'Chrome-lined 7.62 mm barrel pressed into the front trunnion; the gas port is drilled at 255 mm and the muzzle is threaded 14×1 left-hand for the compensator.',
    notes: ['Length 415 mm measured from the bolt face', 'Four-groove rifling, 1 in 240 mm right-hand'],
    confidence: 'published',
    adjacent: ['front_trunnion', 'rear_sight_block', 'gas_block', 'front_sight_base', 'compensator'],
    strip: { stage: 5, offset: [150, 0, 0], order: 0, motion: 'forward' },
    mass: 690,
    thermal: 0.75,
  },
  {
    id: 'rear_sight_block',
    name: 'Rear sight block',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [47, 52, 28], radius: 2 }, position: [69, 10, 0] },
        // gas tube socket
        { geometry: { kind: 'cylinder', radius: 9.8, length: 18 }, position: [95, GAS_AXIS, 0] },
        // leaf spring bed / ramp
        { geometry: { kind: 'box', size: [30, 4, 20] }, position: [62, 38, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Pinned to the barrel ahead of the trunnion; carries the tangent sight leaf, sockets the gas tube and traps the front of the receiver cover.',
    confidence: 'estimated',
    adjacent: ['barrel', 'rear_sight_leaf', 'gas_tube', 'dust_cover', 'gas_tube_latch'],
    strip: { stage: 5, offset: [0, 120, 0], order: 3, motion: 'up' },
    mass: 95,
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
        // slider
        { geometry: { kind: 'box', size: [11, 6, 15], radius: 1 }, position: [-24, 4, 0] },
        // notch plate at the rear
        { geometry: { kind: 'box', size: [4, 9, 14] }, position: [-64, 5, 0] },
      ],
    },
    position: [88, 37, 0],
    pivot: [0, 0, 0],
    parent: 'rear_sight_block',
    function: 'Hinged at the front; the slider is set against graduations from 100 to 1,000 m and lifts the U-notch as it moves back.',
    notes: ['Sight radius about 378 mm', 'Battle setting П (P) corresponds to 300 m'],
    confidence: 'published',
    adjacent: ['rear_sight_block', 'front_sight_base'],
    strip: { stage: 5, offset: [0, 40, 0], rotate: [0, 0, 0.5], order: 4, motion: 'up' },
    mass: 20,
  },
  {
    id: 'gas_block',
    name: 'Gas block',
    group: 'gas-system',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        // collar on the barrel
        { geometry: { kind: 'lathe', profile: [[8, 0], [14.5, 0], [14.5, 30], [8, 30]], segments: 32 }, position: [0, 0, 0] },
        // gas cylinder above the bore
        { geometry: { kind: 'cylinder', radius: 10.5, length: 30 }, position: [15, GAS_AXIS, 0] },
        // bridge between them
        { geometry: { kind: 'box', size: [30, 14, 18] }, position: [15, 14, 0] },
        // bayonet / accessory lug underneath
        { geometry: { kind: 'box', size: [22, 12, 10], radius: 1 }, position: [15, -18, 0] },
        // cleaning-rod eye
        { geometry: { kind: 'torus', radius: 4, tube: 1.5, axis: 'x' }, position: [15, -19, 0] },
      ],
    },
    position: [GAS_BLOCK_X, 0, 0],
    function: 'Pinned over the gas port; taps combustion gas upward into the cylinder where it strikes the piston head.',
    notes: ['Gas port about 255 mm from the bolt face', 'Carries the AKM bayonet lug and cleaning-rod eye'],
    confidence: 'estimated',
    adjacent: ['barrel', 'gas_tube', 'bolt_carrier', 'handguard_retainer'],
    strip: { stage: 5, offset: [0, 110, 0], order: 3, motion: 'up' },
    mass: 105,
    thermal: 0.9,
  },
  {
    id: 'gas_tube',
    name: 'Gas tube',
    group: 'gas-system',
    material: 'parkerised-steel',
    materialLabel: 'Steel tube with four vent slots at the rear',
    geometry: {
      kind: 'lathe',
      profile: [[0, 0], [9.6, 0], [9.6, 14], [8.6, 16], [8.6, 150], [9.6, 152], [9.6, 160], [0, 160]],
      segments: 32,
    },
    position: [96, GAS_AXIS, 0],
    function: 'Guides the piston rearward and vents the spent gas through slots behind the handguard; lifts off with the upper handguard once the latch is turned.',
    confidence: 'estimated',
    adjacent: ['gas_block', 'rear_sight_block', 'gas_tube_latch', 'bolt_carrier', 'handguard_upper'],
    strip: { stage: 4, offset: [10, 85, 0], order: 1, motion: 'up' },
    mass: 65,
    thermal: 0.85,
  },
  {
    id: 'handguard_upper',
    name: 'Upper handguard',
    group: 'furniture',
    material: 'wood-laminate',
    materialLabel: 'Birch laminate, shellac finish',
    geometry: { kind: 'extrude', shape: upperHandguardProfile, depth: 30, bevel: 3, curveSegments: 6 },
    position: [-96, -GAS_AXIS, 0],
    parent: 'gas_tube',
    function: 'Wooden sleeve pinned to the gas tube; insulates the hand from the hottest part of the rifle.',
    confidence: 'estimated',
    adjacent: ['gas_tube', 'handguard_lower', 'rear_sight_block'],
    strip: { stage: 4, offset: [0, 40, 0], order: 2, motion: 'up' },
    mass: 70,
    thermal: 0.3,
  },
  {
    id: 'gas_tube_latch',
    name: 'Gas tube lock lever',
    group: 'gas-system',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4.5, length: 8, axis: 'z' }, position: [0, 0, 0] },
        { geometry: { kind: 'box', size: [24, 6, 3], radius: 1 }, position: [-10, 0, 1] },
      ],
    },
    position: [82, 26, 17],
    pivot: [0, 0, 0],
    function: 'Cam lever on the right of the sight block; turned upright it frees the gas tube.',
    confidence: 'estimated',
    adjacent: ['rear_sight_block', 'gas_tube'],
    strip: { stage: 4, offset: [0, 0, 0], rotate: [0, 0, -1.4], order: 0, motion: 'up' },
    mass: 12,
  },
  {
    id: 'front_sight_base',
    name: 'Front sight base',
    group: 'sights',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[7, 0], [12.5, 0], [12.5, 26], [7, 26]], segments: 32 }, position: [0, 0, 0] },
        // tower
        { geometry: { kind: 'box', size: [14, 30, 10], radius: 1.5 }, position: [13, 24, 0] },
        // protective ears
        { geometry: { kind: 'box', size: [14, 20, 3] }, position: [13, 47, 7] },
        { geometry: { kind: 'box', size: [14, 20, 3] }, position: [13, 47, -7] },
        // sight post, screw-adjustable for elevation
        { geometry: { kind: 'cylinder', radius: 1.3, length: 16, axis: 'y' }, position: [13, 46, 0] },
        // cleaning rod and bayonet lug underneath
        { geometry: { kind: 'box', size: [18, 12, 10], radius: 1 }, position: [11, -17, 0] },
        // compensator detent plunger boss
        { geometry: { kind: 'cylinder', radius: 3, length: 8 }, position: [24, 8, 0] },
      ],
    },
    position: [383, 0, 0],
    function: 'Pinned to the muzzle end of the barrel; the post is adjusted for zero with a tool and the spring plunger indexes the compensator.',
    confidence: 'estimated',
    adjacent: ['barrel', 'compensator', 'rear_sight_leaf', 'cleaning_rod'],
    strip: { stage: 5, offset: [20, 110, 0], order: 3, motion: 'up' },
    mass: 90,
    thermal: 0.55,
  },
  {
    id: 'compensator',
    name: 'Slant compensator',
    group: 'muzzle',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[7.4, 0], [10.5, 0], [10.5, 30], [7.6, 30]], segments: 32 }, position: [0, 0, 0] },
        // oblique lip: a half tube on the lower-left quadrant
        {
          geometry: {
            kind: 'extrude',
            shape: [
              ...Array.from({ length: 9 }, (_, i) => [Math.cos(Math.PI + (i / 8) * Math.PI) * 10.5, Math.sin(Math.PI + (i / 8) * Math.PI) * 10.5] as Vec2),
              ...Array.from({ length: 9 }, (_, i) => [Math.cos(Math.PI + ((8 - i) / 8) * Math.PI) * 7.8, Math.sin(Math.PI + ((8 - i) / 8) * Math.PI) * 7.8] as Vec2),
            ],
            depth: 12,
            axis: 'x',
          },
          position: [36, 0, 0],
          rotation: [Math.PI / 4, 0, 0],
        },
      ],
    },
    position: [COMP_BASE, 0, 0],
    function: 'Threaded 14×1 LH onto the muzzle; the oblique cut vents gas up and to the right so the muzzle is pushed down and left against climb in automatic fire.',
    notes: ['Oblique cut approximated as a half-tube lip on the lower-left quadrant'],
    confidence: 'estimated',
    adjacent: ['barrel', 'front_sight_base'],
    strip: { stage: 5, offset: [90, 0, 0], order: 0, motion: 'forward' },
    mass: 30,
    thermal: 0.85,
  },
  {
    id: 'handguard_lower',
    name: 'Lower handguard',
    group: 'furniture',
    material: 'wood-laminate',
    materialLabel: 'Birch laminate, shellac finish, with palm swells',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: lowerHandguardProfile, depth: 34, bevel: 3, curveSegments: 6 } },
        // AKM finger-rest swells
        { geometry: { kind: 'box', size: [70, 22, 6], radius: 2.5 }, position: [100, -22, 19] },
        { geometry: { kind: 'box', size: [70, 22, 6], radius: 2.5 }, position: [100, -22, -19] },
      ],
    },
    position: [0, 0, 0],
    function: 'Wooden fore-end seated in the receiver front and clamped by the retainer; the AKM swells stop the hand sliding forward.',
    confidence: 'estimated',
    adjacent: ['barrel', 'handguard_retainer', 'handguard_upper', 'front_trunnion'],
    strip: { stage: 5, offset: [0, -90, 0], order: 2, motion: 'down' },
    mass: 95,
    thermal: 0.3,
  },
  {
    id: 'handguard_retainer',
    name: 'Handguard retainer',
    group: 'furniture',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[8, 0], [13.5, 0], [13.5, 14], [8, 14]], segments: 32 }, position: [0, 0, 0] },
        // clamp band around the fore-end
        { geometry: { kind: 'box', size: [14, 36, 38] }, position: [7, -18, 0] },
        // lock lever on the right
        { geometry: { kind: 'box', size: [20, 5, 3], radius: 1 }, position: [-4, -8, 20] },
      ],
    },
    position: [251, 0, 0],
    function: 'Sprung band with a lock lever; it clamps the lower handguard against the receiver front.',
    confidence: 'estimated',
    adjacent: ['barrel', 'handguard_lower', 'gas_block'],
    strip: { stage: 5, offset: [40, -60, 0], order: 1, motion: 'forward' },
    mass: 35,
    thermal: 0.45,
  },
  {
    id: 'cleaning_rod',
    name: 'Cleaning rod',
    group: 'accessory',
    material: 'steel-worn',
    geometry: { kind: 'lathe', profile: [[0, 0], [2.6, 0], [2.6, 330], [3.5, 332], [3.5, 342], [0, 342]], segments: 12 },
    position: [58, -19, 0],
    function: 'Carried under the barrel through the gas block and sight base lugs; its rear end hooks into the trunnion.',
    confidence: 'estimated',
    adjacent: ['barrel', 'front_sight_base', 'gas_block', 'handguard_lower'],
    strip: { stage: 5, offset: [60, -50, 0], order: 1, motion: 'forward' },
    mass: 30,
  },

  // ------------------------------------------------------------ action
  {
    id: 'bolt_carrier',
    name: 'Bolt carrier with piston rod',
    group: 'action',
    material: 'steel-worn',
    materialLabel: 'Forged steel carrier, chrome-plated piston rod pinned to it',
    geometry: {
      kind: 'composite',
      parts: [
        // carrier body riding on the receiver rails
        { geometry: { kind: 'box', size: [115, 24, 28], radius: 2 }, position: [-67, 18, 0] },
        // cam track boss under the front
        { geometry: { kind: 'box', size: [40, 10, 24], radius: 1 }, position: [-30, 3, 0] },
        // charging handle on the right
        { geometry: { kind: 'box', size: [26, 16, 22], radius: 4 }, position: [-100, 18, 27] },
        // piston rod and head
        { geometry: { kind: 'lathe', profile: [[0, 0], [7, 0], [7, 6], [6, 8], [6, 262], [7.6, 264], [7.6, 276], [6, 278], [0, 278]], segments: 28 }, position: [-10, GAS_AXIS, 0] },
      ],
    },
    position: [0, 0, 0],
    function: 'Gas on the piston head drives the whole carrier rearward about 120 mm; its cam track turns the bolt to unlock, and the charging handle is part of the carrier.',
    notes: ['Long-stroke piston, about 380 mm overall', 'Reciprocating mass with bolt about 500 g'],
    confidence: 'estimated',
    adjacent: ['receiver', 'bolt', 'gas_tube', 'gas_block', 'recoil_spring_assembly', 'hammer'],
    strip: { stage: 3, offset: [-240, 75, 0], order: 0, motion: 'rear' },
    mass: 420,
    thermal: 0.6,
  },
  {
    id: 'bolt',
    name: 'Rotating bolt',
    group: 'action',
    material: 'steel-worn',
    materialLabel: 'Forged steel, two locking lugs',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'lathe', profile: [[0, -82], [4.5, -82], [4.5, -62], [8, -60], [8, -24], [9.5, -22], [9.5, 0], [0, 0]], segments: 28 } },
        // two locking lugs
        { geometry: { kind: 'box', size: [14, 5, 4] }, position: [-7, 0, 11] },
        { geometry: { kind: 'box', size: [14, 5, 4] }, position: [-7, 0, -11] },
        // cam lug that rides in the carrier track
        { geometry: { kind: 'box', size: [8, 6, 5], radius: 1 }, position: [-30, 10, 0] },
      ],
    },
    position: [0, 0, 0],
    parent: 'bolt_carrier',
    function: 'Two lugs turn about 35 degrees into the trunnion recesses to lock the breech; the carrier cam track rotates it after the first few millimetres of carrier travel.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'front_trunnion', 'firing_pin', 'extractor', 'barrel'],
    strip: { stage: 3, offset: [70, -50, 0], rotate: [0.6, 0, 0], order: 1, motion: 'forward' },
    mass: 80,
    thermal: 0.6,
    internal: true,
  },
  {
    id: 'firing_pin',
    name: 'Firing pin',
    group: 'action',
    material: 'chrome',
    geometry: { kind: 'lathe', profile: [[0, -78], [3, -78], [3, -30], [1.3, -28], [1.3, 1], [0, 1]], segments: 16 },
    position: [0, 0, 0],
    parent: 'bolt',
    function: 'Free-floating inside the bolt; the hammer strikes its tail through the rear of the carrier.',
    confidence: 'estimated',
    adjacent: ['bolt', 'hammer', 'extractor'],
    strip: { stage: 5, offset: [-90, 0, 0], order: 1, motion: 'rear' },
    mass: 8,
    internal: true,
  },
  {
    id: 'extractor',
    name: 'Extractor',
    group: 'action',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [16, 5, 4], radius: 1 },
    position: [-8, 5, 8],
    parent: 'bolt',
    function: 'Spring-loaded claw in the bolt head; its cross pin also retains the firing pin.',
    confidence: 'estimated',
    adjacent: ['bolt', 'firing_pin'],
    strip: { stage: 5, offset: [0, 0, 30], order: 2, motion: 'right' },
    mass: 5,
    internal: true,
  },
  {
    id: 'recoil_spring_assembly',
    name: 'Recoil spring assembly',
    group: 'action',
    material: 'stainless-steel',
    materialLabel: 'Braided-wire spring on a two-piece guide rod',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'spring', radius: 6.5, length: 125, turns: 22, wire: 1.6 }, position: [-165, 0, 0] },
        { geometry: { kind: 'cylinder', radius: 2.5, length: 140 }, position: [-165, 0, 0] },
        // rear base that latches the cover
        { geometry: { kind: 'box', size: [8, 22, 22], radius: 1 }, position: [-236, -4, 0] },
        // front guide cap
        { geometry: { kind: 'cylinder', radius: 5.5, length: 10 }, position: [-100, 0, 0] },
      ],
    },
    position: [0, 18, 0],
    function: 'Returns the carrier to battery; its rear base doubles as the latch that holds the receiver cover shut.',
    confidence: 'estimated',
    adjacent: ['bolt_carrier', 'receiver', 'dust_cover'],
    strip: { stage: 2, offset: [-200, 55, 0], order: 1, motion: 'rear' },
    mass: 55,
    internal: true,
  },

  // ------------------------------------------------------------ fire control
  {
    id: 'hammer',
    name: 'Hammer',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: hammerProfile, depth: 12, bevel: 0.8 },
    position: [-100, -20, 0],
    pivot: [0, 0, 0],
    rotation: [0, 0, 0.95],
    function: 'Held cocked by the trigger sear; when released it swings forward to strike the firing pin. The carrier re-cocks it on every cycle.',
    confidence: 'estimated',
    adjacent: ['trigger', 'firing_pin', 'hammer_spring', 'bolt_carrier', 'selector'],
    strip: { stage: 5, offset: [0, -50, 55], order: 1, motion: 'right' },
    mass: 60,
    internal: true,
  },
  {
    id: 'hammer_spring',
    name: 'Hammer spring',
    group: 'fire-control',
    material: 'stainless-steel',
    materialLabel: 'Double-wound torsion spring',
    geometry: { kind: 'spring', radius: 5, length: 22, turns: 7, wire: 1.6, axis: 'z' },
    position: [-100, -20, 0],
    function: 'Torsion spring wound around the hammer pin; its legs bear on the trigger and give it its return.',
    confidence: 'estimated',
    adjacent: ['hammer', 'trigger'],
    strip: { stage: 5, offset: [0, -50, 90], order: 2, motion: 'right' },
    mass: 10,
    internal: true,
  },
  {
    id: 'trigger',
    name: 'Trigger',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: { kind: 'extrude', shape: triggerProfile, depth: 9, bevel: 0.6 },
    position: [-118, -20, 0],
    pivot: [0, 0, 0],
    function: 'Two sears on the trigger body hold the hammer; the blade hangs inside the guard and releases the hammer after about 5 mm of travel.',
    notes: ['Issue pull weight about 2 to 3 kgf'],
    confidence: 'estimated',
    adjacent: ['hammer', 'selector', 'receiver', 'trigger_guard'],
    strip: { stage: 5, offset: [0, -50, -55], order: 1, motion: 'left' },
    mass: 25,
  },
  {
    id: 'selector',
    name: 'Selector / safety lever',
    group: 'fire-control',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'cylinder', radius: 4, length: 36, axis: 'z' }, position: [0, 0, -17] },
        { geometry: { kind: 'extrude', shape: selectorProfile, depth: 2.5 }, position: [0, 0, 0.5] },
      ],
    },
    position: [-150, -6, 17.5],
    pivot: [0, 0, 0],
    function: 'Long lever on the right of the receiver; at SAFE (up) it blocks the trigger and closes the carrier slot against dirt, and lower detents give automatic then semi-automatic fire.',
    notes: ['Positions from the top: ПР safe, АВ automatic, ОД single'],
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
        { geometry: { kind: 'box', size: [6, 24, 12] }, position: [-103, -50, 0] },
        { geometry: { kind: 'box', size: [62, 4, 12], radius: 1.5 }, position: [-131, -62, 0] },
        { geometry: { kind: 'box', size: [6, 24, 12] }, position: [-160, -50, 0] },
      ],
    },
    position: [0, 0, 0],
    parent: 'receiver',
    function: 'Riveted to the receiver floor together with the magazine catch housing.',
    confidence: 'estimated',
    adjacent: ['receiver', 'trigger', 'mag_catch', 'pistol_grip'],
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
        // hook that engages the magazine lug
        { geometry: { kind: 'box', size: [10, 10, 14], radius: 1 }, position: [6, 3, 0] },
        // paddle
        { geometry: { kind: 'box', size: [16, 5, 16], radius: 1.5 }, position: [-8, -6, 0] },
      ],
    },
    position: [-96, -44, 0],
    pivot: [0, 0, 0],
    function: 'Paddle ahead of the trigger guard; pushed forward it lifts the hook off the magazine’s rear lug so the magazine can rock out.',
    confidence: 'estimated',
    adjacent: ['receiver', 'magazine', 'trigger_guard'],
    strip: { stage: 5, offset: [0, -60, 40], order: 3, motion: 'down' },
    mass: 15,
  },

  // ------------------------------------------------------------ furniture
  {
    id: 'pistol_grip',
    name: 'Pistol grip',
    group: 'furniture',
    material: 'bakelite',
    materialLabel: 'Phenolic resin (bakelite), AG-4S glass-filled',
    geometry: { kind: 'extrude', shape: gripProfile, depth: 30, bevel: 3, curveSegments: 6 },
    position: [0, 0, 0],
    function: 'Retained by a single through-bolt into a nut in the receiver floor.',
    confidence: 'estimated',
    adjacent: ['receiver', 'trigger_guard'],
    strip: { stage: 5, offset: [0, -80, 0], order: 2, motion: 'down' },
    mass: 65,
  },
  {
    id: 'stock',
    name: 'Fixed stock, laminate',
    group: 'furniture',
    material: 'wood-laminate',
    materialLabel: 'Birch laminate, shellac finish',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: stockProfile, depth: 40, bevel: 4, curveSegments: 6 } },
        // rear sling loop on the left
        { geometry: { kind: 'torus', radius: 7, tube: 1.6, axis: 'y' }, position: [-360, -50, -22] },
      ],
    },
    position: [0, 0, 0],
    function: 'Tang fits into the rear trunnion and is held by two screws; the butt holds a cleaning kit behind the trap in the plate.',
    notes: ['AKM stocks are straighter than the AK-47 pattern to reduce muzzle climb'],
    confidence: 'estimated',
    adjacent: ['receiver', 'buttplate', 'recoil_spring_assembly'],
    strip: { stage: 5, offset: [-120, -30, 0], order: 0, motion: 'rear' },
    mass: 380,
  },
  {
    id: 'buttplate',
    name: 'Buttplate with trap',
    group: 'furniture',
    material: 'parkerised-steel',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'box', size: [5, 102, 38], radius: 1.5 }, position: [0, 0, 0] },
        // spring-loaded trap door
        { geometry: { kind: 'box', size: [1.5, 34, 22], radius: 1 }, position: [-3, -6, 0] },
      ],
    },
    position: [BUTT + 2.5, -62, 0],
    parent: 'stock',
    function: 'Steel plate screwed to the butt; the sprung trap covers the cleaning-kit cavity.',
    confidence: 'estimated',
    adjacent: ['stock'],
    strip: { stage: 5, offset: [-50, 0, 0], order: 1, motion: 'rear' },
    mass: 45,
  },

  // ------------------------------------------------------------ feed
  {
    id: 'magazine',
    name: 'Magazine, 30-round steel',
    group: 'feed',
    material: 'parkerised-steel',
    materialLabel: 'Stamped and welded sheet steel, ribbed, phosphate finish',
    geometry: {
      kind: 'composite',
      parts: [
        { geometry: { kind: 'extrude', shape: magProfile, depth: 26, bevel: 2, curveSegments: 8 } },
        // floor plate
        { geometry: { kind: 'box', size: [70, 6, 28], radius: 1.5 }, position: magBottom, rotation: [0, 0, MAG_PHI] },
        // front locking lug and rear latch lug
        { geometry: { kind: 'box', size: [6, 6, 20], radius: 1 }, position: [-14, -13, 0] },
        { geometry: { kind: 'box', size: [7, 8, 20], radius: 1 }, position: [-86, -30, 0] },
        // stiffening ribs on the sides
        { geometry: { kind: 'box', size: [4, 150, 1.4] }, position: [-60, -120, 14] },
        { geometry: { kind: 'box', size: [4, 150, 1.4] }, position: [-60, -120, -14] },
      ],
    },
    position: [0, 0, 0],
    pivot: [-14, -12, 0],
    function: 'Double-column curved box; the curve follows the taper of the 7.62×39 case. It hooks in at the front lug and rocks back until the rear catch engages.',
    notes: ['About 220 mm tall along the rear spine', 'Mass about 330 g empty'],
    confidence: 'published',
    adjacent: ['receiver', 'mag_catch', 'front_trunnion', 'bolt'],
    strip: { stage: 1, offset: [30, -180, 0], rotate: [0, 0, 0.3], motion: 'down' },
    mass: 330,
  },
  {
    id: 'follower',
    name: 'Follower',
    group: 'feed',
    material: 'parkerised-steel',
    geometry: { kind: 'box', size: [52, 8, 22], radius: 1.5 },
    position: [-36, -36, 0], // relative to the magazine pivot
    parent: 'magazine',
    function: 'Stamped platform that lifts the staggered cartridge stack to the feed lips.',
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
    geometry: { kind: 'spring', radius: 8.5, length: 150, turns: 10, wire: 1.3, axis: 'y' },
    position: [-16, -118, 0],
    parent: 'magazine',
    function: 'Provides the lift that feeds the last round as reliably as the first.',
    confidence: 'estimated',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, 50, 0], order: 2, motion: 'up' },
    mass: 20,
    internal: true,
  },
  ...Array.from({ length: 3 }, (_, i): ComponentDef => ({
    id: `round_${i + 1}`,
    name: `Cartridge, 7.62×39 mm (${i + 1})`,
    group: 'ammunition',
    material: 'brass',
    materialLabel: 'Lacquered steel case, steel-core ball (57-N-231)',
    geometry: { kind: 'cartridge', caseDiameter: 11.35, caseLength: 38.7, bulletDiameter: 7.92, bulletLength: 26, rimDiameter: 11.35, shoulder: 0.79 },
    position: [-65, -2 - i * 10.5, i % 2 === 0 ? 4.5 : -4.5],
    parent: 'magazine',
    function: 'Staggered in the magazine; the top round is stripped forward by the bolt on each cycle.',
    confidence: 'published',
    adjacent: ['magazine', 'follower'],
    strip: { stage: 5, offset: [0, 50 + i * 14, 0], order: 3, motion: 'up' },
    mass: 16,
    internal: true,
  })),
];

export const ak47: FirearmDefinition = {
  id: 'ak47',
  name: 'Kalashnikov AKM',
  shortName: 'AKM',
  spec: {
    manufacturer: 'Izhevsk Machine-Building Plant (Izhmash), also Tula Arms Plant',
    designation: 'AKM, 7.62 mm modernised Kalashnikov automatic rifle (GRAU 6P1)',
    origin: 'Soviet Union',
    designed: { value: 1959, confidence: 'published', note: 'year of adoption' },
    category: 'assault',
    categoryLabel: 'Assault rifle',
    cartridge: '7.62×39 mm',
    action: 'long-stroke-piston',
    actionLabel: 'Gas-operated, long-stroke piston, rotating bolt',
    feed: 'box-magazine',
    capacity: { value: '30-round detachable curved box', confidence: 'published' },
    overallLength: { value: 880, unit: 'mm', confidence: 'published', note: 'fixed stock, with compensator' },
    barrelLength: { value: 415, unit: 'mm', confidence: 'published' },
    mass: { value: 3100, unit: 'g', confidence: 'published', note: 'without magazine' },
    muzzleVelocity: { value: 715, unit: 'm/s', confidence: 'published', note: '57-N-231 ball, 7.9 g' },
    rateOfFire: { value: '600 rounds/min cyclic', confidence: 'published' },
    effectiveRange: { value: 350, unit: 'm', confidence: 'published', note: 'point target; sights graduated to 1,000 m' },
    twist: { value: '1 in 240 mm (1:9.45 in), RH, 4 grooves', confidence: 'published' },
    sights: 'Post front, adjustable for zero; tangent leaf rear graduated 100 to 1,000 m with a battle setting; sight radius 378 mm',
    identification: 'Stamped receiver with a ribbed top cover, a long safety lever on the right side, wooden handguards and fixed stock, a steeply curved 30-round magazine and a slanted muzzle compensator.',
    mechanism: 'Gas tapped 255 mm up the barrel drives a piston fixed to the bolt carrier through a stroke of about 120 mm. The carrier cam track rotates the two-lug bolt out of the trunnion recesses, the case is extracted and thrown up and to the right, and a braided recoil spring returns the carrier, which strips the next round and re-locks the bolt.',
  },
  provenance: {
    configuration: 'AKM, fixed birch-laminate stock, bakelite grip, slant compensator, 30-round ribbed steel magazine, cleaning rod fitted, no bayonet',
    version: '3.0.0',
    modelOrigin: 'parametric',
    geometryConfidence: 'estimated',
    specConfidence: 'published',
    sources: [
      { label: 'Soviet Army manual NSD-63, 7.62 mm modernised Kalashnikov automatic rifle (AKM and AKMS)', covers: ['overallLength', 'barrelLength', 'mass', 'muzzleVelocity', 'rateOfFire', 'effectiveRange', 'sights', 'capacity'] },
      { label: 'Izhmash / Kalashnikov Concern AKM product sheet', covers: ['overallLength', 'mass', 'twist'] },
      { label: 'Jane’s Infantry Weapons', covers: ['designed', 'muzzleVelocity', 'rateOfFire'] },
      { label: 'CIP / 7.62×39 cartridge drawing', covers: ['cartridge'] },
    ],
    notes: [
      'Exterior proportions follow published dimensions; internal component positions are estimated from the AK pattern.',
      'The receiver is drawn as two walls and a floor so the magazine well is a real opening; rivets and the ejector are omitted.',
      'The slant compensator’s oblique cut is approximated by a half-tube lip on the lower-left quadrant.',
      'Magazine curvature is drawn as a 260 mm radius arc; the real spine is a compound curve.',
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
        { component: 'bolt', t: [0.02, 0.1], rotate: [0.6, 0, 0], easing: 'inOutCubic' },
        { component: 'hammer', t: [0.1, 0.32], rotate: [0, 0, 0], easing: 'outQuad' },
        { component: 'bolt_carrier', t: [0.56, 0.78], reset: true, easing: 'springReturn' },
        { component: 'bolt', t: [0.7, 0.78], reset: true, easing: 'springReturn' },
      ],
      audio: [
        { event: 'charge_pull', at: 0.0, component: 'bolt_carrier', caption: 'Charging handle drawn rearward; carrier and piston travel 120 mm' },
        { event: 'casing_eject', at: 0.4, component: 'receiver', caption: 'Case thrown up and to the right' },
        { event: 'bolt_release', at: 0.56, component: 'bolt_carrier', caption: 'Carrier released; recoil spring drives it forward' },
        { event: 'bolt_battery', at: 0.78, component: 'bolt', caption: 'Bolt lugs turn into the trunnion' },
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
      duration: 1.7,
      steps: [
        { component: 'mag_catch', t: [0.0, 0.08], rotate: [0, 0, 0.3], easing: 'outQuad' },
        { component: 'magazine', t: [0.06, 0.28], rotate: [0, 0, 0.4], easing: 'outQuad' },
        { component: 'magazine', t: [0.28, 0.55], translate: [40, -170, 0], rotate: [0, 0, 0.4], easing: 'outQuad' },
        { component: 'mag_catch', t: [0.3, 0.4], reset: true, easing: 'outQuad' },
        { component: 'magazine', t: [0.95, 1.25], rotate: [0, 0, 0.4], easing: 'inOutCubic' },
        { component: 'magazine', t: [1.25, 1.4], reset: true, easing: 'mechanicalSnap' },
      ],
      audio: [
        { event: 'mag_release', at: 0.0, component: 'mag_catch', caption: 'Magazine catch pushed forward' },
        { event: 'mag_out', at: 0.2, component: 'magazine', caption: 'Magazine rocks forward and out' },
        { event: 'mag_seat', at: 1.4, component: 'magazine', caption: 'Magazine rocks back and locks' },
      ],
    },
    safety: {
      id: 'safety',
      label: 'Selector',
      duration: 0.7,
      steps: [
        { component: 'selector', t: [0.0, 0.22], rotate: [0, 0, -0.25], easing: 'detent' },
        { component: 'selector', t: [0.36, 0.58], rotate: [0, 0, -0.5], easing: 'detent' },
      ],
      audio: [
        { event: 'selector', at: 0.2, component: 'selector', caption: 'Lever clicks down from SAFE to AUTOMATIC' },
        { event: 'selector', at: 0.56, component: 'selector', caption: 'Lever clicks down to SINGLE' },
      ],
    },
  },
  acoustic: {
    mass: 3100,
    receiver: 'steel-stamped',
    action: 'long-stroke-piston',
    reciprocatingMass: 500,
    spring: { frequency: 22, damping: 0.32 },
    furniture: 'wood',
  },
  fieldStrip: [
    {
      stage: 0,
      title: 'In battery',
      description: 'Fully assembled, bolt locked into the front trunnion, magazine seated, selector at SAFE.',
      camera: 'three-quarter',
      focus: [],
      audio: [{ event: 'component_seat', at: 0.1, caption: 'Assembled' }],
    },
    {
      stage: 1,
      title: 'Magazine withdrawn',
      description: 'The magazine rocks forward off its rear catch and drops clear; it is the only component that leaves the rifle in normal handling.',
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
      description: 'The recoil spring guide is also the cover latch: once its base is pressed in, the sheet-steel cover lifts away and the spring assembly follows out of the rear trunnion.',
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
      description: 'The carrier with its piston rod slides back along the rails and lifts out of the receiver; the bolt then turns and slips forward out of the carrier cam track.',
      camera: 'iso',
      focus: ['bolt_carrier', 'bolt', 'receiver', 'front_trunnion'],
      audio: [
        { event: 'component_out', at: 0.0, component: 'bolt_carrier', caption: 'Carrier drawn rearward and lifted out' },
        { event: 'component_out', at: 0.4, component: 'bolt', caption: 'Bolt separated from the carrier' },
      ],
    },
    {
      stage: 4,
      title: 'Gas tube and upper handguard off',
      description: 'The lock lever on the sight block turns upright and the gas tube, with the upper handguard pinned to it, lifts off the barrel to expose the piston path.',
      camera: 'detail-action',
      focus: ['gas_tube_latch', 'gas_tube', 'handguard_upper', 'gas_block', 'rear_sight_block'],
      audio: [
        { event: 'ui_detent', at: 0.0, component: 'gas_tube_latch', caption: 'Lock lever turned' },
        { event: 'component_out', at: 0.25, component: 'gas_tube', caption: 'Gas tube lifted off' },
      ],
    },
    {
      stage: 5,
      title: 'Exploded matrix',
      description: 'Every modelled component spread along its assembly axis. Barrel, trunnions, sights and furniture are not field-strip items; they are shown to complete the atlas.',
      camera: 'side',
      focus: [],
      audio: [{ event: 'component_out', at: 0.0, caption: 'Full component matrix' }],
    },
  ],
  comparison: {
    dimensions: [
      { label: 'Overall length 880 mm', from: [BUTT, -255, 0], to: [COMP_TIP, -255, 0] },
      { label: 'Barrel 415 mm', from: [0, 80, 0], to: [MUZZLE, 80, 0] },
    ],
  },
  cartridge: { caseDiameter: 11.35, caseLength: 38.7, bulletDiameter: 7.92, bulletLength: 26, rimDiameter: 11.35, label: '7.62×39 mm' },
  ejection: { position: [-30, 18, 16], direction: [0.3, 0.6, 1] },
  bore: { breech: [0, 0, 0], muzzle: [MUZZLE, 0, 0] },
};

export default ak47;
