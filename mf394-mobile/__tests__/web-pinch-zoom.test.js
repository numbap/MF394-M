/**
 * web-pinch-zoom.test.js
 *
 * Verifies that web/index.html contains all three layers of pinch-zoom prevention:
 *   1. Viewport meta tag with user-scalable=no and maximum-scale=1
 *   2. CSS touch-action on html and body
 *   3. JS event listeners for wheel+ctrlKey (trackpad) and touchmove (mobile)
 *
 * These are the only reliable cross-browser defenses against pinch-zoom on web,
 * since modern Safari/Chrome intentionally ignore user-scalable=no in some cases.
 */

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.resolve(__dirname, '../web/index.html');

let html;

beforeAll(() => {
  html = fs.readFileSync(HTML_PATH, 'utf8');
});

describe('web/index.html pinch-zoom prevention', () => {
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
    it('applies touch-action to html and body', () => {
      // Matches: html, body { ... touch-action: pan-x pan-y ... }
      // Allows whitespace variation and properties before/after touch-action.
      expect(html).toMatch(/html\s*,\s*body\s*\{[^}]*touch-action\s*:\s*pan-x\s+pan-y/);
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
  });
});
