import * as THREE from 'three';

/**
 * Procedural texture generation. All textures are generated once on the CPU
 * at modest resolution and cached, so there are no external asset requests
 * and no decode cost on load.
 */

const cache = new Map<string, THREE.Texture>();

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  return [c, ctx];
}

/** Deterministic pseudo-random so textures are stable across reloads (visual regression). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value noise with a few octaves; returns 0..1 array of size*size. */
function valueNoise(size: number, seed: number, octaves = 4, baseScale = 8): Float32Array {
  const rnd = mulberry32(seed);
  const out = new Float32Array(size * size);
  let amp = 1;
  let scale = baseScale;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const g = scale + 1;
    const grid = new Float32Array(g * g);
    for (let i = 0; i < grid.length; i++) grid[i] = rnd();
    for (let y = 0; y < size; y++) {
      const fy = (y / size) * scale;
      const y0 = Math.floor(fy);
      const ty = fy - y0;
      const sy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * scale;
        const x0 = Math.floor(fx);
        const tx = fx - x0;
        const sx = tx * tx * (3 - 2 * tx);
        const a = grid[(y0 % scale) * g + (x0 % scale)];
        const b = grid[(y0 % scale) * g + ((x0 + 1) % scale)];
        const c = grid[((y0 + 1) % scale) * g + (x0 % scale)];
        const d = grid[((y0 + 1) % scale) * g + ((x0 + 1) % scale)];
        const v = (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
        out[y * size + x] += v * amp;
      }
    }
    total += amp;
    amp *= 0.5;
    scale *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

function heightToNormal(height: Float32Array, size: number, strength: number): ImageData {
  const img = new ImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = height[y * size + ((x - 1 + size) % size)];
      const r = height[y * size + ((x + 1) % size)];
      const u = height[((y - 1 + size) % size) * size + x];
      const d = height[((y + 1) % size) * size + x];
      const nx = (l - r) * strength;
      const ny = (u - d) * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  return img;
}

function finish(tex: THREE.Texture, repeat: number, srgb = false): THREE.Texture {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Fine grain normal map: anodised / bead-blasted aluminium. */
export function grainNormal(size = 256, strength = 0.9, seed = 11): THREE.Texture {
  const key = `grain-${size}-${strength}-${seed}`;
  if (cache.has(key)) return cache.get(key)!;
  const h = valueNoise(size, seed, 5, 16);
  const rnd = mulberry32(seed + 1);
  for (let i = 0; i < h.length; i++) h[i] = h[i] * 0.6 + rnd() * 0.4;
  const [c, ctx] = makeCanvas(size);
  ctx.putImageData(heightToNormal(h, size, strength), 0, 0);
  const tex = finish(new THREE.CanvasTexture(c), 6);
  cache.set(key, tex);
  return tex;
}

/** Stipple / textured polymer normal map. */
export function stippleNormal(size = 256, seed = 23): THREE.Texture {
  const key = `stipple-${size}-${seed}`;
  if (cache.has(key)) return cache.get(key)!;
  const rnd = mulberry32(seed);
  const h = new Float32Array(size * size);
  // Distribute soft bumps
  const bumps = Math.floor(size * size * 0.02);
  for (let b = 0; b < bumps; b++) {
    const cx = rnd() * size;
    const cy = rnd() * size;
    const r = 1.5 + rnd() * 2.5;
    const amp = 0.5 + rnd() * 0.5;
    const x0 = Math.floor(cx - r - 1), x1 = Math.ceil(cx + r + 1);
    const y0 = Math.floor(cy - r - 1), y1 = Math.ceil(cy + r + 1);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy;
        const d = Math.hypot(dx, dy) / r;
        if (d < 1) {
          const idx = ((y + size) % size) * size + ((x + size) % size);
          h[idx] = Math.max(h[idx], amp * (1 - d * d));
        }
      }
    }
  }
  const n = valueNoise(size, seed + 7, 3, 12);
  for (let i = 0; i < h.length; i++) h[i] = h[i] * 0.8 + n[i] * 0.2;
  const [c, ctx] = makeCanvas(size);
  ctx.putImageData(heightToNormal(h, size, 2.2), 0, 0);
  const tex = finish(new THREE.CanvasTexture(c), 5);
  cache.set(key, tex);
  return tex;
}

/** Brushed / machined normal map: directional micro-scratches. */
export function brushedNormal(size = 256, seed = 41, strength = 1.4): THREE.Texture {
  const key = `brushed-${size}-${seed}-${strength}`;
  if (cache.has(key)) return cache.get(key)!;
  const rnd = mulberry32(seed);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    let v = rnd();
    for (let x = 0; x < size; x++) {
      v = v * 0.92 + rnd() * 0.08;
      h[y * size + x] = v;
    }
  }
  // occasional deeper scratches
  for (let s = 0; s < size / 4; s++) {
    const y = Math.floor(rnd() * size);
    const len = Math.floor(size * (0.2 + rnd() * 0.8));
    const x0 = Math.floor(rnd() * size);
    const depth = 0.3 + rnd() * 0.7;
    for (let x = 0; x < len; x++) h[y * size + ((x0 + x) % size)] -= depth * 0.5;
  }
  const [c, ctx] = makeCanvas(size);
  ctx.putImageData(heightToNormal(h, size, strength), 0, 0);
  const tex = finish(new THREE.CanvasTexture(c), 4);
  cache.set(key, tex);
  return tex;
}

/** Roughness variation map (grey), used to break up perfectly uniform reflections. */
export function roughnessVariation(size = 256, seed = 5, contrast = 0.35): THREE.Texture {
  const key = `rough-${size}-${seed}-${contrast}`;
  if (cache.has(key)) return cache.get(key)!;
  const n = valueNoise(size, seed, 5, 6);
  const fine = valueNoise(size, seed + 3, 2, 48);
  const [c, ctx] = makeCanvas(size);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < n.length; i++) {
    // fingerprints / smudge patches: sparse blobs of lower roughness contrast
    const v = 0.5 + (n[i] - 0.5) * contrast + (fine[i] - 0.5) * contrast * 0.5;
    const g = Math.max(0, Math.min(255, v * 255));
    img.data[i * 4] = g;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = g;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = finish(new THREE.CanvasTexture(c), 3);
  cache.set(key, tex);
  return tex;
}

/** Wood grain albedo + normal. */
export function woodGrain(size = 512, seed = 77, base: [number, number, number] = [110, 68, 34], dark: [number, number, number] = [62, 36, 16], laminate = false): { map: THREE.Texture; normalMap: THREE.Texture } {
  const key = `wood-${size}-${seed}-${base.join()}-${laminate}`;
  if (cache.has(key + '-map')) return { map: cache.get(key + '-map')!, normalMap: cache.get(key + '-nrm')! };
  const n = valueNoise(size, seed, 4, 4);
  const [c, ctx] = makeCanvas(size);
  const img = ctx.createImageData(size, size);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      // Grain lines run along x, warped by low-frequency noise.
      const warp = n[i] * 14;
      const g = Math.sin((y + warp) * 0.35 + Math.sin(x * 0.01) * 3);
      let t = 0.5 + 0.5 * g;
      t = Math.pow(t, 1.6);
      if (laminate) {
        // Birch laminate: stacked layers with alternating tone
        const layer = Math.floor((y + warp * 0.5) / 22) % 2;
        t = t * 0.6 + layer * 0.35;
      }
      const r = dark[0] + (base[0] - dark[0]) * t;
      const gg = dark[1] + (base[1] - dark[1]) * t;
      const b = dark[2] + (base[2] - dark[2]) * t;
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = gg;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
      h[i] = t;
    }
  }
  ctx.putImageData(img, 0, 0);
  const map = finish(new THREE.CanvasTexture(c), 1, true);
  const [c2, ctx2] = makeCanvas(size);
  ctx2.putImageData(heightToNormal(h, size, 0.8), 0, 0);
  const normalMap = finish(new THREE.CanvasTexture(c2), 1);
  cache.set(key + '-map', map);
  cache.set(key + '-nrm', normalMap);
  return { map, normalMap };
}

/** Parkerised (manganese phosphate) crystalline grain. */
export function phosphateNormal(size = 256, seed = 99): THREE.Texture {
  const key = `phos-${size}-${seed}`;
  if (cache.has(key)) return cache.get(key)!;
  const rnd = mulberry32(seed);
  const h = new Float32Array(size * size);
  for (let i = 0; i < h.length; i++) h[i] = rnd();
  // Blur once to make crystals
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += h[((y + dy + size) % size) * size + ((x + dx + size) % size)];
      out[y * size + x] = s / 9;
    }
  }
  const [c, ctx] = makeCanvas(size);
  ctx.putImageData(heightToNormal(out, size, 3.0), 0, 0);
  const tex = finish(new THREE.CanvasTexture(c), 8);
  cache.set(key, tex);
  return tex;
}

/** Soft radial gradient used for the contact shadow disc. */
export function radialShadow(size = 256): THREE.Texture {
  const key = `radial-${size}`;
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = makeCanvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.9)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.5)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

export function disposeTextureCache(): void {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
