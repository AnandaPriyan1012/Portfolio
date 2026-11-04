# Portfolio audit cycle four — 4 November 2026

The Work index now gives genuine project imagery more room. Studio uses clearer actual frames from both available films, and its Drive player explains the initial loading state while keeping the direct fallback available.

## Changes

- Fine-pointer desktops pair the existing editorial project list with one large glass preview. Hover or keyboard focus changes the image, preserving the last selection while crossing to its native link. Ordinary, modified and middle clicks keep normal anchor behavior. Only the image plane briefly settles in depth. Touch and coarse-pointer layouts retain all three original thumbnails. Reduced motion, Motion Off, light theme, forced colors, image delay and image failure retain accessible navigation.
- The CCK preview is the actual 0:05 notebook frame. Farewell AA now has its actual 0:05 montage frame and verified 4:18 duration. Both are locally served 640 × 360 JPEGs, shown in full with containment. Only decoding, scaling and JPEG encoding were applied; no grading, crop, generated content, identities or unverified production credit was added. The complete movies remain outside the repository. [Exact source manifest](film-still-sources.json).
- Drive loading feedback lasts until the iframe document loads. The initial empty frame is temporarily inert; after eight seconds the frame unlocks with an honest longer-loading message if it has not loaded. The direct Drive link and modal close action stay usable. An iframe load is never presented as proof that the film is ready or playing. The original canonical URL allowlist, sandbox, referrer policy and media permissions remain unchanged.

## Verification

The production build and all **171 Chromium tests** passed in 4.6 minutes. The exact compiled bundle `index-Ck3j-BvP.js` passed **8 route checks and 25 feature checks**, with no browser or network errors. The review includes desktop native image links and persistent selection, phone/coarse thumbnails, full-frame local stills and no background Google requests, eight-second delayed-frame feedback, close/focus behavior and the preceding tour/cursor/hash/lazy-image fixes. [Suite record](audit-cycle-four-checks.json) · [Compiled evidence](audit-cycle-four-compiled.json).

The first combined run exposed a one-pixel quantization edge in the wheel-delta test helper: 350 pixels of wheel input settled at a 349-pixel position change after preceding fractional targets. An isolated repeat confirmed it. The helper now permits the adjacent CSS pixel; actual forward/reverse visual thresholds, manual control and keyboard bounds are unchanged. The four-test atmosphere file and the complete 171-test suite then passed.

The same new player component also decoded an actual CCK excerpt: 1.887 seconds, 640 × 360, readyState 4, 51 frames, no media error. Earlier independent production tests decoded both real films on desktop and simulated phone. These actual provider probes are separate from UI fixtures; none verifies full-film continuity, audible output or physical Safari. Live checks for this release follow publication through the established GitHub main → Vercel workflow.

The About prototype remains separate and is not part of this release. No Netlify setting, Drive permission, dependency, font or full movie was changed or published.
