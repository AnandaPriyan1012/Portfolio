# Portfolio audit cycle six — 4 November 2026

This release combines the requested every-page AP opening, a smaller persistent glass pointer and three approved original films. It preserves the previous case-study navigation, contact card, genuine interface captures and existing Drive players.

## Opening and pointer

The supplied AP PNG remains the exact visible logo shape. It draws in warm gold on an opaque black stage at initial entry and every pathname change, including Back/Forward. Same-page anchors do not replay it. The normal stage lasts 1.6 seconds; reduced motion, saved Motion Off, forced colors and resource constraints receive a 120 ms static stamp. Skip, Escape, Tab and scroll intent dismiss immediately. The page does not wait for media or acquire a scroll lock.

The crystal arrow is now 21 × 27 CSS pixels, with a clear tip and smaller hotspot. One persistent pointer retains the last real mouse position across main pages, cases and the 404. Hit testing updates on scroll, route changes, opening dismissal and relevant DOM changes. Native dialog controls retain the arrow while native media controls and embedded players keep the system cursor. Editing, text selection, touch, reduced motion and forced colors also keep their native behavior. There is no idle animation loop or synthetic initial pointer position.

Compiled frame capture found a native film dialog could survive into the first Back-transition frame. Loader and page history listeners can run in different orders, so waiting for the page update's cleanup was insufficient. The existing opening-active event now closes the native top layer, pauses local media and clears modal state in the opening's layout phase. Dialog lifecycle cleanup also runs before paint. A first-stage coverage regression and retained-video lifecycle checks protect this handoff.

## Original films

Studio now has six unique titles, of which five are playable. The existing CCK and Farewell Drive previews are unchanged. Three approved local H.264 films and their supplied real-frame posters are added:

- Vantara / Masquerade trailer, 2:46, using the supplied lightweight 720p export. This is one film with an alternate title; all supplied black sections remain unchanged.
- TED-Ed auditions, 0:32, using the newly supplied final export.
- CIRS website launch, 0:38. Visible Crossroads material is not presented as a separate authorship credit.

Native players mount only after an explicit Watch action, with standard controls, keyboard focus and responsive containment. They do not autoplay or make page-load MP4 requests. Exact production credits remain unknown and are not invented to unlock playback. The explicit approved-source flag is limited to local MP4/poster pairs. CIRSMUN 2026 remains unmatched and unavailable. File sizes, hashes and delivery metadata are recorded in [the source manifest](approved-native-films.json).

An independent check caught a real keyboard issue in the secondary film strip: its scroll transform could leave a focused card outside the clipping window. Keyboard focus now temporarily uses native horizontal scrolling and reveals the complete card. Leaving the strip resets that offset and restores the visual scroll treatment. Pointer activation does not move a card before its click, and release outside the strip cannot leave the pointer guard latched. The programme remains directly usable throughout.

## Validation record

TypeScript and the production build passed. The combined 244-scenario Chromium run passed 243 checks; its one obsolete assertion expected the arrow to disappear after clicking an Admissions note. That expectation was updated to the requested persistent arrow, preserving strict source alignment, and all ten Admissions checks then passed. After the reel correction, all 34 related motion, fallback, native playback, lifecycle and keyboard checks passed. The final atomic opening correction then passed all 42 route, navigation, lifecycle and keyboard checks, including the new first-stage regression. [Measured record](audit-cycle-six-checks.json).

Phone checks use Chromium mobile emulation. Short decoded playback and seek checks do not establish whole-film continuity, audio audition or physical Safari compatibility. Compiled and public deployment checks are recorded separately. The legacy Netlify application and original Drive sharing settings are preserved.
