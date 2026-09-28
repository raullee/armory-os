# ARMORY OS 3

Interactive digital firearms exhibition. Component-level parametric 3D models, mechanically coherent motion, layered synthesised audio, and audited technical data.

Production: https://armory.raul.my  
Mirror: https://armory-os.vercel.app

## What it is

Twenty-four firearms, each defined as **data + assets** against one schema. The application is a single reusable exhibition engine; a firearm contributes a definition file and nothing else.

- **Exhibition.** One object edge to edge. Orbit, pan, zoom with inertia, snap-to-view presets, true 1:1 mode, dimension overlays, bore line, component isolation and highlighting, five render modes (material, x-ray, wireframe, thermal, subsystems).
- **Action lab.** Charge, dry fire, magazine change, selector and case ejection, driven by data-defined sequences with mechanical easings and audio cues that fire on the animation clock.
- **Field strip.** Six staged views from in battery to the full exploded matrix, with camera choreography, ghosting, callouts and stage audio. Educational visualisation, not a maintenance procedure.
- **Data drawer.** Every specification value carries a confidence grade (published, measured, estimated, unverified) and its source. Visualisation, specification and procedural effect are separated explicitly.
- **Compare.** Two synchronised viewports, true scale, dimension overlays, rendered side silhouettes aligned on the breech face, and published-value comparison. Nothing without a source renders as a number.
- **Audio.** Web Audio synthesis parameterised per firearm by mass, receiver material, action type, reciprocating mass and spring character; five synthesised acoustic environments by convolution; captions for every event. Firing is not simulated.

## Architecture

```
src/
  firearm/schema.ts        unified schema: FirearmDefinition, ComponentDef, AnimationSequence,
                           AudioCue, AcousticIdentity, CameraPreset, FieldStripStage, Provenance
  firearm/FirearmModel.ts  definition -> scene graph; independently addressable components,
                           rest pose + strip transform + animation transform, render-mode variants
  geometry/builders.ts     parametric builders (box, cylinder, lathe, extrude, tube, spring, rail,
                           torus, cartridge, composite), quality tiers
  materials/               MaterialProfile library (PBR, procedural normal/roughness maps,
                           screen-space edge wear shader)
  animation/               easing (mechanical), Sequencer (AnimationSequence runner), Tween
  audio/AudioEngine.ts     layered synthesis, acoustic identity -> event recipes, environments
  core/Viewer.ts           renderer, lighting, camera rig, picking, overlays, casings, quality governor
  data/registry.ts         catalogue + code-split loader
  data/firearms/*.ts       one file per firearm
  ui/                      exhibition, collection, compare, plates, identify, landing
scripts/validate.ts        definition validator (integrity, geometry, published-length check)
tests/                     Playwright suite (every firearm, mode, stage, comparator, keyboard,
                           mobile, reduced motion, mute, visual baseline)
docs/AUTHORING.md          how to add a firearm
legacy/                    the previous single-file application, kept for reference
```

Frame convention: `+x` muzzle, `+y` up, `+z` shooter's right, origin on the bore axis at the breech face, millimetres.

## Commands

```
npm install
npm run dev              # http://localhost:5173
npm run validate -- m4a1 # or --all
npm run build            # typecheck + production build to dist/
npm run preview          # serve dist/ on :4173
npm test                 # Playwright (builds and serves automatically)
```

Deploy: `vercel --prod` (framework preset: Vite; output `dist`).

## Performance budget

- Initial JS (gzip): under 250 kB including three.js; each firearm definition is a separate chunk.
- No external 3D or audio assets; textures are generated once at start-up at 256 to 512 px.
- Target 60 fps on a 2020 laptop; pixel ratio capped at 2 (desktop), 1.5 (medium), 1 (low). An adaptive governor steps the pixel ratio down when frames exceed 15 ms.
- Rendering pauses when a viewport is off screen or its view is inactive.

## Data integrity

Specifications are audited against manufacturer sheets and military manuals named in each definition's provenance block. Where a figure could not be verified it is shown as N/A, "varies by configuration" or "source required". The thermal view, audio and ejection are procedural illustrations and are labelled as such in the interface.

## Keyboard

`C` charge · `Space` dry fire · `R` magazine · `S` selector · `E` eject · `F` field strip · `[` `]` stages · `1`–`5` cameras · `V` render mode · `D` dimensions · `I` data · `M` mute · `Esc` deselect
