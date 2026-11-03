# Local Glass Atelier review

This is a local preview. No Netlify deployment or public publication was performed as part of this review.

## Visual evidence

The screenshots were captured after the responsive hero source decoded, fonts were ready and the browser painted two frames. The opening title was allowed to finish before the final hero captures. These are browser screenshots of the implemented site, not concept renders.

| View | Start | CIRS | Vallalar | AccuFlow | Studio | End |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop, 1440 × 1000 | [Hero](local-atelier-desktop-start.png) | [Expanded scene](local-atelier-desktop-middle.png) · [Case section](local-atelier-desktop-cirs.png) | [Community](local-atelier-desktop-community.png) | [AccuFlow](local-atelier-desktop-accuflow.png) | [Studio](local-atelier-desktop-studio.png) | [Contact](local-atelier-desktop-end.png) |
| Phone, 390 × 844 | [Hero](local-atelier-mobile-start.png) | [Case section](local-atelier-mobile-cirs.png) | [Community](local-atelier-mobile-middle.png) | [AccuFlow](local-atelier-mobile-accuflow.png) | [Studio](local-atelier-mobile-studio.png) | [Contact](local-atelier-mobile-end.png) |

Actual silent wheel-scroll recordings: [desktop, 27.72 s](local-atelier-scroll.webm) and [phone emulation, 13.32 s](local-atelier-mobile-scroll.webm). The desktop recording includes forward expansion, a reverse scroll to the hero and continuation through all sections. The phone uses native scrolling with no pinned scene. Additional captures show the [brief opening title](local-atelier-loader.png), [branded 404](local-atelier-404.png) and [reduced-motion phone hero](local-atelier-mobile-reduced.png).

The final captures were visually inspected. The whole landscape glass form remains visible, and the separately composed portrait artwork retains its silhouette. The supplied AP signature has transparent corners and a warm champagne CSS treatment; there is no white image box. The hero, navigation and CIRS support image remain readable. The original CIRS pages are real captures; no generated image is presented as project evidence.

## Checks

- Chromium: 16 new Atelier checks and 24 existing functional/scroll regressions passed, 40 total.
- Firefox: all 16 focused Atelier checks passed.
- Responsive checks passed at 320, 375, 390, 768, 1024 and 1440 CSS pixels. Final recorded scenes had zero horizontal overflow.
- Actual desktop CIRS frame expanded from 345.6 × 220 to 1267.2 × 660 CSS pixels and returned to its starting size when scrolling back.
- The one shared SVG pane changed its path geometry and visible opacity through CIRS, Vallalar, AccuFlow and Studio. [Measured positions and engines](local-atelier-measurements.json) record the states.
- Desktop used GSAP/Lenis; coarse-pointer phone emulation used GSAP with native scroll and no pin. Reduced-motion and simulated low-power devices retained content and skipped smoothing, pinning and the opening title.
- Keyboard menu/Escape, View Work, real project links, quick views, full-case navigation and pin cleanup, About tabs, AP OS and the illustrative AirKart model passed regression checks.
- The mobile touch-target audit found and corrected inherited small controls for project notes, the People perspective, footer AP OS and model range inputs. The focused check passed after correction; a second audit found no visible link, button, summary or input below 44 × 44 CSS pixels.
- The title sequence could be skipped with the keyboard, ran once per session, and dismissed within its bounded interval even with failed logo loading. Unknown routes and unknown project routes showed the branded 404, and Home worked by keyboard. The build contains a separate `404.html` artifact.
- A failed CIRS image produced a usable static fallback. Test-only synthetic video fixtures verified the horizontal filmstrip, accessible player, muted default, no autoplay and playback controls. Those fixtures do not appear in portfolio content.

## Limits and missing material

WebKit could not launch because the cloud host lacks GTK4, Graphene, Harfbuzz ICU, Manette, Hyphen and GLES shared libraries. Safari, physical iPhone/Android devices and a physical laptop were not tested. These recordings are headless cloud browser evidence; they are not a claim of a particular frame rate or real-device performance.

Vallalar photographs and permission-cleared project media have not been supplied. AccuFlow's accurate description, personal contribution, stage and real visuals still need confirmation. Original films, stills and credits for the six named Studio entries are absent, so the default preview has an honest collection index and no fabricated video controls. Contact details remain unsupplied. These content limitations should be resolved before public publication.

The original Netlify evidence screenshots were preserved. Legacy regression captures use `local-regression-*` names.
