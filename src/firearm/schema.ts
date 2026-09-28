/**
 * ARMORY OS unified firearm schema.
 *
 * Every firearm in the collection is DATA + ASSETS conforming to this schema.
 * Units: millimetres for all geometry and travel, grams for mass, radians for angles,
 * seconds for time. Scene units are metres (the model builder scales by 0.001).
 *
 * Coordinate convention (firearm local frame):
 *   +X  muzzle direction (forward)
 *   +Y  up
 *   +Z  shooter's right
 *   Origin: on the bore axis at the breech face (bolt face in battery).
 */

// ---------------------------------------------------------------------------
// Provenance / authenticity pipeline
// ---------------------------------------------------------------------------

export type Confidence = 'measured' | 'published' | 'estimated' | 'unverified';

export interface Provenance {
  /** Human-readable configuration string, e.g. "M4A1, 14.5 in barrel, SOPMOD Block I furniture". */
  configuration: string;
  /** Model version of this data/asset definition. Bump when geometry or dimensions change. */
  version: string;
  /** Where the dimensions and specification came from. */
  sources: SourceRef[];
  /** Overall confidence in the geometric representation. */
  geometryConfidence: Confidence;
  /** Overall confidence in the technical specification. */
  specConfidence: Confidence;
  /** How the 3D representation was produced. */
  modelOrigin: 'parametric' | 'authored-gltf';
  /** Free-form notes about deliberate simplifications. */
  notes?: string[];
}

export interface SourceRef {
  label: string;
  /** URL, publication or document identifier. */
  ref?: string;
  /** Which fields this source supports. */
  covers?: string[];
}

// ---------------------------------------------------------------------------
// Technical specification (factual layer)
// ---------------------------------------------------------------------------

/** A specification value that is honest about uncertainty. */
export type SpecValue<T = number> =
  | { value: T; unit?: string; confidence: Confidence; note?: string }
  | { value: null; unit?: string; confidence: 'unverified'; note: 'N/A' | 'varies by configuration' | 'source required' };

export type FirearmCategory =
  | 'handgun'
  | 'revolver'
  | 'smg'
  | 'pdw'
  | 'assault'
  | 'bullpup'
  | 'battle'
  | 'dmr'
  | 'sniper'
  | 'shotgun'
  | 'lmg';

export type ActionType =
  | 'direct-impingement'
  | 'short-stroke-piston'
  | 'long-stroke-piston'
  | 'roller-delayed'
  | 'straight-blowback'
  | 'short-recoil-tilting-barrel'
  | 'short-recoil-rotating-bolt'
  | 'gas-operated-rotating-bolt'
  | 'turn-bolt'
  | 'pump'
  | 'revolver-da-sa'
  | 'inertia-delayed';

export type FeedType = 'box-magazine' | 'tubular-magazine' | 'belt' | 'cylinder' | 'top-magazine' | 'grip-magazine';

export interface TechnicalSpecification {
  manufacturer: string;
  designation: string;
  origin: string; // country
  designed: SpecValue<number>; // year
  category: FirearmCategory;
  categoryLabel: string;
  cartridge: string;
  action: ActionType;
  actionLabel: string;
  feed: FeedType;
  capacity: SpecValue<string>;
  overallLength: SpecValue<number>; // mm
  overallLengthCollapsed?: SpecValue<number>; // mm
  barrelLength: SpecValue<number>; // mm
  mass: SpecValue<number>; // g, unloaded unless noted
  muzzleVelocity: SpecValue<number>; // m/s, with noted load
  rateOfFire: SpecValue<string>;
  effectiveRange: SpecValue<number>; // m
  twist?: SpecValue<string>;
  sights: string;
  /** Short, factual identification notes for a layperson. */
  identification: string;
  /** Short mechanical description for an enthusiast. */
  mechanism: string;
}

// ---------------------------------------------------------------------------
// Geometry (parametric builders)
// ---------------------------------------------------------------------------

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];
export type Axis = 'x' | 'y' | 'z';

export type GeometrySpec =
  | { kind: 'box'; size: Vec3; radius?: number; segments?: number }
  | { kind: 'cylinder'; radius: number; radiusBottom?: number; length: number; axis?: Axis; segments?: number; openEnded?: boolean }
  | { kind: 'lathe'; /** [radius, along-axis] pairs in mm, axis = x by default */ profile: Vec2[]; axis?: Axis; segments?: number }
  | { kind: 'extrude'; /** side profile in the XY plane (x forward, y up), extruded along z */ shape: Vec2[]; depth: number; bevel?: number; holes?: Vec2[][]; axis?: Axis; curveSegments?: number }
  | { kind: 'tube'; path: Vec3[]; radius: number; segments?: number; radialSegments?: number }
  | { kind: 'spring'; radius: number; length: number; turns: number; wire: number; axis?: Axis }
  | { kind: 'rail'; length: number; width?: number; height?: number; axis?: Axis; slotPitch?: number }
  | { kind: 'sphere'; radius: number; segments?: number }
  | { kind: 'torus'; radius: number; tube: number; arc?: number; axis?: Axis }
  | { kind: 'cartridge'; caseDiameter: number; caseLength: number; bulletDiameter: number; bulletLength: number; rimDiameter?: number; shoulder?: number; axis?: Axis }
  | { kind: 'composite'; parts: { geometry: GeometrySpec; position?: Vec3; rotation?: Vec3 }[] };

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export type MaterialProfileId =
  | 'anodised-aluminium-black'
  | 'anodised-aluminium-fde'
  | 'anodised-aluminium-grey'
  | 'parkerised-steel'
  | 'blued-steel'
  | 'stainless-steel'
  | 'stainless-brushed'
  | 'nitride-steel'
  | 'chrome'
  | 'polymer-black'
  | 'polymer-fde'
  | 'polymer-od'
  | 'polymer-translucent'
  | 'rubber-black'
  | 'brass'
  | 'copper'
  | 'wood-laminate'
  | 'wood-walnut'
  | 'bakelite'
  | 'steel-worn'
  | 'glass-optic'
  | 'paint-od';

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export type ComponentGroup =
  | 'receiver'
  | 'barrel'
  | 'gas-system'
  | 'action'
  | 'fire-control'
  | 'feed'
  | 'furniture'
  | 'sights'
  | 'muzzle'
  | 'accessory'
  | 'ammunition';

export interface ComponentDef {
  id: string;
  name: string;
  group: ComponentGroup;
  material: MaterialProfileId;
  /** Display string for the material (e.g. "7075-T6 aluminium, Type III hardcoat anodised"). */
  materialLabel?: string;
  geometry: GeometrySpec;
  position: Vec3;
  rotation?: Vec3;
  /** Rotation pivot relative to the component position (mm). Rotations (animation and strip) happen about this point. */
  pivot?: Vec3;
  /** One-sentence description of what the component does. */
  function: string;
  /** Optional short technical notes; keep factual. */
  notes?: string[];
  /** Confidence in this component's geometry. */
  confidence?: Confidence;
  /** Components this one interfaces with. */
  adjacent?: string[];
  /** Parent component id; child transforms are relative to the parent. */
  parent?: string;
  /** Field-strip behaviour. Omit for components that stay with the main assembly until the exploded matrix. */
  strip?: StripBehaviour;
  /** Approximate mass in grams (for the mass distribution view). */
  mass?: number;
  /** Illustrative thermal load 0..1 for the thermal visualisation. Never presented as measured data. */
  thermal?: number;
  /** If true the component is hidden inside another and only visible in x-ray / exploded views. */
  internal?: boolean;
  /** If true, pick/raycast ignores this component (e.g. decorative fasteners). */
  unselectable?: boolean;
}

export interface StripBehaviour {
  /** Stage 1..5 at which this component leaves the assembly. */
  stage: 1 | 2 | 3 | 4 | 5;
  /** Translation in mm applied at full separation (in the firearm frame). */
  offset: Vec3;
  /** Optional rotation applied at full separation (radians). */
  rotate?: Vec3;
  /** Order within the stage: 0 first. Used to stagger timing. */
  order?: number;
  /** Optional direction hint used by the stage choreography camera. */
  motion?: 'down' | 'up' | 'rear' | 'forward' | 'left' | 'right' | 'out';
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export type EasingName =
  | 'linear'
  | 'inQuad' | 'outQuad' | 'inOutQuad'
  | 'inCubic' | 'outCubic' | 'inOutCubic'
  | 'outExpo' | 'inExpo'
  | 'outBack' | 'inBack'
  | 'mechanicalSnap' | 'springReturn' | 'detent';

export interface AnimationStep {
  component: string;
  /** Start and end times (seconds) within the sequence. */
  t: [number, number];
  /** Translation target relative to rest pose (mm). */
  translate?: Vec3;
  /** Rotation target relative to rest pose (radians). */
  rotate?: Vec3;
  easing?: EasingName;
  /** If true the step returns to rest (translate/rotate are ignored). */
  reset?: boolean;
}

export interface AudioCue {
  /** Audio event id in the firearm's acoustic identity. */
  event: AudioEventId;
  /** Time (seconds) within the sequence. */
  at: number;
  /** Optional component the sound originates from (used for spatialisation). */
  component?: string;
  /** Caption shown when captions are enabled. */
  caption?: string;
  intensity?: number;
}

export interface AnimationSequence {
  id: string;
  label: string;
  duration: number; // seconds
  steps: AnimationStep[];
  audio: AudioCue[];
  /** Optional camera preset to move to while the sequence plays. */
  camera?: CameraPresetId;
  /** Set to true if the sequence can be interrupted by another. */
  interruptible?: boolean;
}

/** Action sequence slots. Each firearm provides the ones that apply. */
export interface FirearmActions {
  cycle?: AnimationSequence;      // charge / rack / pump / cock
  dryFire?: AnimationSequence;    // trigger + hammer/striker
  reload?: AnimationSequence;     // magazine out / in
  safety?: AnimationSequence;     // selector / safety
  extra?: AnimationSequence[];    // e.g. cylinder swing-out, stock fold
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

export type AudioEventId =
  | 'charge_pull'      // charging handle / slide / bolt drawn rearward
  | 'bolt_release'     // bolt/slide released forward
  | 'bolt_battery'     // lock-up into battery
  | 'trigger_break'
  | 'trigger_reset'
  | 'hammer_fall'
  | 'striker_fall'
  | 'mag_release'
  | 'mag_out'
  | 'mag_seat'
  | 'selector'
  | 'casing_eject'
  | 'casing_floor'
  | 'pin_push'         // takedown pin
  | 'receiver_split'
  | 'component_out'
  | 'component_seat'
  | 'cylinder_open'
  | 'cylinder_index'
  | 'pump_back'
  | 'pump_forward'
  | 'bolt_lift'
  | 'bolt_close'
  | 'ui_tick'
  | 'ui_click'
  | 'ui_detent';

export type ReceiverMaterialClass = 'aluminium-forged' | 'steel-stamped' | 'steel-milled' | 'polymer' | 'steel-forged';

export interface AcousticIdentity {
  /** Total unloaded mass in grams; sets body resonance. */
  mass: number;
  receiver: ReceiverMaterialClass;
  /** Dominant action architecture; drives event structure. */
  action: ActionType;
  /** Reciprocating mass in grams (bolt carrier group, slide, cylinder...). */
  reciprocatingMass: number;
  /** Recoil / operating spring character. */
  spring: { frequency: number; damping: number };
  /** Furniture material influences secondary contact sounds. */
  furniture: 'polymer' | 'wood' | 'metal';
  /** Per-event overrides for anything the generic model gets wrong. */
  overrides?: Partial<Record<AudioEventId, Partial<AudioLayerParams>>>;
}

export interface AudioLayerParams {
  gain: number;
  /** Body/mass frequency Hz. */
  body: number;
  /** Structural mid resonance Hz. */
  mid: number;
  /** Bright ring Hz. */
  ring: number;
  /** Friction character 0..1 */
  friction: number;
  /** Spring content 0..1 */
  spring: number;
  /** Polymer content 0..1 (softer contact) */
  polymer: number;
  /** Duration of the transient in seconds. */
  duration: number;
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export type CameraPresetId = 'three-quarter' | 'side' | 'side-left' | 'top' | 'front' | 'rear' | 'iso' | 'detail-action' | 'detail-muzzle' | 'detail-grip';

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  /** Direction from target to camera, normalised (firearm frame). */
  direction: Vec3;
  /** Distance multiplier relative to the model's framing radius. */
  distance: number;
  /** Target offset from model centre in mm. */
  target?: Vec3;
}

// ---------------------------------------------------------------------------
// Field strip
// ---------------------------------------------------------------------------

export interface FieldStripStage {
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  title: string;
  /** One sentence of what is happening, written for a visitor, not a manual. */
  description: string;
  /** Camera preset or explicit direction for this stage. */
  camera: CameraPresetId;
  /** Components which are the focus of the stage (others ghost). */
  focus: string[];
  /** Audio cues fired while entering this stage (times relative to stage start). */
  audio: AudioCue[];
}

// ---------------------------------------------------------------------------
// Firearm definition (the whole thing)
// ---------------------------------------------------------------------------

export interface ComparisonProfile {
  /** Silhouette outline points in the XY plane (mm) for the side view comparison; derived if omitted. */
  silhouette?: Vec2[];
  /** Key dimensions to draw as overlays. */
  dimensions: { label: string; from: Vec3; to: Vec3 }[];
}

export interface FirearmDefinition {
  id: string;
  name: string;
  shortName: string;
  spec: TechnicalSpecification;
  provenance: Provenance;
  components: ComponentDef[];
  actions: FirearmActions;
  acoustic: AcousticIdentity;
  fieldStrip: FieldStripStage[];
  comparison?: ComparisonProfile;
  /** Ammunition definition for ejection visualisation. */
  cartridge: { caseDiameter: number; caseLength: number; bulletDiameter: number; bulletLength: number; rimDiameter?: number; label: string };
  /** Ejection port position in the firearm frame (mm), and direction. */
  ejection?: { position: Vec3; direction: Vec3 };
  /** Bore axis end points for the bore-line overlay (mm). */
  bore: { breech: Vec3; muzzle: Vec3 };
}

/** Lightweight entry for the registry, so the whole collection does not have to load up-front. */
export interface FirearmCatalogEntry {
  id: string;
  name: string;
  shortName: string;
  category: FirearmCategory;
  categoryLabel: string;
  cartridge: string;
  actionLabel: string;
  overallLength: number | null;
  mass: number | null;
  origin: string;
  load: () => Promise<FirearmDefinition>;
}
