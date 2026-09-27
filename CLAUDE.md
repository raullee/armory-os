# CLAUDE.md - ARMORY OS

Live URL: https://armory.raul.my
Mirror: https://armory-os.vercel.app
Repository: https://github.com/raullee/armory-os

## Current State: Phase Two Optimization Complete

The latest update resolves audio realism and field strip UI layout feedback:
1. **Audio Realism Overhaul (`ArmoryAudio 2.0`)**:
   - Upgraded from simple oscillator sweeps to physical modal acoustic synthesis.
   - True ordnance steel physics: multi-band modal filter bank modeling receiver body mass (125Hz), trunnion/receiver rails (780Hz), bolt carrier group (1580Hz), and hardened tool steel locking lugs (5200Hz) with high-Q resonators.
   - Waveshaper non-linear saturation for analog mechanical thickness.
   - Real mechanical rail friction (dual-formant pink noise), buffer spring twang, and drawn 70/30 brass multi-bounce floor acoustics (3820Hz, 4920Hz, 6380Hz).
   - Micro-transient contact clicks and secondary mechanical chatter.

2. **Un-Overlaid & Elevated Hero Field Strip Console**:
   - Secondary tools (Cyber Wire, PBR Metal, Thermal IR, Laser, Scanline, CAD Lines, Auto-spin, Reset) moved to a clean top-right tactical dock.
   - Viewport bottom is dedicated exclusively to the unified **Hero Field Strip & Tactile Console**:
     - **Tier 1 (Tactile Action Lab)**: Cycle Action (`C`), Dry Fire (`Space`), Reload Mag (`R`), Eject 3D Brass (`E`), and Chamber Status.
     - **Tier 2 (Hero Field Strip Console)**:
       - Master Field Strip button (`[ ⚡ FIELD STRIP WEAPON (F) ]`).
       - Step-by-Step Disassembly controls (`[ ◀ PREV ]` and `[ NEXT ▶ ]` or keys `[` and `]`).
       - Autonomous sequence walkthrough (`[ ▷ AUTO STRIP ]`).
       - Dynamic live detachment counter (e.g. `24 / 24 PARTS DETACHED`).
       - Stage badges:
         - Stage 0: `IN BATTERY` (0%)
         - Stage 1: `MAG CLEARED` (20%)
         - Stage 2: `RECEIVERS SPLIT` (40%)
         - Stage 3: `BCG EXTRACTED` (60%)
         - Stage 4: `BOLT DETAIL STRIPPED` (80%)
         - Stage 5: `FULL CAD MATRIX` (100%)
       - Smooth Hermite interpolation per subassembly during sliding.

3. **Automated Verification**:
   - Verified via Playwright headless browser test (`test_field_strip.py`): 100% pass across all stages, controls, audio synthesis methods, and bounds checks.
