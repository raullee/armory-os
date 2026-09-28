import * as THREE from 'three';
import type { MaterialProfileId } from '@/firearm/schema';
import { brushedNormal, grainNormal, phosphateNormal, roughnessVariation, stippleNormal, woodGrain } from './textures';

/**
 * MaterialProfile library.
 *
 * Each profile is a physically based description of a real firearm finish.
 * Materials are shared between meshes (one instance per profile per render
 * mode) to keep draw-call state changes low. Hover/selection tinting is done
 * through a per-mesh emissive override, so shared materials are cloned lazily
 * only for the hovered mesh.
 */

export interface MaterialProfile {
  id: MaterialProfileId;
  label: string;
  create: () => THREE.MeshPhysicalMaterial;
  /** 0..1, how much edge/contact wear the shader applies. */
  wear: number;
  /** Colour used when the material is shown in wireframe/x-ray diagnostics. */
  diagnosticColor: number;
}

function physical(params: THREE.MeshPhysicalMaterialParameters & { wear?: number }): THREE.MeshPhysicalMaterial {
  const wear = params.wear ?? 0.25;
  delete (params as { wear?: number }).wear;
  const m = new THREE.MeshPhysicalMaterial(params);
  m.userData.wear = wear;
  installWearShader(m);
  return m;
}

/**
 * Injects a small edge-wear + micro-variation shader chunk into the standard
 * physical material. The edge term uses the screen-space derivative of the
 * normal, which fires on hard geometric edges, and is modulated by a
 * world-space hash so wear appears in patches rather than uniformly. The
 * result: slightly brighter, more metallic, lower-roughness edges and contact
 * points, the way hard-anodised and parkerised parts actually wear.
 */
function installWearShader(m: THREE.MeshPhysicalMaterial): void {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWear = { value: m.userData.wear ?? 0.25 };
    shader.uniforms.uWearColor = { value: new THREE.Color(0.72, 0.72, 0.74) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPosWear;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldPosWear = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uWear;
uniform vec3 uWearColor;
varying vec3 vWorldPosWear;
float wearHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float wearNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(wearHash(i + vec3(0,0,0)), wearHash(i + vec3(1,0,0)), f.x), mix(wearHash(i + vec3(0,1,0)), wearHash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(wearHash(i + vec3(0,0,1)), wearHash(i + vec3(1,0,1)), f.x), mix(wearHash(i + vec3(0,1,1)), wearHash(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
{
  // Edge wear: hard geometric edges (large normal derivative) in patches, plus body micro-variation.
  // Curvature per metre: normal change per unit of view-space distance. Hard edges are effectively infinite,
  // a 10 mm barrel is ~100/m, so the threshold keeps smooth cylinders unworn at any viewing distance.
  float curvature = length(fwidth(nonPerturbedNormal)) / max(length(fwidth(vViewPosition)), 1e-5);
  float edgeTerm = smoothstep(450.0, 1800.0, curvature);
  float wp1 = wearNoise(vWorldPosWear * 55.0);
  float wp2 = wearNoise(vWorldPosWear * 9.0);
  float wearMask = uWear * edgeTerm * smoothstep(0.35, 0.75, wp1 * 0.6 + wp2 * 0.4);
  roughnessFactor = clamp(mix(roughnessFactor, 0.28, wearMask) + (wearNoise(vWorldPosWear * 120.0) - 0.5) * 0.06, 0.02, 1.0);
  metalnessFactor = mix(metalnessFactor, 1.0, wearMask * 0.9);
  diffuseColor.rgb = mix(diffuseColor.rgb, uWearColor, wearMask * 0.85);
}`,
      );
  };
  // Ensure separate program per material so uniforms don't collide.
  m.customProgramCacheKey = () => `wear-${m.uuid}`;
}

const PROFILES: Record<MaterialProfileId, MaterialProfile> = {
  'anodised-aluminium-black': {
    id: 'anodised-aluminium-black',
    label: 'Aluminium, Type III hardcoat anodised',
    wear: 0.55,
    diagnosticColor: 0x8fb8d8,
    create: () =>
      physical({
        color: 0x17191c,
        metalness: 0.92,
        roughness: 0.58,
        normalMap: grainNormal(256, 0.8, 11),
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughnessMap: roughnessVariation(256, 5, 0.3),
        envMapIntensity: 1.0,
        wear: 0.55,
      }),
  },
  'anodised-aluminium-fde': {
    id: 'anodised-aluminium-fde',
    label: 'Aluminium, hardcoat anodised, flat dark earth',
    wear: 0.45,
    diagnosticColor: 0xd8b98f,
    create: () =>
      physical({
        color: 0x6e5f47,
        metalness: 0.85,
        roughness: 0.62,
        normalMap: grainNormal(256, 0.8, 13),
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughnessMap: roughnessVariation(256, 6, 0.3),
        wear: 0.45,
      }),
  },
  'anodised-aluminium-grey': {
    id: 'anodised-aluminium-grey',
    label: 'Aluminium, clear/grey anodised',
    wear: 0.4,
    diagnosticColor: 0xb0bcc8,
    create: () =>
      physical({
        color: 0x5f6469,
        metalness: 0.9,
        roughness: 0.5,
        normalMap: grainNormal(256, 0.7, 14),
        normalScale: new THREE.Vector2(0.3, 0.3),
        roughnessMap: roughnessVariation(256, 8, 0.25),
        wear: 0.4,
      }),
  },
  'parkerised-steel': {
    id: 'parkerised-steel',
    label: 'Steel, manganese phosphate (parkerised)',
    wear: 0.5,
    diagnosticColor: 0x9aa4ad,
    create: () =>
      physical({
        color: 0x2a2c2d,
        metalness: 0.7,
        roughness: 0.82,
        normalMap: phosphateNormal(256, 99),
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughnessMap: roughnessVariation(256, 9, 0.2),
        wear: 0.5,
      }),
  },
  'blued-steel': {
    id: 'blued-steel',
    label: 'Carbon steel, hot-salt blued',
    wear: 0.35,
    diagnosticColor: 0x7fa6d6,
    create: () =>
      physical({
        color: 0x0f1216,
        metalness: 1.0,
        roughness: 0.28,
        clearcoat: 0.25,
        clearcoatRoughness: 0.35,
        normalMap: brushedNormal(256, 41, 0.5),
        normalScale: new THREE.Vector2(0.18, 0.18),
        roughnessMap: roughnessVariation(256, 12, 0.35),
        sheen: 0.15,
        sheenColor: new THREE.Color(0x1d3a5a),
        wear: 0.35,
      }),
  },
  'stainless-steel': {
    id: 'stainless-steel',
    label: 'Stainless steel, bead blasted',
    wear: 0.3,
    diagnosticColor: 0xdfe6ec,
    create: () =>
      physical({
        color: 0xa9adb1,
        metalness: 1.0,
        roughness: 0.42,
        normalMap: grainNormal(256, 0.9, 21),
        normalScale: new THREE.Vector2(0.4, 0.4),
        roughnessMap: roughnessVariation(256, 14, 0.3),
        wear: 0.3,
      }),
  },
  'stainless-brushed': {
    id: 'stainless-brushed',
    label: 'Stainless steel, brushed',
    wear: 0.3,
    diagnosticColor: 0xeef2f5,
    create: () =>
      physical({
        color: 0xb4b8bc,
        metalness: 1.0,
        roughness: 0.3,
        anisotropy: 0.6,
        normalMap: brushedNormal(256, 43, 1.4),
        normalScale: new THREE.Vector2(0.3, 0.3),
        wear: 0.3,
      }),
  },
  'nitride-steel': {
    id: 'nitride-steel',
    label: 'Steel, salt-bath nitride (black)',
    wear: 0.3,
    diagnosticColor: 0x8c99a6,
    create: () =>
      physical({
        color: 0x131517,
        metalness: 1.0,
        roughness: 0.36,
        normalMap: brushedNormal(256, 45, 0.6),
        normalScale: new THREE.Vector2(0.2, 0.2),
        roughnessMap: roughnessVariation(256, 16, 0.3),
        wear: 0.3,
      }),
  },
  chrome: {
    id: 'chrome',
    label: 'Hard chrome plated steel',
    wear: 0.1,
    diagnosticColor: 0xffffff,
    create: () =>
      physical({
        color: 0xd8dadc,
        metalness: 1.0,
        roughness: 0.14,
        roughnessMap: roughnessVariation(256, 18, 0.2),
        wear: 0.1,
      }),
  },
  'polymer-black': {
    id: 'polymer-black',
    label: 'Glass-filled polymer, textured',
    wear: 0.18,
    diagnosticColor: 0x7c8794,
    create: () =>
      physical({
        color: 0x141517,
        metalness: 0.0,
        roughness: 0.78,
        normalMap: stippleNormal(256, 23),
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: roughnessVariation(256, 20, 0.25),
        sheen: 0.2,
        sheenRoughness: 0.9,
        sheenColor: new THREE.Color(0x222222),
        wear: 0.18,
      }),
  },
  'polymer-fde': {
    id: 'polymer-fde',
    label: 'Polymer, flat dark earth',
    wear: 0.18,
    diagnosticColor: 0xcdb08a,
    create: () =>
      physical({
        color: 0x7b6a4e,
        metalness: 0.0,
        roughness: 0.8,
        normalMap: stippleNormal(256, 25),
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughnessMap: roughnessVariation(256, 22, 0.25),
        wear: 0.18,
      }),
  },
  'polymer-od': {
    id: 'polymer-od',
    label: 'Polymer, olive drab',
    wear: 0.18,
    diagnosticColor: 0x9db48a,
    create: () =>
      physical({
        color: 0x3a4431,
        metalness: 0.0,
        roughness: 0.8,
        normalMap: stippleNormal(256, 27),
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughnessMap: roughnessVariation(256, 24, 0.25),
        wear: 0.18,
      }),
  },
  'polymer-translucent': {
    id: 'polymer-translucent',
    label: 'Translucent polycarbonate',
    wear: 0.05,
    diagnosticColor: 0xd9c98a,
    create: () =>
      physical({
        color: 0x9c8b5c,
        metalness: 0.0,
        roughness: 0.35,
        transmission: 0.55,
        thickness: 4,
        ior: 1.58,
        transparent: true,
        opacity: 0.92,
        wear: 0.05,
      }),
  },
  'rubber-black': {
    id: 'rubber-black',
    label: 'Rubber',
    wear: 0.05,
    diagnosticColor: 0x6d6f73,
    create: () =>
      physical({
        color: 0x0e0f10,
        metalness: 0.0,
        roughness: 0.95,
        normalMap: stippleNormal(256, 29),
        normalScale: new THREE.Vector2(0.3, 0.3),
        wear: 0.05,
      }),
  },
  brass: {
    id: 'brass',
    label: 'Cartridge brass (70/30)',
    wear: 0.1,
    diagnosticColor: 0xe6c458,
    create: () =>
      physical({
        color: 0xc9a54b,
        metalness: 1.0,
        roughness: 0.22,
        roughnessMap: roughnessVariation(256, 30, 0.3),
        wear: 0.1,
      }),
  },
  copper: {
    id: 'copper',
    label: 'Gilding metal jacket',
    wear: 0.1,
    diagnosticColor: 0xd48b5a,
    create: () =>
      physical({
        color: 0xb0703f,
        metalness: 1.0,
        roughness: 0.28,
        wear: 0.1,
      }),
  },
  'wood-laminate': {
    id: 'wood-laminate',
    label: 'Birch laminate, varnished',
    wear: 0.12,
    diagnosticColor: 0xd6a06a,
    create: () => {
      const { map, normalMap } = woodGrain(512, 77, [122, 84, 48], [66, 40, 20], true);
      return physical({
        color: 0xffffff,
        map,
        normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
        metalness: 0.0,
        roughness: 0.42,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
        wear: 0.12,
      });
    },
  },
  'wood-walnut': {
    id: 'wood-walnut',
    label: 'American walnut, oil finish',
    wear: 0.12,
    diagnosticColor: 0xc08a5c,
    create: () => {
      const { map, normalMap } = woodGrain(512, 91, [84, 52, 30], [40, 24, 12], false);
      return physical({
        color: 0xffffff,
        map,
        normalMap,
        normalScale: new THREE.Vector2(0.4, 0.4),
        metalness: 0.0,
        roughness: 0.5,
        clearcoat: 0.35,
        clearcoatRoughness: 0.45,
        wear: 0.12,
      });
    },
  },
  bakelite: {
    id: 'bakelite',
    label: 'Phenolic resin (bakelite)',
    wear: 0.1,
    diagnosticColor: 0xc98f5a,
    create: () =>
      physical({
        color: 0x5e3419,
        metalness: 0.0,
        roughness: 0.32,
        clearcoat: 0.5,
        clearcoatRoughness: 0.25,
        roughnessMap: roughnessVariation(256, 33, 0.3),
        wear: 0.1,
      }),
  },
  'steel-worn': {
    id: 'steel-worn',
    label: 'Steel, bare contact surface',
    wear: 0.7,
    diagnosticColor: 0xe8ecef,
    create: () =>
      physical({
        color: 0x8c9094,
        metalness: 1.0,
        roughness: 0.3,
        normalMap: brushedNormal(256, 47, 1.0),
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughnessMap: roughnessVariation(256, 34, 0.4),
        wear: 0.7,
      }),
  },
  'glass-optic': {
    id: 'glass-optic',
    label: 'Multi-coated optical glass',
    wear: 0.0,
    diagnosticColor: 0x8fd3f4,
    create: () =>
      physical({
        color: 0x244a6a,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.35,
        ior: 1.5,
        transparent: true,
        opacity: 0.9,
        clearcoat: 1.0,
        wear: 0.0,
      }),
  },
  'paint-od': {
    id: 'paint-od',
    label: 'Steel, olive drab enamel',
    wear: 0.45,
    diagnosticColor: 0xa4b58e,
    create: () =>
      physical({
        color: 0x3f4a35,
        metalness: 0.2,
        roughness: 0.7,
        normalMap: grainNormal(256, 0.6, 51),
        normalScale: new THREE.Vector2(0.3, 0.3),
        roughnessMap: roughnessVariation(256, 36, 0.3),
        wear: 0.45,
      }),
  },
};

const instances = new Map<MaterialProfileId, THREE.MeshPhysicalMaterial>();

export function getMaterialProfile(id: MaterialProfileId): MaterialProfile {
  return PROFILES[id] ?? PROFILES['parkerised-steel'];
}

/** Shared PBR material instance for a profile. */
export function getMaterial(id: MaterialProfileId): THREE.MeshPhysicalMaterial {
  let m = instances.get(id);
  if (!m) {
    m = getMaterialProfile(id).create();
    m.name = id;
    instances.set(id, m);
  }
  return m;
}

export function diagnosticColor(id: MaterialProfileId): number {
  return getMaterialProfile(id).diagnosticColor;
}

export function materialLabel(id: MaterialProfileId): string {
  return getMaterialProfile(id).label;
}

export function disposeMaterials(): void {
  instances.forEach((m) => m.dispose());
  instances.clear();
}
