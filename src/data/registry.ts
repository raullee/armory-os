import type { FirearmCatalogEntry, FirearmDefinition } from '@/firearm/schema';

export type { FirearmCatalogEntry };

/**
 * Code-split modules, discovered at build time. A firearm listed in the
 * catalogue without a module yet resolves to a clear error instead of breaking
 * the bundle.
 */
const MODULES = import.meta.glob<{ default: FirearmDefinition }>('./firearms/*.ts');

function loadModule(id: string): Promise<FirearmDefinition> {
  const key = `./firearms/${id}.ts`;
  const loader = MODULES[key];
  if (!loader) return Promise.reject(new Error(`No model has been authored for “${id}” yet.`));
  return loader().then((m) => m.default);
}

/**
 * Firearm registry. Each entry is lightweight; the full definition (geometry,
 * animation, audio identity) is code-split and loaded on demand so the initial
 * bundle stays small and a firearm's data is only parsed when it is viewed.
 *
 * Order here is the order shown in the selector.
 */
export const CATALOG: FirearmCatalogEntry[] = [
  { id: 'm4a1', name: 'Colt M4A1 Carbine', shortName: 'M4A1', category: 'assault', categoryLabel: 'Carbine / assault rifle', cartridge: '5.56×45 mm NATO', actionLabel: 'Gas, direct impingement, rotating bolt', overallLength: 838, mass: 2880, origin: 'United States', load: () => loadModule('m4a1') },
  { id: 'ak47', name: 'Kalashnikov AKM', shortName: 'AKM', category: 'assault', categoryLabel: 'Assault rifle', cartridge: '7.62×39 mm', actionLabel: 'Gas, long-stroke piston, rotating bolt', overallLength: 880, mass: 3100, origin: 'Soviet Union', load: () => loadModule('ak47') },
  { id: 'scar17h', name: 'FN SCAR 17S', shortName: 'SCAR 17', category: 'battle', categoryLabel: 'Battle rifle', cartridge: '7.62×51 mm NATO', actionLabel: 'Gas, short-stroke piston, rotating bolt', overallLength: 965, mass: 3630, origin: 'Belgium / United States', load: () => loadModule('scar17h') },
  { id: 'g3', name: 'Heckler & Koch G3A3', shortName: 'G3A3', category: 'battle', categoryLabel: 'Battle rifle', cartridge: '7.62×51 mm NATO', actionLabel: 'Roller-delayed blowback', overallLength: 1025, mass: 4400, origin: 'West Germany', load: () => loadModule('g3') },
  { id: 'asval', name: 'AS Val', shortName: 'AS Val', category: 'assault', categoryLabel: 'Suppressed assault rifle', cartridge: '9×39 mm', actionLabel: 'Gas, long-stroke piston, rotating bolt', overallLength: 875, mass: 2500, origin: 'Soviet Union', load: () => loadModule('asval') },
  { id: 'steyraug', name: 'Steyr AUG A3', shortName: 'AUG A3', category: 'bullpup', categoryLabel: 'Bullpup assault rifle', cartridge: '5.56×45 mm NATO', actionLabel: 'Gas, short-stroke piston, rotating bolt', overallLength: 790, mass: 3600, origin: 'Austria', load: () => loadModule('steyraug') },
  { id: 'sa80', name: 'L85A2', shortName: 'L85A2', category: 'bullpup', categoryLabel: 'Bullpup assault rifle', cartridge: '5.56×45 mm NATO', actionLabel: 'Gas, short-stroke piston, rotating bolt', overallLength: 785, mass: 3820, origin: 'United Kingdom', load: () => loadModule('sa80') },
  { id: 'svd', name: 'SVD Dragunov', shortName: 'SVD', category: 'dmr', categoryLabel: 'Designated marksman rifle', cartridge: '7.62×54 mmR', actionLabel: 'Gas, short-stroke piston, rotating bolt', overallLength: 1225, mass: 4300, origin: 'Soviet Union', load: () => loadModule('svd') },
  { id: 'm14_ebr', name: 'Mk 14 Mod 0 EBR', shortName: 'Mk 14 EBR', category: 'dmr', categoryLabel: 'Enhanced battle rifle', cartridge: '7.62×51 mm NATO', actionLabel: 'Gas, long-stroke piston, rotating bolt', overallLength: 889, mass: 5100, origin: 'United States', load: () => loadModule('m14_ebr') },
  { id: 'aiax338', name: 'Accuracy International AX338', shortName: 'AX338', category: 'sniper', categoryLabel: 'Bolt-action precision rifle', cartridge: '.338 Lapua Magnum', actionLabel: 'Manual turn-bolt, 60° throw', overallLength: 1250, mass: 6800, origin: 'United Kingdom', load: () => loadModule('aiax338') },
  { id: 'cheytac_m200', name: 'CheyTac M200 Intervention', shortName: 'M200', category: 'sniper', categoryLabel: 'Bolt-action long-range rifle', cartridge: '.408 CheyTac', actionLabel: 'Manual turn-bolt', overallLength: 1400, mass: 14000, origin: 'United States', load: () => loadModule('cheytac_m200') },
  { id: 'm82a1', name: 'Barrett M82A1', shortName: 'M82A1', category: 'sniper', categoryLabel: 'Anti-materiel rifle', cartridge: '.50 BMG', actionLabel: 'Short-recoil, rotating bolt', overallLength: 1448, mass: 14000, origin: 'United States', load: () => loadModule('m82a1') },
  { id: 'm249', name: 'FN M249 SAW', shortName: 'M249', category: 'lmg', categoryLabel: 'Light machine gun', cartridge: '5.56×45 mm NATO', actionLabel: 'Gas, long-stroke piston, open bolt', overallLength: 1041, mass: 7500, origin: 'Belgium / United States', load: () => loadModule('m249') },
  { id: 'pkp', name: 'PKP Pecheneg', shortName: 'PKP', category: 'lmg', categoryLabel: 'General-purpose machine gun', cartridge: '7.62×54 mmR', actionLabel: 'Gas, long-stroke piston, open bolt', overallLength: 1200, mass: 8200, origin: 'Russia', load: () => loadModule('pkp') },
  { id: 'hkmp5', name: 'Heckler & Koch MP5A3', shortName: 'MP5A3', category: 'smg', categoryLabel: 'Submachine gun', cartridge: '9×19 mm', actionLabel: 'Roller-delayed blowback', overallLength: 700, mass: 3080, origin: 'West Germany', load: () => loadModule('hkmp5') },
  { id: 'kriss_vector', name: 'KRISS Vector Gen II', shortName: 'Vector', category: 'smg', categoryLabel: 'Submachine gun', cartridge: '.45 ACP', actionLabel: 'Delayed blowback, Super V slider', overallLength: 617, mass: 2700, origin: 'United States', load: () => loadModule('kriss_vector') },
  { id: 'p90', name: 'FN P90', shortName: 'P90', category: 'pdw', categoryLabel: 'Personal defence weapon', cartridge: '5.7×28 mm', actionLabel: 'Straight blowback, closed bolt', overallLength: 500, mass: 2600, origin: 'Belgium', load: () => loadModule('p90') },
  { id: 'mp7', name: 'Heckler & Koch MP7A1', shortName: 'MP7A1', category: 'pdw', categoryLabel: 'Personal defence weapon', cartridge: '4.6×30 mm', actionLabel: 'Gas, short-stroke piston, rotating bolt', overallLength: 638, mass: 1900, origin: 'Germany', load: () => loadModule('mp7') },
  { id: 'benellim4', name: 'Benelli M4', shortName: 'M4 (Benelli)', category: 'shotgun', categoryLabel: 'Semi-automatic shotgun', cartridge: '12 gauge', actionLabel: 'Gas, auto-regulating (ARGO), rotating bolt', overallLength: 1010, mass: 3820, origin: 'Italy', load: () => loadModule('benellim4') },
  { id: 'remington870', name: 'Remington 870', shortName: '870', category: 'shotgun', categoryLabel: 'Pump-action shotgun', cartridge: '12 gauge', actionLabel: 'Manual pump, dual action bars', overallLength: 980, mass: 3400, origin: 'United States', load: () => loadModule('remington870') },
  { id: 'glock19', name: 'Glock 19 Gen5', shortName: 'G19', category: 'handgun', categoryLabel: 'Semi-automatic pistol', cartridge: '9×19 mm', actionLabel: 'Short recoil, tilting barrel, striker', overallLength: 187, mass: 670, origin: 'Austria', load: () => loadModule('glock19') },
  { id: 'm1911', name: 'Colt M1911A1', shortName: 'M1911A1', category: 'handgun', categoryLabel: 'Semi-automatic pistol', cartridge: '.45 ACP', actionLabel: 'Short recoil, tilting barrel, hammer', overallLength: 219, mass: 1105, origin: 'United States', load: () => loadModule('m1911') },
  { id: 'desert_eagle', name: 'Desert Eagle Mark XIX', shortName: 'Desert Eagle', category: 'handgun', categoryLabel: 'Gas-operated pistol', cartridge: '.50 Action Express', actionLabel: 'Gas, rotating bolt', overallLength: 273, mass: 2000, origin: 'United States / Israel', load: () => loadModule('desert_eagle') },
  { id: 'colt_python', name: 'Colt Python', shortName: 'Python', category: 'revolver', categoryLabel: 'Double-action revolver', cartridge: '.357 Magnum', actionLabel: 'Double-action / single-action', overallLength: 292, mass: 1200, origin: 'United States', load: () => loadModule('colt_python') },
];

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  handgun: 'Pistols',
  revolver: 'Revolvers',
  smg: 'Submachine guns',
  pdw: 'PDWs',
  assault: 'Assault rifles',
  bullpup: 'Bullpups',
  battle: 'Battle rifles',
  dmr: 'Marksman rifles',
  sniper: 'Precision / anti-materiel',
  shotgun: 'Shotguns',
  lmg: 'Machine guns',
};

const cache = new Map<string, Promise<FirearmDefinition>>();

export function getEntry(id: string): FirearmCatalogEntry | undefined {
  return CATALOG.find((e) => e.id === id);
}

export function loadFirearm(id: string): Promise<FirearmDefinition> {
  const entry = getEntry(id);
  if (!entry) return Promise.reject(new Error(`Unknown firearm: ${id}`));
  let p = cache.get(id);
  if (!p) {
    p = entry.load().catch((err) => {
      cache.delete(id);
      throw err;
    });
    cache.set(id, p);
  }
  return p;
}
