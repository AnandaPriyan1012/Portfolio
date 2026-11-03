# Glass Atelier refinement review

The refined build keeps the full glass hero and gives the later chapters their own material treatment. Its Film Strip header is slimmer, the hero hands off continuously to CIRS, project media now includes real website/prototype captures, and Contact opens the owner's confirmed email address.

These are browser captures of the implemented local build before publication. Deployment verification is recorded separately in [vercel-deployment.md](vercel-deployment.md).

## Visual evidence

| View | Opening | CIRS | Vallalar | AccuFlow | Studio | Contact |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop, 1440 × 1000 | [Hero](refinement-desktop-start.png) · [Handoff](refinement-desktop-handoff.png) | [Expanded frame](refinement-desktop-middle.png) · [Admissions](refinement-desktop-cirs.png) | [Community chapter](refinement-desktop-community.png) | [Actual prototype](refinement-desktop-accuflow.png) | [Film collection](refinement-desktop-studio.png) | [Email destination](refinement-desktop-end.png) |
| Phone emulation, 390 × 844 | [Portrait hero](refinement-mobile-start.png) | [Admissions](refinement-mobile-cirs.png) | [Community chapter](refinement-mobile-community.png) | [Actual prototype](refinement-mobile-accuflow.png) | [Film collection](refinement-mobile-studio.png) | [Email destination](refinement-mobile-end.png) |

Actual silent scroll recordings: [desktop, 30.16 seconds](refinement-desktop-scroll.webm) and [phone emulation, 11.32 seconds](refinement-mobile-scroll.webm). The desktop recording includes expansion, reversal and progression through the chapters. [Scene measurements](refinement-measurements.json) record the navigation state, engine and overflow during those journeys. The Admissions desktop still was separately aligned through the real View Work action.

The final normal-motion opening captures were visually inspected: the supplied AP signature is visible in warm champagne before the visitor scrolls, and the separately composed portrait glass remains legible. The handoff, expanded school frame, real website captures, Studio index and email destination were also inspected.

## Verification

- **60 distinct browser checks passed:** 50 Chromium checks across the full regression suite and focused reruns, plus 10 focused Firefox checks.
- All six widths passed: 320, 375, 390, 768, 1024 and 1440 CSS pixels. No horizontal overflow was found. The tested mobile controls retain at least 44 × 44 CSS pixel targets.
- Header height is 76px on desktop, 72px on tablets and 64px on phones. Anchor positioning measures the actual header and adds 20px. The pinned CIRS title remained at 96px beneath a 76px header.
- Actual wheel input was sampled through the hero handoff. The CIRS frame starts expanding immediately, and covers the centre before the introduction retires. It reaches approximately 1267 × 660 CSS pixels on the tested laptop viewport and reverses to its original approximately 346 × 220 frame. The shifted name remains separate from the growing screenshot during the crossover.
- Exactly one navigation item receives `aria-current="location"`. Direct navigation, ordinary scrolling and returning to Work update the Film Strip state correctly.
- A compositor issue could drop the filtered PNG from the initial normal-motion header despite successful image decoding. The final presentation uses the original PNG's exact alpha as a warm CSS mask, with a semantic image and a failure fallback. A rendered-PNG pixel test now verifies actual gold pixels in cold desktop and phone header screenshots before any scroll. The original-image failure test preserves a readable AP fallback.
- The confirmed contact link is `mailto:anandapriyan1012@gmail.com`. It is directly available from the Contact section and remains within the narrow-screen viewport.
- Real Vallalar and AccuFlow captures decoded on entering their sections, with provenance captions. The CIRS quick view, Escape/focus return, case-study link, direct route reloads, About keyboard controls and secondary experiment controls passed regression checks.
- Reduced-motion and simulated low-power modes retain readable content and skip smoothing, pinning and large movement. A failed CIRS image still produces a usable static fallback.
- Unsupplied films have no fabricated play controls. Isolated synthetic fixtures continue to verify the conditional real-film gallery, explicit playback, muted default and static mobile/reduced-motion layout; those fixtures are not portfolio media.
- No uncaught browser errors occurred in the guarded regressions or final recorded journeys.

## Content accuracy and remaining material

The Vallalar visual is an actual About-page website review preview, not a documentary photograph of the organisation. Temporary food-reference imagery from that project was excluded. AccuFlow uses the actual public prototype's guide interface and is identified as a product/interaction prototype, with no medical-effectiveness or measured-result claim. [Project source evidence](project-source-evidence.md) records the original URLs, repository context and capture scope.

The owner confirmed the email address but has not supplied the six original films, stills and exact production credits, community documentary photographs, or personal CIRS decisions and lessons. AccuFlow's exact individual contribution and personal reflection also remain unconfirmed. Those claims were not invented. Unanswered reflection chapters and public editor checklists are omitted; the film collection keeps one concise availability note.

These are cloud Chromium and Firefox checks. A physical phone/laptop and Safari were not tested. WebKit previously could not launch because the host lacks its native libraries. No real-device frame-rate or performance claim is made.
