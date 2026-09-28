import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { CameraPresetId, FirearmDefinition, Vec3 } from '@/firearm/schema';
import { FirearmModel, type ComponentNode } from '@/firearm/FirearmModel';
import { CAMERA_PRESETS } from './cameraPresets';
import { cameraEase } from '@/animation/easing';
import { radialShadow } from '@/materials/textures';
import { buildCartridge } from '@/geometry/builders';
import { getMaterial } from '@/materials/profiles';

export type QualityTier = 'low' | 'medium' | 'high';

export interface ViewerOptions {
  quality: QualityTier;
  reducedMotion: boolean;
  /** Accent colour for callouts. */
  accent?: string;
  /** Skip ground/shadow for the compact comparator viewports. */
  compact?: boolean;
}

interface Casing {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rot: THREE.Vector3;
  bounces: number;
  age: number;
}

/**
 * Viewer: renderer, lighting, camera rig, picking and overlays for one
 * FirearmModel. The exhibition view owns one; the comparator owns two.
 */
export class Viewer {
  readonly container: HTMLElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly labelRenderer: CSS2DRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly ortho: THREE.OrthographicCamera;
  readonly controls: OrbitControls;
  model: FirearmModel | null = null;
  activeCamera: THREE.Camera;
  private opts: ViewerOptions;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-9, -9);
  private pointerInside = false;
  private hovered: ComponentNode | null = null;
  private hoverListeners: ((c: ComponentNode | null, screen: { x: number; y: number }) => void)[] = [];
  private selectListeners: ((c: ComponentNode | null) => void)[] = [];
  private camTween: { t: number; d: number; from: THREE.Vector3; to: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3 } | null = null;
  private ground: THREE.Mesh;
  private contact: THREE.Mesh;
  private keyLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private callouts: CSS2DObject[] = [];
  private calloutLines: THREE.LineSegments | null = null;
  private measurements: THREE.Group | null = null;
  private boreLine: THREE.Line | null = null;
  private casings: Casing[] = [];
  private casingGeo: THREE.BufferGeometry | null = null;
  private trueScale = false;
  private autoRotate = false;
  private downPos = { x: 0, y: 0, t: 0 };
  private visible = true;
  private frameTimes: number[] = [];
  private dprCap: number;
  private floorY = -0.2;
  private pmrem: THREE.PMREMGenerator;
  onCasingFloor?: (bounce: number, pan: number) => void;
  onCasingEject?: () => void;
  /** Screen-space x (-1..1) of the last-played component, for audio panning. */
  paused = false;

  constructor(container: HTMLElement, opts: ViewerOptions) {
    this.container = container;
    this.opts = opts;
    this.dprCap = opts.quality === 'high' ? 2 : opts.quality === 'medium' ? 1.5 : 1;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.dprCap));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = opts.quality !== 'low' && !opts.compact;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.className = 'viewer-canvas';
    this.renderer.domElement.setAttribute('tabindex', '0');
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D firearm viewer');
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'viewer-labels';
    container.appendChild(this.labelRenderer.domElement);

    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 3.5, 9);

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.01, 40);
    this.camera.position.set(0.9, 0.5, 1.3);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 40);
    this.activeCamera = this.camera;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = opts.reducedMotion ? 0.3 : 0.075;
    this.controls.rotateSpeed = 0.75;
    this.controls.zoomSpeed = 0.9;
    this.controls.panSpeed = 0.7;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 0.12;
    this.controls.maxDistance = 6;
    this.controls.maxPolarAngle = Math.PI * 0.92;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.listenToKeyEvents(this.renderer.domElement);

    // Environment lighting: PMREM'd room for physically plausible reflections.
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.38;

    this.keyLight = new THREE.DirectionalLight(0xfff4e6, 1.9);
    this.keyLight.position.set(1.6, 2.4, 1.4);
    this.keyLight.castShadow = this.renderer.shadowMap.enabled;
    this.keyLight.shadow.mapSize.set(opts.quality === 'high' ? 2048 : 1024, opts.quality === 'high' ? 2048 : 1024);
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.01;
    this.keyLight.shadow.radius = 4;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xbfe3ff, 1.9);
    this.rimLight.position.set(-1.8, 1.2, -1.6);
    this.scene.add(this.rimLight);

    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.fillLight.position.set(-0.6, -0.4, 1.8);
    this.scene.add(this.fillLight);

    // Ground: dark exhibition plinth surface receiving the key-light shadow, plus a soft contact disc.
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.96, metalness: 0.0 });
    this.ground = new THREE.Mesh(new THREE.CircleGeometry(14, 64), groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.visible = !opts.compact;
    this.scene.add(this.ground);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.6 });
    const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), shadowMat);
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = 0.0005;
    shadowCatcher.receiveShadow = true;
    shadowCatcher.visible = !opts.compact;
    this.ground.add(shadowCatcher);
    this.contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radialShadow(), transparent: true, opacity: 0.7, depthWrite: false }));
    this.contact.rotation.x = -Math.PI / 2;
    this.contact.renderOrder = -1;
    this.scene.add(this.contact);

    this.bindPointer();
    this.resize();
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => (this.visible = e.isIntersecting)), { threshold: 0.02 });
      io.observe(container);
    }
  }

  // ------------------------------------------------------------------ model

  setModel(def: FirearmDefinition): FirearmModel {
    this.clearModel();
    const model = new FirearmModel(def);
    this.model = model;
    this.scene.add(model.group);
    this.layoutGround();
    this.updateBoreLine();
    return model;
  }

  clearModel(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.clearCallouts();
    this.setMeasurements(false);
    if (this.boreLine) {
      this.scene.remove(this.boreLine);
      this.boreLine.geometry.dispose();
      this.boreLine = null;
    }
    this.hovered = null;
  }

  private layoutGround(): void {
    if (!this.model) return;
    const m = this.model;
    // model group is centred at origin; bottom of model in metres:
    const bottom = (m.bounds.min.y - m.centre.y) * 0.001;
    this.floorY = bottom - 0.06;
    this.ground.position.y = this.floorY;
    this.contact.position.y = this.floorY + 0.0008;
    const w = m.size.x * 0.001 * 1.35;
    const d = Math.max(m.size.z * 0.001 * 2.5, 0.25);
    this.contact.scale.set(w, d, 1);
    const r = m.framingRadius;
    this.controls.minDistance = r * 0.25;
    this.controls.maxDistance = r * 6;
    this.scene.fog = new THREE.Fog(0x050505, r * 4, r * 11);
    this.keyLight.shadow.camera.left = -r * 1.6;
    this.keyLight.shadow.camera.right = r * 1.6;
    this.keyLight.shadow.camera.top = r * 1.6;
    this.keyLight.shadow.camera.bottom = -r * 1.6;
    this.keyLight.shadow.camera.near = 0.1;
    this.keyLight.shadow.camera.far = 12;
    this.keyLight.shadow.camera.updateProjectionMatrix();
    this.keyLight.position.set(r * 1.6, r * 2.6, r * 1.4);
    this.rimLight.position.set(-r * 1.8, r * 1.2, -r * 1.6);
    this.ground.scale.setScalar(Math.max(1, r * 1.2));
  }

  // ------------------------------------------------------------------ camera

  private framingOverride: THREE.Vector3 | null = null;
  /** Pixels on the left of the canvas covered by UI (the collection rail); the model is framed in the remaining area. */
  private insetLeft = 0;

  setViewportInset(leftPx: number): void {
    this.insetLeft = Math.max(0, leftPx);
  }

  /** Force the framing extents (mm), used by the comparator's true-scale mode. */
  setFramingOverride(size: THREE.Vector3 | null): void {
    this.framingOverride = size ? size.clone() : null;
    this.layoutGround();
  }

  framingDistancePublic(): number {
    return this.framingDistance(1);
  }

  /**
   * Distance at which the model's length fits the horizontal field of view and its
   * height fits the vertical one, with room for the HUD. Fitting by extent rather
   * than by bounding sphere keeps a pistol and a rifle at comparable screen scale.
   */
  private framingDistance(mult = 1): number {
    if (!this.model) return 1.5;
    const size = this.framingOverride ?? this.model.size;
    const sx = Math.max(size.x, size.z) * 0.001;
    const sy = size.y * 0.001;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const w = this.container.clientWidth || 1;
    const effAspect = this.camera.aspect * Math.max(0.3, (w - this.insetLeft) / w);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * effAspect);
    const dx = (sx / 2) / Math.tan(hfov / 2);
    const dy = (sy / 2) / Math.tan(vfov / 2);
    const portrait = effAspect < 1;
    return Math.max(dx * (portrait ? 1.12 : 1.28), dy * 1.9, 0.12) * mult;
  }

  /** Move to a preset. Direction is in the firearm frame. Model group is at origin so firearm frame == world frame. */
  goTo(presetId: CameraPresetId, animate = true, distanceMult = 1): void {
    const p = CAMERA_PRESETS[presetId];
    if (!p || !this.model) return;
    const dir = new THREE.Vector3(...p.direction).normalize();
    const target = new THREE.Vector3(...(p.target ?? ([0, 0, 0] as Vec3))).multiplyScalar(0.001);
    // preset target is relative to the firearm origin; group is recentred so subtract centre
    if (p.target) target.sub(this.model.centre.clone().multiplyScalar(0.001));
    const dist = this.framingDistance(p.distance * distanceMult);
    this.applyInset(target, dir, dist);
    const pos = target.clone().addScaledVector(dir, dist);
    this.flyTo(pos, target, animate);
  }

  /** Move the orbit target so the model appears centred in the part of the canvas not covered by the rail. */
  private applyInset(target: THREE.Vector3, dir: THREE.Vector3, dist: number): void {
    const w = this.container.clientWidth || 1;
    if (this.insetLeft <= 0 || this.insetLeft >= w) return;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const worldWidth = 2 * dist * Math.tan(vfov / 2) * this.camera.aspect;
    const shift = (this.insetLeft / 2 / w) * worldWidth;
    const right = new THREE.Vector3().crossVectors(this.camera.up, dir).normalize();
    // camera right vector points to screen-right; moving the target left shifts the model right on screen
    target.addScaledVector(right, -shift);
  }

  flyTo(pos: THREE.Vector3, target: THREE.Vector3, animate = true, duration = 0.95): void {
    if (!animate || this.opts.reducedMotion) {
      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      this.controls.update();
      this.camTween = null;
      return;
    }
    this.camTween = { t: 0, d: duration, from: this.camera.position.clone(), to: pos, fromT: this.controls.target.clone(), toT: target };
  }

  /** Re-frame the current view so the model (in its current, possibly exploded, state) fits, by extent. */
  fitCurrent(animate = true, padding = 1.15): void {
    if (!this.model) return;
    const box = new THREE.Box3().setFromObject(this.model.group, true);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const w = this.container.clientWidth || 1;
    const effAspect = this.camera.aspect * Math.max(0.3, (w - this.insetLeft) / w);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * effAspect);
    // horizontal extent depends on the view direction; take the larger of x/z, vertical is y plus a share of depth
    const horiz = Math.max(size.x * Math.abs(dir.z) + size.z * Math.abs(dir.x), Math.min(size.x, size.z));
    const vert = size.y + (size.x * Math.abs(dir.y)) * 0.5;
    const dist = Math.max((horiz / 2) / Math.tan(hfov / 2), (vert / 2) / Math.tan(vfov / 2), this.controls.minDistance) * padding;
    const target = centre.clone();
    this.applyInset(target, dir, dist);
    this.flyTo(target.clone().addScaledVector(dir, dist), target, animate, 0.8);
  }

  /** Frame a specific component with the current orbit direction. */
  focusComponent(id: string, animate = true): void {
    if (!this.model) return;
    const n = this.model.get(id);
    if (!n) return;
    const box = new THREE.Box3().setFromObject(n.mesh, true);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    const dist = Math.max(this.controls.minDistance * 1.2, (sphere.radius / Math.sin(THREE.MathUtils.degToRad(this.camera.fov) / 2)) * 1.6);
    this.flyTo(sphere.center.clone().addScaledVector(dir, dist), sphere.center, animate, 0.75);
  }

  setAutoRotate(on: boolean): void {
    this.autoRotate = on;
    this.controls.autoRotate = on && !this.opts.reducedMotion;
  }

  get isAutoRotating(): boolean {
    return this.autoRotate;
  }

  /** True 1:1 mode: orthographic side view with 1 mm = 96/25.4 CSS px. */
  setTrueScale(on: boolean): void {
    this.trueScale = on;
    if (on) {
      this.activeCamera = this.ortho;
      this.updateOrtho();
      this.controls.enabled = false;
    } else {
      this.activeCamera = this.camera;
      this.controls.enabled = true;
    }
  }

  get isTrueScale(): boolean {
    return this.trueScale;
  }

  private updateOrtho(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const mmPerPx = 25.4 / 96;
    const halfW = (w * mmPerPx * 0.001) / 2;
    const halfH = (h * mmPerPx * 0.001) / 2;
    this.ortho.left = -halfW;
    this.ortho.right = halfW;
    this.ortho.top = halfH;
    this.ortho.bottom = -halfH;
    this.ortho.position.set(0, 0, 3);
    this.ortho.lookAt(0, 0, 0);
    this.ortho.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------ overlays

  clearCallouts(): void {
    this.callouts.forEach((c) => {
      c.element.remove();
      c.removeFromParent();
    });
    this.callouts = [];
    if (this.calloutLines) {
      this.scene.remove(this.calloutLines);
      this.calloutLines.geometry.dispose();
      this.calloutLines = null;
    }
  }

  /** Label the given components with leader lines. Anchors fan out above and below the model so labels never stack. */
  setCallouts(ids: string[]): void {
    this.clearCallouts();
    if (!this.model || !ids.length) return;
    const positions: number[] = [];
    const camDir = this.camera.position.clone().sub(this.controls.target).normalize();
    const right = new THREE.Vector3().crossVectors(this.camera.up, camDir).normalize();
    const up = new THREE.Vector3().crossVectors(camDir, right).normalize();
    const r = this.model.framingRadius;
    const valid = ids.map((id) => this.model!.get(id)).filter((n): n is ComponentNode => !!n && n.node.visible);
    valid.forEach((n, i) => {
      const centre = this.model!.worldCentre(n.def.id);
      // fan: alternate above/below, spread sideways by index so leaders diverge
      const side = i % 2 === 0 ? 1 : -1;
      const lane = Math.floor(i / 2);
      const anchor = centre
        .clone()
        .addScaledVector(up, side * r * (0.55 + lane * 0.16))
        .addScaledVector(right, (lane - (valid.length - 1) / 4) * r * 0.22)
        .addScaledVector(camDir, 0.02);
      const el = document.createElement('div');
      el.className = 'callout';
      const idx = document.createElement('span');
      idx.className = 'callout-index';
      idx.textContent = String(i + 1).padStart(2, '0');
      const name = document.createElement('span');
      name.className = 'callout-name';
      name.textContent = n.def.name;
      name.dataset.id = n.def.id;
      el.append(idx, name);
      const obj = new CSS2DObject(el);
      obj.position.copy(anchor);
      this.scene.add(obj);
      this.callouts.push(obj);
      positions.push(centre.x, centre.y, centre.z, anchor.x, anchor.y, anchor.z);
    });
    if (positions.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      this.calloutLines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x8a8a86, transparent: true, opacity: 0.6, depthTest: false }));
      this.calloutLines.renderOrder = 5;
      this.scene.add(this.calloutLines);
    }
  }

  /** Update callout line endpoints as parts move. */
  private refreshCalloutLines(): void {
    if (!this.calloutLines || !this.model) return;
    const attr = this.calloutLines.geometry.attributes.position as THREE.BufferAttribute;
    let i = 0;
    for (const c of this.callouts) {
      const id = (c.element.querySelector('.callout-name') as HTMLElement | null)?.dataset.id;
      if (!id || !this.model.get(id)) continue;
      const centre = this.model.worldCentre(id);
      attr.setXYZ(i * 2, centre.x, centre.y, centre.z);
      i++;
    }
    attr.needsUpdate = true;
  }

  setMeasurements(on: boolean): void {
    if (this.measurements) {
      this.measurements.traverse((o) => {
        if (o instanceof CSS2DObject) o.element.remove();
      });
      this.scene.remove(this.measurements);
      this.measurements = null;
    }
    if (!on || !this.model) return;
    const dims = this.model.def.comparison?.dimensions ?? [];
    const g = new THREE.Group();
    const c = this.model.centre;
    const mat = new THREE.LineBasicMaterial({ color: 0x8fa9bd, transparent: true, opacity: 0.8 });
    const toM = (v: Vec3) => new THREE.Vector3((v[0] - c.x) * 0.001, (v[1] - c.y) * 0.001, (v[2] - c.z) * 0.001);
    dims.forEach((d) => {
      const a = toM(d.from);
      const b = toM(d.to);
      const dir = b.clone().sub(a).normalize();
      const tick = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(0.012);
      const pts = [a, b, a.clone().add(tick), a.clone().sub(tick), b.clone().add(tick), b.clone().sub(tick)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const idx = [0, 1, 2, 3, 4, 5];
      geo.setIndex(idx);
      g.add(new THREE.LineSegments(geo, mat));
      const el = document.createElement('div');
      el.className = 'measure-label';
      el.textContent = d.label;
      const label = new CSS2DObject(el);
      label.position.copy(a.clone().lerp(b, 0.5)).add(new THREE.Vector3(0, -0.018, 0));
      g.add(label);
    });
    // height dimension derived from bounds
    const h = this.model.size.y;
    const hx = (this.model.bounds.max.x - c.x) * 0.001 + 0.06;
    const ha = new THREE.Vector3(hx, (this.model.bounds.min.y - c.y) * 0.001, 0);
    const hb = new THREE.Vector3(hx, (this.model.bounds.max.y - c.y) * 0.001, 0);
    const hg = new THREE.BufferGeometry().setFromPoints([ha, hb, ha.clone().add(new THREE.Vector3(-0.012, 0, 0)), ha.clone().add(new THREE.Vector3(0.012, 0, 0)), hb.clone().add(new THREE.Vector3(-0.012, 0, 0)), hb.clone().add(new THREE.Vector3(0.012, 0, 0))]);
    hg.setIndex([0, 1, 2, 3, 4, 5]);
    g.add(new THREE.LineSegments(hg, mat));
    const hel = document.createElement('div');
    hel.className = 'measure-label';
    hel.textContent = `Height ${Math.round(h)} mm (as modelled)`;
    const hl = new CSS2DObject(hel);
    hl.position.copy(ha.clone().lerp(hb, 0.5)).add(new THREE.Vector3(0.03, 0, 0));
    g.add(hl);
    this.measurements = g;
    this.scene.add(g);
  }

  get hasMeasurements(): boolean {
    return !!this.measurements;
  }

  private updateBoreLine(): void {
    if (this.boreLine) {
      this.scene.remove(this.boreLine);
      this.boreLine.geometry.dispose();
      this.boreLine = null;
    }
    if (!this.model) return;
    const c = this.model.centre;
    const b = this.model.def.bore;
    const a = new THREE.Vector3((b.breech[0] - c.x) * 0.001, (b.breech[1] - c.y) * 0.001, (b.breech[2] - c.z) * 0.001);
    const m = new THREE.Vector3((b.muzzle[0] - c.x) * 0.001, (b.muzzle[1] - c.y) * 0.001, (b.muzzle[2] - c.z) * 0.001);
    const dir = m.clone().sub(a).normalize();
    const end = m.clone().addScaledVector(dir, 1.2);
    const geo = new THREE.BufferGeometry().setFromPoints([a, end]);
    const mat = new THREE.LineDashedMaterial({ color: 0x67e8f9, dashSize: 0.02, gapSize: 0.012, transparent: true, opacity: 0.55 });
    this.boreLine = new THREE.Line(geo, mat);
    this.boreLine.computeLineDistances();
    this.boreLine.visible = false;
    this.scene.add(this.boreLine);
  }

  setBoreLine(on: boolean): void {
    if (this.boreLine) this.boreLine.visible = on;
  }

  get hasBoreLine(): boolean {
    return !!this.boreLine?.visible;
  }

  // ------------------------------------------------------------------ casings

  spawnCasing(): void {
    if (!this.model) return;
    const def = this.model.def;
    if (!this.casingGeo) {
      const { case: c } = buildCartridge(def.cartridge.caseDiameter, def.cartridge.caseLength, def.cartridge.bulletDiameter, def.cartridge.bulletLength, def.cartridge.rimDiameter);
      c.scale(0.001, 0.001, 0.001);
      this.casingGeo = c;
    }
    const mesh = new THREE.Mesh(this.casingGeo, getMaterial('brass'));
    mesh.castShadow = true;
    const ej = def.ejection ?? { position: [0, 0, 15] as Vec3, direction: [0.3, 0.6, 1] as Vec3 };
    const c = this.model.centre;
    mesh.position.set((ej.position[0] - c.x) * 0.001, (ej.position[1] - c.y) * 0.001, (ej.position[2] - c.z) * 0.001);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    const dir = new THREE.Vector3(...ej.direction).normalize();
    const speed = 1.6 + Math.random() * 0.6;
    const vel = dir.clone().multiplyScalar(speed).add(new THREE.Vector3((Math.random() - 0.5) * 0.3, Math.random() * 0.3, (Math.random() - 0.5) * 0.2));
    this.scene.add(mesh);
    this.casings.push({ mesh, vel, rot: new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30), bounces: 0, age: 0 });
    this.onCasingEject?.();
  }

  private updateCasings(dt: number): void {
    if (!this.casings.length) return;
    const g = 9.81;
    const floor = this.floorY + 0.0045;
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.age += dt;
      if (c.age > 6) {
        this.scene.remove(c.mesh);
        this.casings.splice(i, 1);
        continue;
      }
      c.vel.y -= g * dt;
      c.mesh.position.addScaledVector(c.vel, dt);
      c.mesh.rotation.x += c.rot.x * dt;
      c.mesh.rotation.y += c.rot.y * dt;
      c.mesh.rotation.z += c.rot.z * dt;
      if (c.mesh.position.y <= floor) {
        c.mesh.position.y = floor;
        if (Math.abs(c.vel.y) > 0.25) {
          c.vel.y = -c.vel.y * 0.42;
          c.vel.x *= 0.7;
          c.vel.z *= 0.7;
          c.rot.multiplyScalar(0.55);
          c.bounces++;
          if (c.bounces <= 3) this.onCasingFloor?.(c.bounces, THREE.MathUtils.clamp(c.mesh.position.x / 0.6, -1, 1));
        } else {
          c.vel.set(0, 0, 0);
          c.rot.set(0, 0, 0);
          // lie flat
          c.mesh.rotation.x = 0;
          c.mesh.rotation.z = Math.PI / 2;
        }
      }
    }
  }

  // ------------------------------------------------------------------ picking

  private bindPointer(): void {
    const el = this.renderer.domElement;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.pointerInside = true;
    });
    el.addEventListener('pointerleave', () => {
      this.pointerInside = false;
      this.pointer.set(-9, -9);
    });
    el.addEventListener('pointerdown', (e) => {
      this.downPos = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    el.addEventListener('pointerup', (e) => {
      const moved = Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y);
      if (moved < 6 && performance.now() - this.downPos.t < 400) {
        const r = el.getBoundingClientRect();
        this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        const hit = this.pick();
        this.selectListeners.forEach((f) => f(hit));
      }
    });
  }

  private pick(): ComponentNode | null {
    if (!this.model || this.trueScale) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.model.selectable.filter((m) => m.visible && m.parent?.visible !== false), false);
    for (const h of hits) {
      const n = (h.object as THREE.Mesh).userData.component as ComponentNode | undefined;
      if (!n) continue;
      if (n.ghosted) continue;
      // in x-ray mode prefer internal parts
      return n;
    }
    return null;
  }

  onHover(fn: (c: ComponentNode | null, screen: { x: number; y: number }) => void): () => void {
    this.hoverListeners.push(fn);
    return () => (this.hoverListeners = this.hoverListeners.filter((f) => f !== fn));
  }

  onSelect(fn: (c: ComponentNode | null) => void): () => void {
    this.selectListeners.push(fn);
    return () => (this.selectListeners = this.selectListeners.filter((f) => f !== fn));
  }

  /** Screen-space x of a component in -1..1, for audio panning. */
  screenX(id: string): number {
    if (!this.model) return 0;
    const p = this.model.worldCentre(id).project(this.camera);
    return THREE.MathUtils.clamp(p.x, -1, 1);
  }

  /** Normalised camera distance 0..1 relative to the framing distance, for audio distance attenuation. */
  distanceFactor(): number {
    if (!this.model) return 0;
    const d = this.camera.position.distanceTo(this.controls.target);
    const f = this.framingDistance(1);
    return THREE.MathUtils.clamp((d - f * 0.4) / (f * 4), 0, 1);
  }

  // ------------------------------------------------------------------ loop

  resize(): void {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.labelRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.trueScale) this.updateOrtho();
  }

  update(dt: number): void {
    if (this.paused || !this.visible) return;
    if (this.camTween) {
      const tw = this.camTween;
      tw.t += dt;
      const k = cameraEase(Math.min(1, tw.t / tw.d));
      this.camera.position.lerpVectors(tw.from, tw.to, k);
      this.controls.target.lerpVectors(tw.fromT, tw.toT, k);
      if (tw.t >= tw.d) this.camTween = null;
    }
    this.controls.update();
    this.updateCasings(dt);

    if (this.model) {
      const hit = this.pointerInside ? this.pick() : null;
      if (hit !== this.hovered) {
        this.hovered = hit;
        this.model.setHover(hit?.def.id ?? null);
        this.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
        const r = this.renderer.domElement.getBoundingClientRect();
        this.hoverListeners.forEach((f) => f(hit, { x: ((this.pointer.x + 1) / 2) * r.width, y: ((1 - this.pointer.y) / 2) * r.height }));
      }
      if (this.callouts.length) this.refreshCalloutLines();
    }

    const t0 = performance.now();
    this.renderer.render(this.scene, this.activeCamera);
    this.labelRenderer.render(this.scene, this.activeCamera);
    this.governFrameRate(performance.now() - t0);
  }

  /** Adaptive resolution: if frames are consistently slow, step the pixel ratio down. */
  private governFrameRate(ms: number): void {
    this.frameTimes.push(ms);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    const current = this.renderer.getPixelRatio();
    if (avg > 15 && current > 1) {
      this.renderer.setPixelRatio(Math.max(1, current - 0.25));
    } else if (avg < 6 && current < Math.min(window.devicePixelRatio, this.dprCap)) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.dprCap, current + 0.25));
    }
  }

  dispose(): void {
    this.clearModel();
    this.controls.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
  }
}
