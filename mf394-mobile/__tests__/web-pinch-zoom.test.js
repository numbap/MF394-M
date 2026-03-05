/**
 * web-pinch-zoom.test.js
 *
 * Verifies that public/index.html contains all four layers of pinch-zoom prevention:
 *   1. Viewport meta tag with user-scalable=no and maximum-scale=1
 *   2. CSS touch-action on html and body
 *   3. JS event listeners for wheel+ctrlKey (trackpad) and touchmove (mobile)
 *   4. Visual Viewport API counter-zoom to neutralize iOS viewport zoom
 *
 * These are the only reliable cross-browser defenses against pinch-zoom on web,
 * since modern Safari/Chrome intentionally ignore user-scalable=no in some cases.
 */

const fs = require('fs');
const path = require('path');

// Expo uses public/index.html as the web template (not web/index.html)
const HTML_PATH = path.resolve(__dirname, '../public/index.html');

let html;

beforeAll(() => {
  html = fs.readFileSync(HTML_PATH, 'utf8');
});

describe('public/index.html pinch-zoom prevention', () => {
  describe('Layer 1: Viewport meta tag', () => {
    it('has a viewport meta tag', () => {
      expect(html).toMatch(/<meta[^>]+name=["']viewport["'][^>]*>/i);
    });

    it('sets maximum-scale=1', () => {
      const metaMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i);
      expect(metaMatch).not.toBeNull();
      expect(metaMatch[0]).toMatch(/maximum-scale\s*=\s*1/i);
    });

    it('sets user-scalable=no', () => {
      const metaMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i);
      expect(metaMatch).not.toBeNull();
      expect(metaMatch[0]).toMatch(/user-scalable\s*=\s*no/i);
    });
  });

  describe('Layer 2: CSS touch-action', () => {
    it('applies touch-action to all elements via universal selector', () => {
      // Matches: * { touch-action: pan-x pan-y; }
      // The universal selector ensures ALL elements (including RNW-generated divs) are covered.
      expect(html).toMatch(/\*\s*\{[^}]*touch-action\s*:\s*pan-x\s+pan-y\s*!important/);
    });
  });

  describe('Layer 3: JavaScript event listeners', () => {
    it('prevents wheel events when ctrlKey is held (trackpad pinch)', () => {
      // Must call preventDefault() inside a ctrlKey check on the wheel event
      expect(html).toMatch(/addEventListener\s*\(\s*['"]wheel['"]/);
      expect(html).toMatch(/ctrlKey/);
      expect(html).toMatch(/preventDefault/);
    });

    it('prevents touchmove events with more than one touch (mobile pinch)', () => {
      expect(html).toMatch(/addEventListener\s*\(\s*['"]touchmove['"]/);
      // Must check touch count (e.touches.length > 1 or >= 2)
      expect(html).toMatch(/touches\.length/);
      // Must call preventDefault()
      const touchmoveBlock = html.match(
        /addEventListener\s*\(\s*['"]touchmove['"][^)]*\)[\s\S]*?(?=document\.addEventListener|<\/script>)/
      );
      expect(touchmoveBlock).not.toBeNull();
    });

    it('registers wheel listener as non-passive so preventDefault works', () => {
      // passive: false is required for preventDefault() to be effective
      // Check that passive: false appears near the wheel listener
      const wheelListenerRegion = html.match(
        /addEventListener\s*\(\s*['"]wheel['"][\s\S]{0,200}?passive\s*:\s*false/
      );
      expect(wheelListenerRegion).not.toBeNull();
    });

    it('registers touchmove listener as non-passive so preventDefault works', () => {
      const touchListenerRegion = html.match(
        /addEventListener\s*\(\s*['"]touchmove['"][\s\S]{0,200}?passive\s*:\s*false/
      );
      expect(touchListenerRegion).not.toBeNull();
    });

    it('checks e.scale in touchmove listener for Safari pinch detection', () => {
      expect(html).toMatch(/e\.scale\s*!==\s*undefined/);
      expect(html).toMatch(/e\.scale\s*!==\s*1/);
    });

    it('has a gesturestart listener (Safari-specific gesture prevention)', () => {
      expect(html).toMatch(/addEventListener\s*\(\s*['"]gesturestart['"]/);
    });

    it('has a gesturechange listener (Safari-specific gesture prevention)', () => {
      expect(html).toMatch(/addEventListener\s*\(\s*['"]gesturechange['"]/);
    });

    it('blocks multi-touch on touchstart (not just touchmove)', () => {
      // touchstart must also check touches.length > 1 to block the gesture early
      const touchstartBlock = html.match(
        /addEventListener\s*\(\s*['"]touchstart['"][\s\S]{0,300}?touches\.length/
      );
      expect(touchstartBlock).not.toBeNull();
    });

    it('registers touchstart listener with capture: true', () => {
      // capture phase ensures we fire before any framework handler
      const region = html.match(
        /addEventListener\s*\(\s*['"]touchstart['"][\s\S]{0,200}?capture\s*:\s*true/
      );
      expect(region).not.toBeNull();
    });

    it('registers touchmove listener with capture: true', () => {
      const region = html.match(
        /addEventListener\s*\(\s*['"]touchmove['"][\s\S]{0,200}?capture\s*:\s*true/
      );
      expect(region).not.toBeNull();
    });

    it('registers gesturestart listener with capture: true', () => {
      const region = html.match(
        /addEventListener\s*\(\s*['"]gesturestart['"][\s\S]{0,200}?capture\s*:\s*true/
      );
      expect(region).not.toBeNull();
    });

    it('registers gesturechange listener with capture: true', () => {
      const region = html.match(
        /addEventListener\s*\(\s*['"]gesturechange['"][\s\S]{0,200}?capture\s*:\s*true/
      );
      expect(region).not.toBeNull();
    });
  });

  describe('Layer 4: Visual Viewport counter-zoom', () => {
    it('uses window.visualViewport to detect zoom', () => {
      expect(html).toMatch(/window\.visualViewport/);
    });

    it('polls for zoom changes using setInterval with touch-aware throttling', () => {
      expect(html).toMatch(/setInterval\s*\(/);
      expect(html).toMatch(/touching/);
    });

    it('resets touching flag to false on touchend', () => {
      // After touch ends, the polling should throttle back to slow mode
      expect(html).toMatch(/addEventListener\s*\(\s*['"]touchend['"]/);
      expect(html).toMatch(/touching\s*=\s*false/);
    });

    it('applies counter-transform with translate and scale to #root', () => {
      expect(html).toMatch(/vv\.scale/);
      expect(html).toMatch(/root\.style\.transform/);
      expect(html).toMatch(/translate\(/);
      expect(html).toMatch(/offsetLeft/);
      expect(html).toMatch(/offsetTop/);
      expect(html).toMatch(/1\s*\/\s*vv\.scale/);
    });

    it('sets transformOrigin to "0 0" when applying counter-scale', () => {
      expect(html).toMatch(/root\.style\.transformOrigin\s*=\s*['"]0 0['"]/);
    });

    it('clears transform and transformOrigin when scale returns to 1 (reset path)', () => {
      // When lastScale > 1.01 but current scale is back to 1, both must be cleared
      const resetBlock = html.match(
        /lastScale\s*>\s*1\.01[\s\S]{0,200}?root\.style\.transform\s*=\s*['"]['"][\s\S]{0,100}?root\.style\.transformOrigin\s*=\s*['"]['"]/
      );
      expect(resetBlock).not.toBeNull();
    });
  });
});
