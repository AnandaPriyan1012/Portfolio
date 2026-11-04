# Portfolio audit cycle three — 4 November 2026

This update makes the real work easier to inspect. The CIRS case study gains an interactive Admissions image study; Studio and the desktop Home preview gain a genuine CCK trailer still. It also fixes internal Contact keyboard focus, restores the glass arrow on case-study pages and reserves the next-project image footprint.

## Scope

- Three native Admissions image-note buttons move a glass outline over the exact captured Portal, Process and Enquiries regions. The entire 1440 × 1000 website capture remains visible. On phones the toolbar sits above the image. Notes describe the captured interface and direct current admissions details to the school office; they do not claim applications are currently open. Reduced motion, saved Motion Off, light theme, forced colours and image failure retain usable text and controls.
- CCK uses the approved trailer's unchanged 640 × 360, 9,190-byte Drive thumbnail. It is served locally, shown in full with `object-fit: contain`, and labelled as an actual film still. No Google request occurs before Watch. Farewell AA retains its title card because its available provider thumbnail was black. [Asset provenance](../public/media/README.md).
- Internal Contact navigation focuses the visible Contact heading, then the email and card in DOM order. The About handoff likewise targets its actual section. Missing, malformed or outside-main hashes safely fall back to the page heading.
- Case-study pages now mount the same glass-arrow component with route cleanup and existing native-cursor fallbacks. Reserved next-project image frames remove the measured lazy-image shift without adding an empty scroll track.

## Validation

The production build and all **139 Chromium checks** passed. The compiled build (`index-BJXSf7Da.js`) passed **8 route visits and 18 feature checks**, with no browser or network errors. All six held-image cases (three real assets × desktop/phone) measured **0 px** geometry change after image loading. [Suite summary](audit-cycle-three-checks.json) · [Compiled checks](audit-cycle-three-compiled.json).

Separately, short excerpts of both real production Drive embeds decoded on desktop and simulated phone: CCK advanced about 1.9 seconds with 50/52 decoded frames; Farewell about 1.9/1.7 seconds with 49/45 frames. All reported readyState 4 and no media error. This verifies actual playback rather than just a thumbnail. It does not verify full-film continuity, audible output or physical Safari. Google can initially show a black loading frame; its direct-player link remains available. No iframe security/privacy attribute or Drive permission was changed.

These are validation records before this update's publication. The matching GitHub Vercel status and public release checks establish deployment. The separate Netlify version is preserved.
