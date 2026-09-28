import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Axis, GeometrySpec, Vec2, Vec3 } from '@/firearm/schema';

/**
 * Parametric geometry builders. All dimensions are millimetres. The output
 * geometry is in the component's local frame; the FirearmModel places it.
 *
 * Quality tiers scale segment counts so mobile devices get lighter meshes.
 */

export type QualityTier = 'low' | 'medium' | 'high';
let quality: QualityTier = 'high';
export function setGeometryQuality(q: QualityTier): void {
  quality = q;
}
function segs(base: number): number {
  const f = quality === 'high' ? 1 : quality === 'medium' ? 0.66 : 0.45;
  return Math.max(6, Math.round(base * f));
}

/** Rotate a geometry so its long axis (built along +Y for cylinders/lathes) aligns with the requested axis. */
function alignAxis(geo: THREE.BufferGeometry, from: Axis, to: Axis): THREE.BufferGeometry {
  if (from === to) return geo;
  if (from === 'y' && to === 'x') geo.rotateZ(-Math.PI / 2);
  else if (from === 'y' && to === 'z') geo.rotateX(Math.PI / 2);
  else if (from === 'z' && to === 'x') geo.rotateY(Math.PI / 2);
  else if (from === 'z' && to === 'y') geo.rotateX(-Math.PI / 2);
  else if (from === 'x' && to === 'y') geo.rotateZ(Math.PI / 2);
  else if (from === 'x' && to === 'z') geo.rotateY(-Math.PI / 2);
  return geo;
}

function shapeFromPoints(points: Vec2[]): THREE.Shape {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
}

export function buildBox(size: Vec3, radius = 0, segments = 2): THREE.BufferGeometry {
  const [w, h, d] = size;
  if (radius > 0) {
    const r = Math.min(radius, Math.min(w, h, d) / 2 - 0.01);
    return new RoundedBoxGeometry(w, h, d, Math.max(1, segments), r);
  }
  return new THREE.BoxGeometry(w, h, d);
}

export function buildCylinder(radius: number, length: number, axis: Axis = 'x', radiusBottom = radius, segments = 32, openEnded = false): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(radius, radiusBottom, length, segs(segments), 1, openEnded);
  return alignAxis(g, 'y', axis);
}

/** Lathe from [radius, position-along-axis] pairs. Profile must be ordered along the axis. */
export function buildLathe(profile: Vec2[], axis: Axis = 'x', segments = 40): THREE.BufferGeometry {
  const pts = profile.map(([r, a]) => new THREE.Vector2(Math.max(0.0001, r), a));
  const g = new THREE.LatheGeometry(pts, segs(segments));
  return alignAxis(g, 'y', axis);
}

export function buildExtrude(shape: Vec2[], depth: number, bevel = 0, holes: Vec2[][] = [], axis: Axis = 'z', curveSegments = 12): THREE.BufferGeometry {
  const s = shapeFromPoints(shape);
  holes.forEach((h) => s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: bevel > 0 ? Math.max(1, segs(3)) : 0,
    curveSegments: segs(curveSegments),
    steps: 1,
  });
  // centre along the extrusion axis
  g.translate(0, 0, -depth / 2);
  return alignAxis(g, 'z', axis);
}

export function buildTube(path: Vec3[], radius: number, segments = 32, radialSegments = 10): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(path.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return new THREE.TubeGeometry(curve, segs(segments), radius, segs(radialSegments), false);
}

export function buildSpring(radius: number, length: number, turns: number, wire: number, axis: Axis = 'x'): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const steps = Math.max(8, Math.round(turns * segs(16)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, (t - 0.5) * length));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const g = new THREE.TubeGeometry(curve, steps, wire / 2, segs(8), false);
  return alignAxis(g, 'z', axis);
}

/** MIL-STD-1913 style rail: base + recoil-groove ridges. Slot pitch 10.01 mm, slot width 5.23 mm. */
export function buildRail(length: number, width = 21.2, height = 6, axis: Axis = 'x', slotPitch = 10.01): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const baseH = height * 0.45;
  const base = new THREE.BoxGeometry(length, baseH, width);
  base.translate(0, baseH / 2, 0);
  parts.push(base);
  const ridgeW = slotPitch - 5.23;
  const n = Math.floor(length / slotPitch);
  const start = -((n - 1) * slotPitch) / 2;
  for (let i = 0; i < n; i++) {
    const r = new THREE.BoxGeometry(ridgeW, height - baseH, width);
    r.translate(start + i * slotPitch, baseH + (height - baseH) / 2, 0);
    parts.push(r);
  }
  const g = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  return alignAxis(g, 'x', axis);
}

export function buildSphere(radius: number, segments = 24): THREE.BufferGeometry {
  return new THREE.SphereGeometry(radius, segs(segments), segs(Math.round(segments * 0.7)));
}

export function buildTorus(radius: number, tube: number, arc = Math.PI * 2, axis: Axis = 'z'): THREE.BufferGeometry {
  const g = new THREE.TorusGeometry(radius, tube, segs(12), segs(48), arc);
  return alignAxis(g, 'z', axis);
}

/**
 * Cartridge: brass case as a lathe with optional shoulder, bullet as a tangent ogive approximation.
 * Built along +X with the case head at x=0 and the bullet tip at +x.
 */
export function buildCartridge(caseDiameter: number, caseLength: number, bulletDiameter: number, bulletLength: number, rimDiameter = caseDiameter, shoulder = 0.78, axis: Axis = 'x'): { case: THREE.BufferGeometry; bullet: THREE.BufferGeometry } {
  const rc = caseDiameter / 2;
  const rr = rimDiameter / 2;
  const rb = bulletDiameter / 2;
  const neckStart = caseLength * shoulder;
  const isBottleneck = bulletDiameter < caseDiameter * 0.85;
  const caseProfile: Vec2[] = [
    [0, 0],
    [rr, 0],
    [rr, 1.2],
    [rc * 0.93, 1.2],
    [rc * 0.93, 2.2],
    [rc, 3.4],
  ];
  if (isBottleneck) {
    caseProfile.push([rc, neckStart], [rb * 1.06, neckStart + (caseLength - neckStart) * 0.3], [rb * 1.06, caseLength], [rb * 0.98, caseLength]);
  } else {
    caseProfile.push([rc * 0.985, caseLength], [rb * 0.98, caseLength]);
  }
  const caseGeo = buildLathe(caseProfile, axis, 28);
  // bullet ogive
  const ogive: Vec2[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = rb * Math.sqrt(1 - Math.pow(t, 2.2)) * (t < 0.15 ? 1 : 1);
    ogive.push([Math.max(0.2, r), caseLength - bulletLength * 0.35 + t * bulletLength]);
  }
  const bulletProfile: Vec2[] = [[0, caseLength - bulletLength * 0.35], ...ogive];
  const bulletGeo = buildLathe(bulletProfile, axis, 24);
  return { case: caseGeo, bullet: bulletGeo };
}

function applyOffset(g: THREE.BufferGeometry, position?: Vec3, rotation?: Vec3): THREE.BufferGeometry {
  if (rotation) {
    const [rx, ry, rz] = rotation;
    if (rx) g.rotateX(rx);
    if (ry) g.rotateY(ry);
    if (rz) g.rotateZ(rz);
  }
  if (position) g.translate(position[0], position[1], position[2]);
  return g;
}

/** Builds any GeometrySpec into a single BufferGeometry (composites are merged). */
export function buildGeometry(spec: GeometrySpec): THREE.BufferGeometry {
  switch (spec.kind) {
    case 'box':
      return buildBox(spec.size, spec.radius ?? 0, spec.segments ?? 2);
    case 'cylinder':
      return buildCylinder(spec.radius, spec.length, spec.axis ?? 'x', spec.radiusBottom ?? spec.radius, spec.segments ?? 32, spec.openEnded ?? false);
    case 'lathe':
      return buildLathe(spec.profile, spec.axis ?? 'x', spec.segments ?? 40);
    case 'extrude':
      return buildExtrude(spec.shape, spec.depth, spec.bevel ?? 0, spec.holes ?? [], spec.axis ?? 'z', spec.curveSegments ?? 12);
    case 'tube':
      return buildTube(spec.path, spec.radius, spec.segments ?? 32, spec.radialSegments ?? 10);
    case 'spring':
      return buildSpring(spec.radius, spec.length, spec.turns, spec.wire, spec.axis ?? 'x');
    case 'rail':
      return buildRail(spec.length, spec.width ?? 21.2, spec.height ?? 6, spec.axis ?? 'x', spec.slotPitch ?? 10.01);
    case 'sphere':
      return buildSphere(spec.radius, spec.segments ?? 24);
    case 'torus':
      return buildTorus(spec.radius, spec.tube, spec.arc ?? Math.PI * 2, spec.axis ?? 'z');
    case 'cartridge': {
      const { case: c, bullet } = buildCartridge(spec.caseDiameter, spec.caseLength, spec.bulletDiameter, spec.bulletLength, spec.rimDiameter, spec.shoulder, spec.axis ?? 'x');
      const merged = mergeGeometries([c, bullet], false)!;
      c.dispose();
      bullet.dispose();
      return merged;
    }
    case 'composite': {
      const built = spec.parts.map((p) => applyOffset(buildGeometry(p.geometry), p.position, p.rotation));
      // Merge requires identical attribute sets and a consistent index state. Indexed primitives are
      // de-indexed properly (never by dropping the index, which would leave a triangle soup).
      const keep = ['position', 'normal', 'uv'];
      const flat = built.map((g) => {
        const src = g.index ? g.toNonIndexed() : g;
        if (src !== g) g.dispose();
        Object.keys(src.attributes).forEach((k) => {
          if (!keep.includes(k)) src.deleteAttribute(k);
        });
        if (!src.attributes.normal) src.computeVertexNormals();
        if (!src.attributes.uv) {
          const count = src.attributes.position.count;
          src.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
        }
        return src;
      });
      const merged = mergeGeometries(flat, false);
      flat.forEach((g) => g.dispose());
      if (!merged) return new THREE.BoxGeometry(1, 1, 1);
      return merged;
    }
  }
}

/** Convenience: the 2D side profile of a rounded rectangle (for extrusions). */
export function roundedRectProfile(x0: number, y0: number, x1: number, y1: number, r: number, cornerSteps = 4): Vec2[] {
  const pts: Vec2[] = [];
  const corners: [number, number, number][] = [
    [x1 - r, y1 - r, 0],
    [x0 + r, y1 - r, Math.PI / 2],
    [x0 + r, y0 + r, Math.PI],
    [x1 - r, y0 + r, (3 * Math.PI) / 2],
  ];
  corners.forEach(([cx, cy, a0]) => {
    for (let i = 0; i <= cornerSteps; i++) {
      const a = a0 + (i / cornerSteps) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  });
  return pts;
}

/** Compute the side-view outline of a set of built meshes (for silhouettes). */
export function projectSilhouette(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4): Vec2[] {
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const pts: Vec2[] = [];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
    pts.push([v.x, v.y]);
  }
  return pts;
}
