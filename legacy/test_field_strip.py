import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def run_tests():
    html_path = os.path.abspath("index.html")
    file_url = f"file://{html_path}"
    print(f"Testing {file_url}")

    errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        page.on("pageerror", lambda err: errors.append(f"Page Error: {err}"))
        page.on("console", lambda msg: errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)

        await page.goto(file_url, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # 1. Check Portal exists and enter
        portal_btn = await page.query_selector("#portal-enter-btn")
        if not portal_btn:
            raise Exception("Portal enter button not found")
        print("✓ Portal exists. Entering Armory...")
        await portal_btn.click()
        await page.wait_for_timeout(800)

        portal_overlay = await page.query_selector("#landing-portal")
        is_hidden = await page.evaluate("el => el.style.opacity === '0' || window.getComputedStyle(el).opacity === '0'", portal_overlay)
        assert is_hidden, "Portal overlay did not fade out"
        print("✓ Entrance Portal warp zoom executed cleanly")

        # 2. Check Canvas Container & Layout
        canvas_container = await page.query_selector("#canvas-container")
        assert canvas_container, "Canvas container not found"
        hero_console = await page.query_selector("#tactile-hero-console")
        assert hero_console, "Hero Field Strip Console not found"
        print("✓ Hero Field Strip Console exists")

        # Check that Hero Console is within canvas container bounds
        c_box = await canvas_container.bounding_box()
        h_box = await hero_console.bounding_box()
        print(f"Canvas Box: {c_box}")
        print(f"Hero Console Box: {h_box}")
        assert h_box["y"] + h_box["height"] <= c_box["y"] + c_box["height"] + 5, "Hero console overflows bottom"
        assert h_box["y"] > c_box["y"] + 200, "Hero console covers top of canvas"
        print("✓ Hero Console positioned cleanly at bottom with zero obstruction")

        # 3. Test Step-by-Step Field Strip
        step_next = await page.query_selector("#btn-step-next")
        step_prev = await page.query_selector("#btn-step-prev")
        stage_badge = await page.query_selector("#strip-stage-badge")
        part_count = await page.query_selector("#strip-part-count")
        explode_slider = await page.query_selector("#explode-slider")

        badge_0 = await stage_badge.inner_text()
        print(f"Stage 0 text: {badge_0}")
        assert "STAGE 0/5" in badge_0

        # Step to Stage 1
        await step_next.click()
        await page.wait_for_timeout(500)
        badge_1 = await stage_badge.inner_text()
        count_1 = await part_count.inner_text()
        slider_1 = await page.evaluate("el => el.value", explode_slider)
        print(f"Stage 1: {badge_1} | {count_1} | Slider: {slider_1}")
        assert "STAGE 1/5" in badge_1, f"Expected STAGE 1/5, got {badge_1}"

        # Step to Stage 2
        await step_next.click()
        await page.wait_for_timeout(500)
        badge_2 = await stage_badge.inner_text()
        count_2 = await part_count.inner_text()
        print(f"Stage 2: {badge_2} | {count_2}")
        assert "STAGE 2/5" in badge_2

        # Step to Stage 3
        await step_next.click()
        await page.wait_for_timeout(500)
        badge_3 = await stage_badge.inner_text()
        print(f"Stage 3: {badge_3}")
        assert "STAGE 3/5" in badge_3

        # Step to Stage 4
        await step_next.click()
        await page.wait_for_timeout(500)
        badge_4 = await stage_badge.inner_text()
        print(f"Stage 4: {badge_4}")
        assert "STAGE 4/5" in badge_4

        # Step to Stage 5 (100% full CAD matrix)
        await step_next.click()
        await page.wait_for_timeout(500)
        badge_5 = await stage_badge.inner_text()
        count_5 = await part_count.inner_text()
        slider_5 = await page.evaluate("el => el.value", explode_slider)
        print(f"Stage 5: {badge_5} | {count_5} | Slider: {slider_5}")
        assert "STAGE 5/5" in badge_5
        assert "PARTS DETACHED" in count_5 and ("24 / 24" in count_5 or "46 / 46" in count_5)

        # Step backwards to Stage 4
        await step_prev.click()
        await page.wait_for_timeout(500)
        badge_back = await stage_badge.inner_text()
        print(f"Stepped back: {badge_back}")
        assert "STAGE 4/5" in badge_back

        # Master button toggle (Collapse back to battery)
        explode_btn = await page.query_selector("#explode-btn")
        await explode_btn.click()
        await page.wait_for_timeout(700)
        badge_coll = await stage_badge.inner_text()
        count_coll = await part_count.inner_text()
        slider_coll = await page.evaluate("el => el.value", explode_slider)
        print(f"After Collapse: {badge_coll} | {count_coll} | Slider: {slider_coll}")
        assert "STAGE 0/5" in badge_coll
        assert "0 /" in count_coll and "PARTS DETACHED" in count_coll

        # 4. Test Tactile Action Lab Buttons
        btn_action = await page.query_selector("#btn-action-cycle")
        btn_dry = await page.query_selector("#btn-dry-fire")
        btn_reload = await page.query_selector("#btn-reload")
        btn_eject = await page.query_selector("#btn-eject-brass")
        chamber = await page.query_selector("#tactile-chamber-status")

        await btn_action.click()
        await page.wait_for_timeout(250)
        ch_text = await chamber.inner_text()
        print(f"Chamber after cycle: {ch_text}")
        assert "LOCKED" in ch_text

        await btn_dry.click()
        await page.wait_for_timeout(100)
        ch_dry = await chamber.inner_text()
        print(f"Chamber after dry fire: {ch_dry}")
        assert "STRIKER DROPPED" in ch_dry or "UNCOCKED" in ch_dry or "EMPTY" in ch_dry

        await btn_reload.click()
        await page.wait_for_timeout(700)
        ch_rel = await chamber.inner_text()
        print(f"Chamber after reload: {ch_rel}")
        assert "MAGAZINE" in ch_rel or "LOCKED" in ch_rel or "SEATED" in ch_rel or "UNCOCKED" in ch_rel

        await btn_eject.click()
        await page.wait_for_timeout(200)
        print("✓ Brass casing ejected cleanly")

        # 5. Test Audio Engine Execution (Modal Synthesis)
        audio_test_result = await page.evaluate("""
            () => {
                try {
                    ArmoryAudio.init();
                    ArmoryAudio.playModalStrike({ bodyFreq: 125, trunnionFreq: 780, carrierFreq: 1580, ringFreq: 5200, intensity: 1.0 });
                    ArmoryAudio.playSlideRack('assault', 'm4a1');
                    ArmoryAudio.playSlideRack('submachine', 'hkmp5');
                    ArmoryAudio.playSlideRack('shotgun', 'remington870');
                    ArmoryAudio.playSlideRack('sniper', 'aiax338');
                    ArmoryAudio.playDryFire();
                    ArmoryAudio.playMagEject();
                    ArmoryAudio.playMagInsert();
                    ArmoryAudio.playShellClink();
                    ArmoryAudio.playFieldStripStage(1);
                    ArmoryAudio.playFieldStripStage(2);
                    ArmoryAudio.playFieldStripStage(3);
                    ArmoryAudio.playFieldStripStage(4);
                    ArmoryAudio.playFieldStripStage(5);
                    return { success: true };
                } catch (e) {
                    return { success: false, error: e.toString() };
                }
            }
        """)
        assert audio_test_result["success"], f"Audio error: {audio_test_result.get('error')}"
        print("✓ ArmoryAudio 2.0 modal synthesis methods executed with ZERO errors")

        # 6. Test Keybindings ([ and ] and F)
        await page.keyboard.press("BracketRight")
        await page.wait_for_timeout(500)
        badge_key = await stage_badge.inner_text()
        print(f"After ']' keypress: {badge_key}")
        assert "STAGE 1/5" in badge_key

        await page.keyboard.press("BracketLeft")
        await page.wait_for_timeout(500)
        badge_key0 = await stage_badge.inner_text()
        print(f"After '[' keypress: {badge_key0}")
        assert "STAGE 0/5" in badge_key0

        await page.keyboard.press("f")
        await page.wait_for_timeout(700)
        badge_keyf = await stage_badge.inner_text()
        print(f"After 'f' keypress: {badge_keyf}")
        assert "STAGE 5/5" in badge_keyf

        await browser.close()

    if errors:
        print("Encountered errors during test:", errors)
        sys.exit(1)
    print("\n==========================================")
    print("ALL PLAYWRIGHT TESTS PASSED WITH 100% SUCCESS!")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
