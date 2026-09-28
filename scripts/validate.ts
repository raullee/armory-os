/**
 * Firearm definition validator (runs in Node, no DOM, no materials).
 *
 *   node --experimental-strip-types scripts/validate.ts <id> [<id> ...]
 *   node --experimental-strip-types scripts/validate.ts --all
 *
 * Checks referential integrity, builds every component's geometry, computes the
 * assembled bounding box and compares it with the published dimensions.
 */
import * as THREE from 'three';
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { buildGeometry } from '../src/geometry/builders.ts';
import type { ComponentDef, FirearmDefinition } from '../src/firearm/schema.ts';

const here = path.dirname(new URL(import.meta.url).pathname);
const dir = path.resolve(here, '../src/data/firearms');

async function load(id: string): Promise<FirearmDefinition> {
  const mod = await import(pathToFileURL(path.join(dir, `${id}.ts`)).href);
  return (mod.default ?? Object.values(mod)[0]) as FirearmDefinition;
}

interface Report {
  id: string;
  errors: string[];
  warnings: string[];
  components: number;
  size: [number, number, number];
}

function validate(def: FirearmDefinition): Report {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  const byId = new Map<string, ComponentDef>();
  for (const c of def.components) {
    if (ids.has(c.id)) errors.push(`duplicate component id ${c.id}`);
    ids.add(c.id);
    byId.set(c.id, c);
  }
  for (const c of def.components) {
    if (c.parent && !byId.has(c.parent)) errors.push(`${c.id}: parent ${c.parent} does not exist`);
    (c.adjacent ?? []).forEach((a) => !byId.has(a) && warnings.push(`${c.id}: adjacent ${a} does not exist`));
    if (c.strip && (c.strip.stage < 1 || c.strip.stage > 5)) errors.push(`${c.id}: strip stage out of range`);
    if (!c.function || c.function.length < 12) warnings.push(`${c.id}: function text too short`);
    // parent chain cycle check
    let p = c.parent;
    let guard = 0;
    while (p && guard++ < 50) p = byId.get(p)?.parent;
    if (guard >= 50) errors.push(`${c.id}: parent cycle`);
  }
  // actions
  const seqs = [def.actions.cycle, def.actions.dryFire, def.actions.reload, def.actions.safety, ...(def.actions.extra ?? [])].filter(Boolean);
  for (const s of seqs) {
    if (!s) continue;
    s.steps.forEach((st) => {
      if (!byId.has(st.component)) errors.push(`action ${s.id}: component ${st.component} does not exist`);
      if (st.t[1] > s.duration + 1e-6) warnings.push(`action ${s.id}: step on ${st.component} ends after duration`);
      if (st.t[0] > st.t[1]) errors.push(`action ${s.id}: step on ${st.component} has t0 > t1`);
    });
    s.audio.forEach((a) => a.component && !byId.has(a.component) && warnings.push(`action ${s.id}: audio component ${a.component} missing`));
  }
  if (!def.actions.cycle) warnings.push('no cycle action');
  if (!def.actions.dryFire) warnings.push('no dryFire action');
  if (!def.actions.reload) warnings.push('no reload action');
  // field strip
  if (def.fieldStrip.length !== 6) errors.push(`fieldStrip must have 6 stages, has ${def.fieldStrip.length}`);
  def.fieldStrip.forEach((st, i) => {
    if (st.stage !== i) errors.push(`fieldStrip[${i}] has stage ${st.stage}`);
    st.focus.forEach((f) => !byId.has(f) && warnings.push(`fieldStrip ${i}: focus ${f} missing`));
    if (/\b(press|pull|push|rotate|remove|insert|depress)\b/i.test(st.description) && /^(press|pull|push|rotate|remove|insert|depress)/i.test(st.description.trim())) warnings.push(`fieldStrip ${i}: description reads like an instruction`);
  });
  const stripped = def.components.filter((c) => c.strip).length;
  if (stripped < 8) warnings.push(`only ${stripped} components have strip behaviour`);
  const stagesUsed = new Set(def.components.map((c) => c.strip?.stage).filter(Boolean));
  [1, 2, 3, 4, 5].forEach((s) => !stagesUsed.has(s as 1) && warnings.push(`no component leaves at stage ${s}`));

  // geometry + bounds
  const box = new THREE.Box3();
  const nodes = new Map<string, THREE.Object3D>();
  const root = new THREE.Group();
  const ordered: ComponentDef[] = [];
  const visited = new Set<string>();
  const visit = (c: ComponentDef) => {
    if (visited.has(c.id)) return;
    if (c.parent && byId.has(c.parent)) visit(byId.get(c.parent)!);
    visited.add(c.id);
    ordered.push(c);
  };
  def.components.forEach(visit);
  for (const c of ordered) {
    let geo: THREE.BufferGeometry;
    try {
      geo = buildGeometry(c.geometry);
    } catch (e) {
      errors.push(`${c.id}: geometry failed: ${(e as Error).message}`);
      continue;
    }
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const sz = new THREE.Vector3();
    bb.getSize(sz);
    if (!Number.isFinite(sz.x) || sz.x === 0 && sz.y === 0) errors.push(`${c.id}: degenerate geometry`);
    if (Math.max(sz.x, sz.y, sz.z) > 2000) warnings.push(`${c.id}: geometry larger than 2 m (${sz.x.toFixed(0)} x ${sz.y.toFixed(0)} x ${sz.z.toFixed(0)})`);
    const mesh = new THREE.Mesh(geo);
    const pivot = c.pivot ?? [0, 0, 0];
    mesh.position.set(-pivot[0], -pivot[1], -pivot[2]);
    const node = new THREE.Group();
    node.position.set(c.position[0] + pivot[0], c.position[1] + pivot[1], c.position[2] + pivot[2]);
    if (c.rotation) node.rotation.set(c.rotation[0], c.rotation[1], c.rotation[2]);
    node.add(mesh);
    nodes.set(c.id, node);
    (c.parent && nodes.get(c.parent) ? nodes.get(c.parent)! : root).add(node);
    mesh.userData.group = c.group;
  }
  root.updateMatrixWorld(true);
  const tmp = new THREE.Box3();
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.userData.group !== 'ammunition') {
      tmp.setFromObject(o, true);
      box.union(tmp);
    }
  });
  const size = new THREE.Vector3();
  box.getSize(size);
  const oal = def.spec.overallLength.value;
  if (oal) {
    const dev = Math.abs(size.x - oal) / oal;
    if (dev > 0.05) errors.push(`modelled length ${size.x.toFixed(0)} mm vs published ${oal} mm (${(dev * 100).toFixed(1)}% off)`);
    else if (dev > 0.025) warnings.push(`modelled length ${size.x.toFixed(0)} mm vs published ${oal} mm (${(dev * 100).toFixed(1)}% off)`);
  }
  const bl = def.spec.barrelLength.value;
  if (bl && Math.abs(def.bore.muzzle[0] - bl) > bl * 0.04) warnings.push(`bore.muzzle.x ${def.bore.muzzle[0]} vs barrel length ${bl}`);
  if (size.y > 450) warnings.push(`modelled height ${size.y.toFixed(0)} mm looks too tall`);
  if (size.z > 200) warnings.push(`modelled width ${size.z.toFixed(0)} mm looks too wide`);
  if (def.components.length < 20) warnings.push(`only ${def.components.length} components`);
  if (!def.provenance?.sources?.length) errors.push('no provenance sources');
  if (!def.cartridge?.caseLength) errors.push('cartridge dimensions missing');
  return { id: def.id, errors, warnings, components: def.components.length, size: [Math.round(size.x), Math.round(size.y), Math.round(size.z)] };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const ids = args.includes('--all') ? readdirSync(dir).filter((f) => f.endsWith('.ts')).map((f) => f.replace(/\.ts$/, '')) : args;
  if (!ids.length) {
    console.error('usage: validate.ts <id> ... | --all');
    process.exit(2);
  }
  let failed = 0;
  for (const id of ids) {
    try {
      const def = await load(id);
      const r = validate(def);
      const status = r.errors.length ? 'FAIL' : 'ok';
      console.log(`\n[${status}] ${r.id}  components=${r.components}  size=${r.size.join('x')} mm`);
      r.errors.forEach((e) => console.log(`  ERROR   ${e}`));
      r.warnings.forEach((w) => console.log(`  warn    ${w}`));
      if (r.errors.length) failed++;
    } catch (e) {
      failed++;
      console.log(`\n[FAIL] ${id}  could not load: ${(e as Error).message}`);
    }
  }
  process.exit(failed ? 1 : 0);
}

void main();
