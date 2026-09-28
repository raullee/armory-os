import * as THREE from 'three';
import type { ComponentDef, ComponentGroup, FirearmDefinition, MaterialProfileId, Vec3 } from './schema';
import { buildGeometry } from '@/geometry/builders';
import { diagnosticColor, getMaterial } from '@/materials/profiles';

export type RenderMode = 'pbr' | 'wireframe' | 'xray' | 'thermal' | 'groups';

export interface ComponentNode {
  def: ComponentDef;
  /** Pivot group: rotations and translations are applied here. */
  node: THREE.Group;
  mesh: THREE.Mesh;
  edges?: THREE.LineSegments;
  rest: { position: THREE.Vector3; rotation: THREE.Euler };
  strip: { offset: THREE.Vector3; rotate: THREE.Euler; t: number };
  anim: { offset: THREE.Vector3; rotate: THREE.Euler };
  /** Cached material variants for this component. */
  materials: { pbr: THREE.Material; ghost?: THREE.Material; xray?: THREE.Material; thermal?: THREE.Material; groups?: THREE.Material; hover?: THREE.Material; select?: THREE.Material };
  hidden: boolean;
  ghosted: boolean;
}

const GROUP_COLORS: Record<ComponentGroup, number> = {
  receiver: 0x9fb3c8,
  barrel: 0x7dd3fc,
  'gas-system': 0xfbbf24,
  action: 0xf87171,
  'fire-control': 0xfb923c,
  feed: 0x34d399,
  furniture: 0xa78bfa,
  sights: 0xf472b6,
  muzzle: 0x38bdf8,
  accessory: 0xc084fc,
  ammunition: 0xfde68a,
};

export const GROUP_LABELS: Record<ComponentGroup, string> = {
  receiver: 'Receiver / frame',
  barrel: 'Barrel',
  'gas-system': 'Gas system',
  action: 'Action',
  'fire-control': 'Fire control',
  feed: 'Feed',
  furniture: 'Furniture',
  sights: 'Sights / optics',
  muzzle: 'Muzzle device',
  accessory: 'Accessory',
  ammunition: 'Ammunition',
};

function thermalColor(t: number): THREE.Color {
  // cold: deep blue -> purple -> red -> orange -> white
  const stops: [number, THREE.Color][] = [
    [0, new THREE.Color(0x0b1a3a)],
    [0.25, new THREE.Color(0x3b1f6e)],
    [0.5, new THREE.Color(0xb3261e)],
    [0.75, new THREE.Color(0xf2851b)],
    [1, new THREE.Color(0xfff2c2)],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      return c0.clone().lerp(c1, (t - t0) / (t1 - t0));
    }
  }
  return stops[stops.length - 1][1].clone();
}

/** Smooth Hermite blend for per-stage windows. */
function smooth(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/**
 * FirearmModel: turns a FirearmDefinition into a scene graph with independently
 * addressable components, rest poses, strip transforms and render-mode variants.
 */
export class FirearmModel {
  readonly def: FirearmDefinition;
  /** Scene-scale group (metres). Add this to the scene. */
  readonly group = new THREE.Group();
  /** Millimetre-space root. */
  readonly root = new THREE.Group();
  readonly nodes = new Map<string, ComponentNode>();
  readonly selectable: THREE.Mesh[] = [];
  /** Rest-pose bounds in mm. */
  readonly bounds = new THREE.Box3();
  readonly centre = new THREE.Vector3();
  readonly size = new THREE.Vector3();
  mode: RenderMode = 'pbr';
  private stripProgress = 0;
  private groupFilter: Set<ComponentGroup> | null = null;
  private focus: Set<string> | null = null;
  private hovered: ComponentNode | null = null;
  private selected: ComponentNode | null = null;

  constructor(def: FirearmDefinition) {
    this.def = def;
    this.group.scale.setScalar(0.001);
    this.group.add(this.root);
    this.group.name = `firearm:${def.id}`;
    this.build();
    this.computeBounds();
    // Centre on the bore axis horizontally and vertically around the model centre.
    this.root.position.set(-this.centre.x, -this.centre.y, -this.centre.z);
  }

  private build(): void {
    const byId = new Map(this.def.components.map((c) => [c.id, c]));
    // Build parents first (simple topological pass; definitions are small).
    const ordered: ComponentDef[] = [];
    const visited = new Set<string>();
    const visit = (c: ComponentDef) => {
      if (visited.has(c.id)) return;
      if (c.parent && byId.has(c.parent)) visit(byId.get(c.parent)!);
      visited.add(c.id);
      ordered.push(c);
    };
    this.def.components.forEach(visit);

    for (const c of ordered) {
      const geometry = buildGeometry(c.geometry);
      geometry.computeBoundingBox();
      const material = getMaterial(c.material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = c.id;
      const pivot = c.pivot ?? [0, 0, 0];
      mesh.position.set(-pivot[0], -pivot[1], -pivot[2]);
      const node = new THREE.Group();
      node.name = `node:${c.id}`;
      node.position.set(c.position[0] + pivot[0], c.position[1] + pivot[1], c.position[2] + pivot[2]);
      if (c.rotation) node.rotation.set(c.rotation[0], c.rotation[1], c.rotation[2]);
      node.add(mesh);
      const entry: ComponentNode = {
        def: c,
        node,
        mesh,
        rest: { position: node.position.clone(), rotation: node.rotation.clone() },
        strip: {
          offset: new THREE.Vector3(...(c.strip?.offset ?? ([0, 0, 0] as Vec3))),
          rotate: new THREE.Euler(...(c.strip?.rotate ?? ([0, 0, 0] as Vec3))),
          t: 0,
        },
        anim: { offset: new THREE.Vector3(), rotate: new THREE.Euler() },
        materials: { pbr: material },
        hidden: false,
        ghosted: false,
      };
      mesh.userData.component = entry;
      this.nodes.set(c.id, entry);
      if (!c.unselectable) this.selectable.push(mesh);
      const parentNode = c.parent ? this.nodes.get(c.parent) : undefined;
      if (parentNode) parentNode.node.add(node);
      else this.root.add(node);
    }
  }

  private computeBounds(): void {
    this.bounds.makeEmpty();
    const tmp = new THREE.Box3();
    // The scene-scale group applies the 0.001 scale; make sure it is part of the world matrices.
    this.group.updateMatrixWorld(true);
    for (const n of this.nodes.values()) {
      if (n.def.group === 'ammunition') continue;
      tmp.setFromObject(n.mesh, true);
      this.bounds.union(tmp);
    }
    // bounds computed in world space with scale 0.001 -> convert back to mm
    this.bounds.min.multiplyScalar(1000);
    this.bounds.max.multiplyScalar(1000);
    this.bounds.getCenter(this.centre);
    this.bounds.getSize(this.size);
  }

  /** Framing radius in metres for cameras. */
  get framingRadius(): number {
    return Math.max(this.size.x, this.size.y * 1.6, this.size.z) * 0.5 * 0.001;
  }

  get(id: string): ComponentNode | undefined {
    return this.nodes.get(id);
  }

  // ------------------------------------------------------------------ strip

  /** stage progress 0..5 (continuous). Each component's own stage window maps to 0..1. */
  setStripProgress(p: number): void {
    this.stripProgress = Math.max(0, Math.min(5, p));
    let detached = 0;
    for (const n of this.nodes.values()) {
      const s = n.def.strip;
      if (!s) {
        n.strip.t = 0;
        continue;
      }
      const stageStart = s.stage - 1;
      const order = s.order ?? 0;
      // Stagger within the stage: order 0 starts at 0.0, order k starts at k*0.12, all finish by 1.0
      const delay = Math.min(0.5, order * 0.12);
      const local = (this.stripProgress - stageStart - delay) / (1 - delay);
      n.strip.t = smooth(local);
      if (n.strip.t > 0.05) detached++;
    }
    this.applyTransforms();
    this.group.userData.detached = detached;
  }

  get detachedCount(): number {
    return (this.group.userData.detached as number) ?? 0;
  }

  get strippableCount(): number {
    let c = 0;
    this.nodes.forEach((n) => n.def.strip && c++);
    return c;
  }

  // ------------------------------------------------------------------ anim

  setAnim(id: string, translate?: Vec3, rotate?: Vec3): void {
    const n = this.nodes.get(id);
    if (!n) return;
    if (translate) n.anim.offset.set(translate[0], translate[1], translate[2]);
    else n.anim.offset.set(0, 0, 0);
    if (rotate) n.anim.rotate.set(rotate[0], rotate[1], rotate[2]);
    else n.anim.rotate.set(0, 0, 0);
    this.applyNode(n);
  }

  resetAnim(): void {
    for (const n of this.nodes.values()) {
      n.anim.offset.set(0, 0, 0);
      n.anim.rotate.set(0, 0, 0);
    }
    this.applyTransforms();
  }

  applyTransforms(): void {
    for (const n of this.nodes.values()) this.applyNode(n);
  }

  private applyNode(n: ComponentNode): void {
    n.node.position.copy(n.rest.position).addScaledVector(n.strip.offset, n.strip.t).add(n.anim.offset);
    n.node.rotation.set(
      n.rest.rotation.x + n.strip.rotate.x * n.strip.t + n.anim.rotate.x,
      n.rest.rotation.y + n.strip.rotate.y * n.strip.t + n.anim.rotate.y,
      n.rest.rotation.z + n.strip.rotate.z * n.strip.t + n.anim.rotate.z,
    );
  }

  /** World-space position (metres) of a component's origin. */
  worldPosition(id: string, target = new THREE.Vector3()): THREE.Vector3 {
    const n = this.nodes.get(id);
    if (!n) return target.set(0, 0, 0);
    n.node.updateWorldMatrix(true, false);
    return target.setFromMatrixPosition(n.node.matrixWorld);
  }

  /** World-space bounding box centre (metres) of a component. */
  worldCentre(id: string, target = new THREE.Vector3()): THREE.Vector3 {
    const n = this.nodes.get(id);
    if (!n) return target.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(n.mesh, true);
    return box.getCenter(target);
  }

  // ------------------------------------------------------------------ modes

  setRenderMode(mode: RenderMode): void {
    this.mode = mode;
    for (const n of this.nodes.values()) this.applyMaterial(n);
  }

  setGroupFilter(groups: ComponentGroup[] | null): void {
    this.groupFilter = groups ? new Set(groups) : null;
    for (const n of this.nodes.values()) this.applyVisibility(n);
  }

  /** Focus: the listed components render normally, everything else ghosts. */
  setFocus(ids: string[] | null): void {
    this.focus = ids && ids.length ? new Set(ids) : null;
    for (const n of this.nodes.values()) {
      n.ghosted = !!this.focus && !this.focus.has(n.def.id) && !this.isDescendantOfFocus(n);
      this.applyMaterial(n);
    }
  }

  private isDescendantOfFocus(n: ComponentNode): boolean {
    let p = n.def.parent;
    while (p) {
      if (this.focus?.has(p)) return true;
      p = this.nodes.get(p)?.def.parent;
    }
    return false;
  }

  setComponentVisible(id: string, visible: boolean): void {
    const n = this.nodes.get(id);
    if (!n) return;
    n.hidden = !visible;
    this.applyVisibility(n);
  }

  private applyVisibility(n: ComponentNode): void {
    const groupOk = !this.groupFilter || this.groupFilter.has(n.def.group);
    n.node.visible = groupOk && !n.hidden;
  }

  private variant(n: ComponentNode, key: keyof ComponentNode['materials']): THREE.Material {
    const cached = n.materials[key];
    if (cached) return cached;
    const c = n.def;
    const base = n.materials.pbr as THREE.MeshPhysicalMaterial;
    let m: THREE.Material;
    switch (key) {
      case 'ghost':
        m = new THREE.MeshPhysicalMaterial({ color: base.color, metalness: 0.2, roughness: 0.8, transparent: true, opacity: 0.1, depthWrite: false });
        break;
      case 'xray': {
        const col = c.internal ? 0xfacc15 : diagnosticColor(c.material as MaterialProfileId);
        m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: c.internal ? 0.85 : 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
        break;
      }
      case 'thermal': {
        const t = c.thermal ?? (c.group === 'barrel' ? 0.7 : c.group === 'muzzle' ? 0.85 : c.group === 'gas-system' ? 0.8 : c.group === 'action' ? 0.5 : 0.12);
        const col = thermalColor(t);
        m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, roughness: 0.9, metalness: 0 });
        break;
      }
      case 'groups':
        m = new THREE.MeshStandardMaterial({ color: GROUP_COLORS[c.group], roughness: 0.6, metalness: 0.1 });
        break;
      case 'hover':
        m = base.clone();
        (m as THREE.MeshPhysicalMaterial).emissive = new THREE.Color(0x22d3ee);
        (m as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.18;
        break;
      case 'select':
        m = base.clone();
        (m as THREE.MeshPhysicalMaterial).emissive = new THREE.Color(0x67e8f9);
        (m as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.32;
        break;
      default:
        m = base;
    }
    n.materials[key] = m;
    return m;
  }

  private applyMaterial(n: ComponentNode): void {
    const wire = this.mode === 'wireframe';
    if (wire && !n.edges) {
      const eg = new THREE.EdgesGeometry(n.mesh.geometry, 28);
      const lm = new THREE.LineBasicMaterial({ color: diagnosticColor(n.def.material as MaterialProfileId), transparent: true, opacity: 0.75 });
      n.edges = new THREE.LineSegments(eg, lm);
      n.edges.name = `edges:${n.def.id}`;
      n.mesh.add(n.edges);
    }
    if (n.edges) n.edges.visible = wire;

    let mat: THREE.Material;
    if (n.ghosted) mat = this.variant(n, 'ghost');
    else if (wire) mat = this.wireFill(n);
    else if (this.mode === 'xray') mat = this.variant(n, 'xray');
    else if (this.mode === 'thermal') mat = this.variant(n, 'thermal');
    else if (this.mode === 'groups') mat = this.variant(n, 'groups');
    else if (this.selected === n) mat = this.variant(n, 'select');
    else if (this.hovered === n) mat = this.variant(n, 'hover');
    else mat = n.materials.pbr;
    n.mesh.material = mat;
    // In x-ray, internal parts should not be occluded by the ghost shell.
    n.mesh.renderOrder = this.mode === 'xray' ? (n.def.internal ? 2 : 1) : 0;
  }

  private wireFillMat?: THREE.Material;
  private wireFill(_n: ComponentNode): THREE.Material {
    if (!this.wireFillMat) this.wireFillMat = new THREE.MeshBasicMaterial({ color: 0x0b0d10, transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    return this.wireFillMat;
  }

  setHover(id: string | null): void {
    const next = id ? this.nodes.get(id) ?? null : null;
    if (next === this.hovered) return;
    const prev = this.hovered;
    this.hovered = next;
    if (prev) this.applyMaterial(prev);
    if (next) this.applyMaterial(next);
  }

  setSelected(id: string | null): void {
    const next = id ? this.nodes.get(id) ?? null : null;
    if (next === this.selected) return;
    const prev = this.selected;
    this.selected = next;
    if (prev) this.applyMaterial(prev);
    if (next) this.applyMaterial(next);
  }

  get selectedId(): string | null {
    return this.selected?.def.id ?? null;
  }

  /** Total mass of components with a mass value (g). */
  get componentMass(): number {
    let m = 0;
    this.nodes.forEach((n) => (m += n.def.mass ?? 0));
    return m;
  }

  dispose(): void {
    for (const n of this.nodes.values()) {
      n.mesh.geometry.dispose();
      n.edges?.geometry.dispose();
      (n.edges?.material as THREE.Material | undefined)?.dispose();
      Object.entries(n.materials).forEach(([k, m]) => {
        if (k !== 'pbr' && m) (m as THREE.Material).dispose();
      });
    }
    this.wireFillMat?.dispose();
    this.nodes.clear();
    this.selectable.length = 0;
    this.group.removeFromParent();
  }
}
