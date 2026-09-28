# CLAUDE.md - ARMORY OS

Live: https://armory.raul.my · Mirror: https://armory-os.vercel.app · Repo: https://github.com/raullee/armory-os

## State: v3 (September 2026)

Rebuilt from the single-file v2 into a Vite + TypeScript + three.js application. Each firearm is a data file against `src/firearm/schema.ts`; the engine is shared. See `README.md` for the architecture map and `docs/AUTHORING.md` for how to add or fix a firearm.

## Rules for this repo

- Never invent a specification. Every `SpecValue` carries a confidence grade; unknown means `null` with a note.
- Frame: `+x` muzzle, `+y` up, `+z` right, origin at the breech face, millimetres.
- A firearm change is a change to `src/data/firearms/<id>.ts` only. Run `npm run validate -- <id>`; zero errors required, modelled length within 5% of published.
- Field-strip copy is visitor-facing description, never instruction.
- Firing is not simulated. Do not add gunshot audio.
- Design ethos: monochrome, hairline rules, small-caps labels, numbered lists, one object edge to edge, colour only as a status dot. No glow, no scanlines, no fake telemetry.
- Before reporting done: `npm run build` clean, `npm test` green, and a browser check of the exhibition.

## Verification

- `npm run validate -- --all`
- `npm test` (Playwright, builds and serves the production bundle on :4173)
- Deploy with `vercel --prod`; the domain is managed in Vercel.
