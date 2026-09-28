# Authoring a firearm for ARMORY OS 3

Every firearm is one TypeScript data file: `src/data/firearms/<id>.ts`, exporting a
`FirearmDefinition` (see `src/firearm/schema.ts`) as both a named export and `default`.
The reference implementation is `src/data/firearms/m4a1.ts`. Read it in full first.
Nothing else in the codebase changes per firearm.

## Frame and units

- `+x` toward the muzzle, `+y` up, `+z` shooter's right.
- Origin: on the bore axis at the breech face (bolt face / breech block face in battery).
  For revolvers use the rear face of the cylinder; for pump shotguns the bolt face in battery.
- Millimetres for all geometry, grams for mass, radians for angles, seconds for time.
- The model builder recentres the whole model, so absolute placement about the origin is fine.

## Dimensions and data integrity

- Overall length, barrel length, mass, muzzle velocity, rate of fire, effective range: use
  published manufacturer / military manual values. Give each `SpecValue` a `confidence`
  (`published` when it comes from a manufacturer sheet, manual or a reputable reference;
  `estimated` when derived; `unverified` when you could not find a reliable figure).
- Never invent a number. If a value is genuinely uncertain use
  `{ value: null, confidence: 'unverified', note: 'source required' }` or
  `'varies by configuration'`.
- The modelled overall length (bounding box x-extent, excluding ammunition) must match
  `spec.overallLength` within about 5 percent. The muzzle x-coordinate (`bore.muzzle[0]`)
  must equal the published barrel length (measured from the breech face; for revolvers
  barrel length is measured from the forcing cone, so place the barrel from the cylinder
  face forward). Run the validator (below) until it passes.
- Do not mix variants. Pick one configuration, state it in `provenance.configuration`,
  and keep name, dimensions, controls and components consistent with it.
- `spec.identification` is for a layperson (what they can see); `spec.mechanism` is for an
  enthusiast (how it works). Two or three sentences each. No marketing language.

## Components (25 to 45 per firearm)

- `id` snake_case, unique. `name` human. `group` from `ComponentGroup`.
- Use `extrude` side profiles (x forward, y up, extruded along z) for receivers, frames,
  slides, stocks, grips, magazines, triggers, hammers. Draw real silhouettes with 8 to 20
  points, in mm, in the firearm frame. Use `lathe` profiles (`[radius, x]` pairs) for
  barrels, bolts, carriers, muzzle devices, buffers, cylinders. Use `rail` for MIL-STD-1913
  rails, `spring` for springs, `cartridge` for rounds, `composite` to merge details
  (fasteners, ears, ribs, lugs) into one component.
- Give barrels a real profile (steps, threads, flutes as radius changes). Muzzle devices are
  separate components. Sights are separate components. Fasteners that matter (takedown
  pins, cross pins, cylinder crane screws) are separate small components.
- `parent` for parts that travel with another part: bolt / cam pin / firing pin inside a
  carrier; follower / spring / rounds inside a magazine; butt pad on a stock; grip panels
  on a frame; anything that should move with the lower / frame when receivers separate.
- `pivot` (relative to `position`) for anything that rotates: hammer, trigger, selector,
  bolt handle, cylinder, crane, folding stock hinge, loading gate, feed tray cover.
- `internal: true` for anything hidden inside another part in battery (x-ray shows it).
- `adjacent`: ids of the parts it interfaces with (3 to 6). Used for the relationship panel.
- `mass` approximate grams, `thermal` 0..1 illustrative heat (barrel/chamber/gas system
  hot, furniture cold), `confidence` for the geometry of that part.
- `materialLabel`: the real specification if known ("4150 CMV, chrome-lined").
- `function`: one sentence, factual, present tense.

## Field strip (stages 1 to 5)

`strip.stage` says when a component leaves the assembly; `strip.offset` is where it ends up
(mm, in the firearm frame, relative to its rest position; children move relative to their
parent). Stage windows are equal; `order` staggers parts within a stage (0 first).

Use platform-appropriate stages. Guidance:

| Platform | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| AR pattern | magazine | pins, receivers split | charging handle + carrier group | bolt stripped from carrier | matrix |
| AK pattern | magazine | dust cover + recoil spring assembly | carrier + bolt out | gas tube + handguard | matrix |
| HK roller (G3, MP5) | magazine | rear push pins, stock + trigger group off | bolt group out | bolt head from carrier, rollers | matrix |
| Short-stroke piston rifles (SCAR, AUG, L85, MP7) | magazine | receivers / stock separate | carrier group out | bolt detail | matrix |
| Pistols (Glock, 1911, Desert Eagle) | magazine | slide off frame | barrel + recoil assembly out of slide | striker / firing pin detail | matrix |
| Revolver | cylinder swings out on the crane | crane + cylinder off | sideplate / grips off | hammer, trigger, hand exposed | matrix |
| Pump shotgun | shells / magazine tube contents | barrel off (magazine cap) | forend + action bars + bolt out | trigger group out | matrix |
| Semi-auto shotgun | shells | barrel + forend off | bolt group out | trigger group out | matrix |
| Turn-bolt rifle | magazine | bolt out | stock / chassis separates from barrelled action | bolt detail (firing pin, shroud) | matrix |
| Belt-fed | feed tray cover open, belt / box off | barrel off (quick change) | bolt + piston out | trigger group / stock off | matrix |
| Barrett M82 | magazine | upper and lower receiver split | barrel + springs forward | bolt carrier out | matrix |

Stage 5 spreads every remaining component along its assembly axis. Nothing should pass
through anything else on its way out: choose offsets along a clear axis (down for
magazines, rearward for bolt groups, sideways for pins, up for covers and optics).

`fieldStrip` has exactly six entries (stage 0 to 5). Descriptions are for a visitor, one or
two sentences on what separates and why it matters mechanically. They are not
instructions: no imperatives, no "press", no "pull", no step-by-step tool talk.

## Actions

Provide the sequences that apply, using real travel distances:

- `cycle`: what an operator does to cycle the action. AR: charging handle and carrier
  rearward about 85 mm and return. AK: charging handle on the carrier, about 120 mm.
  HK roller: cocking handle rearward and up into the notch, then slapped down; bolt travel
  about 100 mm. Pump: forend rearward about 85 mm then forward. Turn-bolt: bolt handle
  lifts (rotate about x, 60 to 90 degrees), bolt back 90 to 110 mm, forward, handle down.
  Revolver (single action): hammer cocks and the cylinder indexes one chamber (rotate about
  x by 2π/6). Pistol: slide rearward about 40 to 50 mm and return. Belt-fed: charging
  handle rearward, bolt held open.
- `dryFire`: trigger rotates about its pivot, hammer or striker falls, trigger resets.
  Revolver double action: trigger pull cocks and drops the hammer and indexes the cylinder.
- `reload`: magazine out and in (or cylinder out / loading gate / shell into the port / feed
  cover open and close). The magazine catch or release moves too.
- `safety`: selector or safety lever rotation (rest pose = SAFE where the design has one).
  Omit for designs without an external safety (Glock, most revolvers).

Timing: mechanical, not UI. Fast parts fast (hammer fall 40 to 70 ms), hand-driven parts
300 to 500 ms per stroke. Each sequence lists its `audio` cues with `caption` text.
Easings: `inOutCubic` hand strokes, `springReturn` spring-driven returns,
`mechanicalSnap` hammer / striker, `detent` selectors, `outBack` covers snapping open.

## Acoustic identity

`mass` (g), `receiver` class, `action` type, `reciprocatingMass` (g: slide, carrier group,
bolt, cylinder), `spring` `{ frequency, damping }` (frequency 18 to 40, heavier springs
lower), `furniture`. The audio engine derives every event from these; add `overrides`
only when the generic model is clearly wrong for the platform.

## Other required fields

- `cartridge`: real case and bullet dimensions (mm) and a label.
- `ejection`: port position and a normalised direction in the firearm frame (revolvers: the
  cylinder position and a downward direction; belt-feds: below or to the right).
- `bore`: `breech` `[0,0,0]` and `muzzle` `[barrelLength,0,0]`.
- `comparison.dimensions`: at least overall length and barrel length lines, placed just
  below and above the model.
- `provenance`: configuration string, `version: '3.0.0'`, `modelOrigin: 'parametric'`,
  `sources` (label each source and what it covers), `notes` on deliberate simplifications.

## Validate

```
npm run validate -- <id>
```

Zero errors required. Fix warnings about length mismatch. Then `npx tsc --noEmit` must be
clean for your file. Do not edit any file outside `src/data/firearms/` except to add your
file; the registry already lists your id.
