# Ananda Priyan — Glass Atelier

This repository contains Ananda's **Glass Atelier portfolio**, live at **https://anandapriyan.vercel.app**. Vercel is connected to this repository's `main` branch for automatic deployments. Verification is recorded in [the deployment notes](docs/vercel-deployment.md). The existing [Netlify site](https://anandapriyan.netlify.app) remains the earlier production version and is preserved separately.

The redesign has four distinct pages: a cinematic Home, substantive Work, a dedicated Studio, and About with Contact. Glass materials connect them; each page has its own scroll and interaction treatment. It preserves the supplied AP signature and uses the original logo asset for a bespoke four-stroke reveal and an interactive light study. Production delivery follows pushes to the established `main` branch. [The refinement review](docs/refinement-review.md) records evidence for the preceding release; the dated checks below record this redesign's validation before publication.

| Route | Experience |
| --- | --- |
| `/` | Amber film, optical title pane, expanding CIRS preview, scroll-scrubbed corridor and three real route previews. |
| `/work` | CIRS, Vallalar and AccuFlow chapters; actual interface atlases; bilingual website study; clearly reconstructed CIRS concept; compact illustrative AirKart experiment. |
| `/studio` | Conceptual cinema atmosphere and six unique programme entries. Five films are available after an explicit Watch action: two Google Drive players and three local native players. CIRSMUN 2026 remains unavailable. |
| `/about` | Exact AP signature interaction, four perspectives linked to actual work, two academic recognitions and the personal contact card. |

The five `/projects/<id>` case-study routes remain. Old homepage chapter hashes resolve to their new page and retain the destination. Four main page entry points are built for static hosting, with genuine HTTP 404 behavior for unknown routes.

## Run locally

Node 24 and npm are required; local and Vercel builds use the same major version.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

The React + TypeScript app uses Vite, GSAP ScrollTrigger and Lenis. `npm run build` creates `dist/`, physical `/work/`, `/studio/`, `/about/` and `/projects/<id>/index.html` entries, and a branded `404.html`. Vercel serves existing files first and sends unknown paths to the branded page with HTTP 404.

Playwright uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when supplied, otherwise system Chromium or Playwright's browser. Optional engines can be run with `AP_TEST_BROWSERS=firefox npm test` or `AP_TEST_BROWSERS=all npm test` after installing their browsers and native dependencies. The current redesign was verified in Chromium; Firefox, WebKit, Safari and physical devices were not verified for this version. WebKit also requires native libraries unavailable on this host.

## Implemented experience

- **Navigation:** a glass chapter index is 76 px tall on desktop, 72 px on tablet and 64 px on phone. A visible active marker follows Work, Studio, About and Contact. Heading and anchor clearance use the measured header height.
- **Hero → CIRS:** capable desktops enter an amber architectural film behind a beveled glass name pane. Its 8-second silent loop has a visible pause control; the complete source frame and required Veo mark stay clear. The pane turns towards the viewer and recedes as the real CIRS image expands. Phones, reduced motion, Save Data, low-power devices and video failure retain the sculptural still. A short reversible desktop pin leads into readable role and Admissions captions. The case study combines Ananda’s first-person project notes with the actual interface: the proposed refresh, team contribution, campus-life focus and Admissions work are described without invented results or page counts.
- **Vallalar:** on capable desktops the real website stays in view while the purpose and contribution pass in two readable stages. Glass depth, progress and a contribution spotlight reverse with scroll. The supplied voluntary Social Media & Technology Head role since 2023 remains accurately attributed. The media is the actual About page from an existing website review preview, with that status visible; it contains no organisation photograph or temporary food-reference image.
- **AccuFlow:** the six-page route assembles into a cooler glass frame around the real pressure-point guide interface. The explanatory stages gain emphasis as they enter, with all text remaining readable. Exact personal responsibilities and lessons remain unconfirmed; no medical effectiveness or product outcomes are claimed.
- **Creative Studio:** the desktop glass screen follows six unique programme entries through forward and reverse scrolling. Radio-keyboard selection takes precedence while focused; phones and reduced motion keep the compact programme. CCK trailer and Farewell video (Farewell AA) retain their verified public Drive previews. Vantara, TED-Ed auditions and CIRS website launch use approved local native players. Vantara and Masquerade trailer are the same film, represented by one entry with a visible alias. Genuine local frames illustrate the films; no Google request occurs until a visitor chooses a Drive film’s Watch action. CCK remains a public trailer export, without a final-cut claim. CIRSMUN 2026 stays unavailable. The Drive loading status and direct fallback remain available, with the empty frame unlocked after eight seconds without claiming the film is ready. All five players require explicit activation; exact production credits are not invented.
- **About/contact:** a named introduction and the existing exact-AP interaction lead into four native interest tabs. Actual CIRS/Vallalar captures, both approved film stills and the AccuFlow prototype make each relevant perspective concrete; the swimming panel stays compact and factual. A finite warm light handoff and image-plane settle respond to manual selection on capable desktops. Reflected glass surfaces carry the personal content into a full contact scene. The swimming section uses the supplied CIRS start and freestyle/breaststroke focus; the swimming award remains removed. AirKart is a compact expandable experiment with its explicitly illustrative model, alongside the existing notebook entry. The owner-confirmed email, [anandapriyan1012@gmail.com](mailto:anandapriyan1012@gmail.com), remains directly accessible. A satin-black personal card with the exact gold AP mark flips when its surface is clicked, tapped or keyboard-activated, with accessible labels and a downloadable vCard; its restrained pointer tilt is disabled for reduced motion, touch and resource-constrained devices.
- **States:** the exact AP signature draws on an opaque black stage at initial entry and every pathname change, including browser Back/Forward. The opening lasts at most 1.6 seconds; reduced motion, saved Motion Off, forced colors and resource-limited settings use a 120 ms static stage. Skip, Escape, Tab and scroll intent dismiss it immediately, without locking page scroll or waiting for media. Same-page anchors do not replay the opening. Unknown routes retain the matching 404 and clear Home action.
- **Pointer:** the warm glass arrow is 21 × 27 CSS pixels and retains the last real pointer position between routes. It follows ordinary page surfaces and links, including native dialog controls, while editing, text selection, media controls, embedded players, touch, reduced motion and forced colors retain the native cursor.
- **Full case studies:** project-tinted glass atmosphere continues into the reading pages, with genuine media, measured reading progress, reversible chapter-edge tracing and restrained desktop media depth. Text remains stationary. Native chapter anchors focus their headings; touch/reduced/resource-limited views stay flat and clear. The actual CIRS Admissions capture has three keyboard/touch image notes, with its controls above the image on phones. Next-project image frames reserve their space before lazy loading.
- **Real interface studies:** eight selectable CIRS/AccuFlow views use 16 dated desktop/phone browser captures; a separate two-language Vallalar study uses four opening captures excluding reference artwork. Exact sources and hashes are in [the atlas manifest](docs/interface-atlas-sources.json) and [the language-study manifest](docs/vallalar-language-sources.json).
- **Reconstructed CIRS concept:** the supplied concept composition has an explicit persistent reconstructed label. A keyboard reveal control and reversible desktop sequence pair it with genuine homepage/Admissions captures. It does not populate historical draft fields or claim an actual early design process. [Provenance](docs/cirs-concept-source.json).
- **Work index:** fine-pointer desktops pair an editorial list with one large glass preview of the actual selected project. Mouse entry or keyboard focus updates the image; it remains selected while crossing to its native link. Phones and coarse pointers retain every original thumbnail. Only the image plane has a brief depth transition, disabled by reduced motion and Motion Off.
- **Page handoffs:** real links connect Work to Studio and each case study to another actual project; semantic navigation remains available throughout.

## Animation and accessibility

`src/animation/useScrollStory.ts` coordinates scroll motion; individual components own bounded interaction effects. `src/content.ts` owns project facts and media. Lenis follows the documented GSAP integration: `autoRaf: false`, one GSAP ticker callback, `lenis.raf(time * 1000)` and Lenis scroll events updating ScrollTrigger. It runs only on capable desktop pointers. `gsap.matchMedia()` selects desktop, phone/tablet and reduced-motion behavior.

Phones and tablets use native scrolling and lighter transitions. Reduced motion and simulated low-power devices skip smoothing, pinning and large motion while retaining readable content. Scoped triggers, ticker callbacks, events, pending frames and Lenis instances are cleaned up on route or motion changes. Images and fonts refresh measurements; direct anchors and browser Back remain available. On capable fine pointers, the approved crystal-arrow shape replaces the pointer only over interactive targets after valid coordinates exist. Its transparent filtered interior and warm bevel stay arrow-shaped. Text, forms, dialogs, touch, reduced motion, forced colors and constrained devices retain native behavior; exit, scroll, keyboard input and cleanup remove the native-hiding gate. There is no separate orb or lens. Navigation uses restrained horizontal direction marks. Chapter reflections settle reversibly on desktop without additional pins or moving body copy.

`src/glass-finish.css` owns the global optical palette and personal/contact surfaces; `src/cinematic-chapters.css` owns the project chapters and compact archive. `src/scroll-scenes.css` supplies enhanced desktop staging; `src/hero-film.css` preserves the full marked video frame and styles its optical foreground. Navigation and Studio styles live beside their components. All override the preceding release's styles in explicit order in `src/main.tsx`.

Route changes synchronously revert the current scroll context before React changes pinned DOM. Browser Back/Forward, case returns and repeated visits are covered by route tests. The corridor uses metadata-aware consolidated video seeks and no additional pin or section height. The Studio room pauses offscreen/when hidden and has a visible pause control. The AP light study uses at most 760 sampled points from the exact logo, stops scheduling frames at rest/offscreen/when hidden, and caps DPR at 1.5.

## Reference choices

The supplied reference briefs informed oversized scroll-reactive typography, an editorial index of real project previews, a clearly active screening selection, tactile glass buttons, bounded pointer response and short depth choreography that settles into readable content. The result keeps Ananda's name, actual work and self-hosted Syne and Instrument Sans fonts under SIL OFL-1.1; their unchanged license notices ship in `public/fonts/`. Upright display lettering replaces the repeated italic treatment.

Third-party identities, portraits, figurines, robots, commercial-font CDN files, pricing, testimonials, unrelated GIF/video walls, long empty scroll tracks and a heavy fluid/particle renderer were excluded. The exact AP alpha supplies the interactive material instead. One bounded Canvas2D signature study, shared glass reflections and finite CSS/GSAP depth provide the material system without a second heavy 3D renderer. Real page and case-study handoffs give the cinematic transitions a concrete destination. Conceptual Flow architecture and cinema footage are atmospheric layers with device-aware fallbacks, separate from the user's actual film collection.

The [local contact-control comparison](docs/hero-ui-comparison.html) previews a functional UI overlap at the user's request. It toggles against the original hero, leaves the source video bytes intact and is not included in the built portfolio. The default hero keeps the original attribution corner clear.

## Content and assets

Edit `src/content.ts`, and put approved assets in `public/media/`:

- `projectAssets`: actual previews, phone-specific sources, provenance captions and the separate CIRS Admissions capture. Sources are recorded in [docs/cirs-source.md](docs/cirs-source.md) and [docs/project-source-evidence.md](docs/project-source-evidence.md).
- `draftUrl`: genuine process material; a missing value keeps the process-reveal control hidden.
- `beforeUrl` / `afterUrl`: a genuine matching early/final pair; both are required for comparison.
- `creativeMedia`: native playback requires an approved video and actual poster, together with either confirmed contribution credits or explicit approval to show the owner’s supplied film. The three newly approved native films set `nativePlaybackApproved: true` while their exact credits remain `null`; no credit is fabricated to unlock playback. A separately verified `embedUrl` may use the canonical Google Drive file preview endpoint and loads only after explicit Watch activation.
- `directorsCut`: real montage and credits are required before its action appears.
- `siteContent.contact`: verified public email/social routes; no disconnected form is substituted.

### Current film catalogue

The six unique entries are CCK trailer, Farewell video, Vantara, TED-Ed auditions, CIRS website launch and CIRSMUN 2026. Five are playable; CIRSMUN alone remains unavailable. Vantara visibly retains “Masquerade trailer” as an alias, rather than creating a second programme entry. Its complete approved trailer includes the original black sections without trimming. TED-Ed auditions uses the approved **FINAL export, 0:32**, rather than the April export. CIRS website launch is the approved **0:38** film.

The three local native films and their real posters are recorded in [the approved native-film manifest](docs/approved-native-films.json). That manifest records the source and delivery evidence; the earlier two-film still manifest stays intact. Missing exact production credits remain `null`. Local film browsing does not contact Google, and the native players mount only after Watch. The two Drive players retain their canonical preview URLs, privacy settings and direct fallback links.

Actual CIRS, Vallalar website and AccuFlow prototype captures are now available. The public prototype brands itself **AcuFlow**; the portfolio retains the owner's project name **AccuFlow**. See the source notes for that distinction and the scope of each capture.

Documentary Vallalar photographs, concrete social-media examples, the CIRSMUN 2026 film, further approved original stills and exact contribution credits, genuine process drafts and public certificate files still need to be supplied. CIRS and AirKart purpose and contributions now use the owner’s project notes; specific personal reflections and AccuFlow’s exact contribution still need confirmation. Unanswered reflections and internal publication checklists are omitted from the public case studies. No generated image is presented as project evidence, and Crossroads is not attributed to Ananda.

## Review and handoff

The fifth audit cycle links About’s four perspectives to actual work, keeps the AP interaction and contact card, and fixes motion-on case-return stability and AirKart keyboard focus. The production build and all 188 Chromium checks passed, along with independent normal-motion return checks. The [fifth-cycle review](docs/audit-cycle-five.md) records evidence and scope.

The fourth audit cycle enlarges real Work previews, adds actual CCK/Farewell frames and improves the initial Drive loading state with an always-available fallback. The production build, all 171 Chromium checks and compiled 8-route/25-feature review passed. The [fourth-cycle review](docs/audit-cycle-four.md) records the source evidence and verification limits.

The third audit cycle adds the actual CIRS Admissions image tour, genuine local CCK still, Contact/hash keyboard focus, consistent case cursor and stable lazy-image frames. The production build, all 139 Chromium checks and compiled 8-route/18-feature review passed. Short excerpts of both real Drive films also decoded on desktop and simulated phone. The [third-cycle review](docs/audit-cycle-three.md) records scope and limits.

The [sixth-cycle review](docs/audit-cycle-six.md) records the every-page opaque AP opening, smaller persistent pointer, three approved native films and film-strip keyboard correction. Its verification record distinguishes the broad regression run, updated cursor expectation, final related checks and atomic dialog/opening handoff.

The ongoing audit cycle adds the approved glass arrow, surface-click card, exact-logo drawing sequence, stronger source-based copy, case-reading motion and keyboard/new-tab navigation fixes. The production build, 111-test combined suite, two subsequent pointer regressions and compiled desktop/phone checks passed. The [audit-cycle review](docs/audit-cycle-two.md) records this validation before publication.

This refinement adds the personal card, new typography, shorter Work pacing with verified project introductions, and two click-to-play Drive films. Production delivery follows the established GitHub `main` → Vercel workflow; dated local checks record validation before publication. The preceding release was `de73e36`. The refinement passed the production build, all 88 Chromium tests and compiled desktop/phone checks. See the [card/type/film review](docs/identity-type-film-review.md) for previews, scope and evidence.

The local redesign passed the production build and all 80 Chromium tests on 4 November 2026. Checks cover 320–1440 px layouts, native phone scrolling, forward/reverse scene progress, actual video decoding and pause controls, keyboard operation, reduced motion and resource fallbacks, route cleanup, browser history and fixture-only original-film playback. The final compiled build also passed direct desktop/mobile visits to all four pages and Work → CIRS → Work navigation with no browser errors or horizontal overflow. [Measured checks](docs/cinematic-redesign-checks.json) and [compiled-build evidence](docs/compiled-preview-checks.json) record the scope and limits.

Current desktop captures: [Home](docs/portfolio-home-1440.png), [Work](docs/portfolio-work-1440.png), [Studio](docs/portfolio-studio-1440.png) and [About](docs/portfolio-about-1440.png). Phone captures: [Home](docs/portfolio-home-390.png), [Work](docs/portfolio-work-390.png), [Studio](docs/portfolio-studio-390.png) and [About](docs/portfolio-about-390.png). Additional chapter captures remain alongside them. These captures record validation before publication; the GitHub Vercel status for the matching commit identifies the deployed release.

The [refinement review](docs/refinement-review.md) records the preceding release. Earlier recordings remain in the [Atelier review](docs/local-atelier-review.md). Compiled ZIP bundles are local review artifacts and are excluded from this source repository. A [read-only preservation check](docs/local-atelier-live-preservation.json) confirmed the Netlify HTML matched the saved production baseline.

The current publication target is Vercel linked to this GitHub repository. The [earlier Netlify deployment record](docs/netlify-deployment.md) describes the separate existing production version; it must remain unchanged.
