# Ananda Priyan — Glass Atelier

This repository contains Ananda's **Glass Atelier portfolio**, live at **https://anandapriyan.vercel.app**. Vercel is connected to this repository's `main` branch for automatic deployments. Verification is recorded in [the deployment notes](docs/vercel-deployment.md). The existing [Netlify site](https://anandapriyan.netlify.app) remains the earlier production version and is preserved separately.

The redesign has four distinct pages: a cinematic Home, substantive Work, a dedicated Studio, and About with Contact. Glass materials connect them; each page has its own scroll and interaction treatment. It preserves the supplied AP signature and uses the original logo asset for a brief coded reveal and an interactive light study. Production delivery follows pushes to the established `main` branch. [The refinement review](docs/refinement-review.md) records evidence for the preceding release; the dated checks below record this redesign's validation before publication.

| Route | Experience |
| --- | --- |
| `/` | Amber film, optical title pane, expanding CIRS preview, scroll-scrubbed corridor and three real route previews. |
| `/work` | CIRS, Vallalar and AccuFlow chapters; actual interface atlases; bilingual website study; clearly reconstructed CIRS concept; compact illustrative AirKart experiment. |
| `/studio` | Conceptual cinema atmosphere and a six-title keyboard/scroll programme. Original film playback remains gated on verified media and credits. |
| `/about` | Original AP signature interaction, personal perspectives, two academic recognitions and the verified email contact. |

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
- **Hero → CIRS:** capable desktops enter an amber architectural film behind a beveled glass name pane. Its 8-second silent loop has a visible pause control; the complete source frame and required Veo mark stay clear. The pane turns towards the viewer and recedes as the real CIRS image expands. Phones, reduced motion, Save Data, low-power devices and video failure retain the sculptural still. A short reversible desktop pin leads into readable role and Admissions captions. The case study uses the supplied contribution and observable interface without inventing design decisions or lessons.
- **Vallalar:** on capable desktops the real website stays in view while the purpose and contribution pass in two readable stages. Glass depth, progress and a contribution spotlight reverse with scroll. The supplied voluntary Social Media & Technology Head role since 2023 remains accurately attributed. The media is the actual About page from an existing website review preview, with that status visible; it contains no organisation photograph or temporary food-reference image.
- **AccuFlow:** the six-page route assembles into a cooler glass frame around the real pressure-point guide interface. The explanatory stages gain emphasis as they enter, with all text remaining readable. Exact personal responsibilities and lessons remain unconfirmed; no medical effectiveness or product outcomes are claimed.
- **Creative Studio:** the desktop glass screen remains in view and follows six actual programme titles through forward and reverse scrolling. Radio-keyboard selection takes precedence while focused; phones and reduced motion keep the compact programme. Original films, stills and confirmed credits are still absent. A private, visually unverified Drive candidate is not embedded. The ready-only filmstrip and muted explicit player activate when all required assets and credits are present.
- **About/contact:** reflected glass surfaces carry the personal content into a full contact scene. Swimming remains an interest; the swimming award has been removed everywhere. AirKart is a compact expandable experiment with its explicitly illustrative model, alongside the existing notebook entry. The owner-confirmed email, [anandapriyan1012@gmail.com](mailto:anandapriyan1012@gmail.com), is a direct contact destination.
- **States:** a short, skippable AP/glass title runs once per session without blocking access. Unknown routes show a matching 404 with a clear Home action.
- **Full case studies:** project-tinted glass atmosphere continues into the reading pages, with genuine media, a sticky glass header, clear chapter anchors and keyboard-safe spacing.
- **Real interface studies:** eight selectable CIRS/AccuFlow views use 16 dated desktop/phone browser captures; a separate two-language Vallalar study uses four opening captures excluding reference artwork. Exact sources and hashes are in [the atlas manifest](docs/interface-atlas-sources.json) and [the language-study manifest](docs/vallalar-language-sources.json).
- **Reconstructed CIRS concept:** the supplied concept composition has an explicit persistent reconstructed label. A keyboard reveal control and reversible desktop sequence pair it with genuine homepage/Admissions captures. It does not populate historical draft fields or claim an actual early design process. [Provenance](docs/cirs-concept-source.json).
- **Page handoffs:** real links connect Work to Studio and each case study to another actual project; semantic navigation remains available throughout.

## Animation and accessibility

`src/animation/useScrollStory.ts` owns the animation; `src/content.ts` owns project facts and media. Lenis follows the documented GSAP integration: `autoRaf: false`, one GSAP ticker callback, `lenis.raf(time * 1000)` and Lenis scroll events updating ScrollTrigger. It runs only on capable desktop pointers. `gsap.matchMedia()` selects desktop, phone/tablet and reduced-motion behavior.

Phones and tablets use native scrolling and lighter transitions. Reduced motion and simulated low-power devices skip smoothing, pinning and large motion while retaining readable content. Scoped triggers, ticker callbacks, events, pending frames and Lenis instances are cleaned up on route or motion changes. Images and fonts refresh measurements; direct anchors and browser Back remain available. A small warm optical ring appears only over interactive media while retaining the native pointer; it is disabled on touch and reduced motion. Chapter reflections settle reversibly on desktop without additional pins or moving body copy.

`src/glass-finish.css` owns the global optical palette and personal/contact surfaces; `src/cinematic-chapters.css` owns the project chapters and compact archive. `src/scroll-scenes.css` supplies enhanced desktop staging; `src/hero-film.css` preserves the full marked video frame and styles its optical foreground. Navigation and Studio styles live beside their components. All override the preceding release's styles in explicit order in `src/main.tsx`.

Route changes synchronously revert the current scroll context before React changes pinned DOM. Browser Back/Forward, case returns and repeated visits are covered by route tests. The corridor uses metadata-aware consolidated video seeks and no additional pin or section height. The Studio room pauses offscreen/when hidden and has a visible pause control. The AP light study uses at most 760 sampled points from the exact logo, stops scheduling frames at rest/offscreen/when hidden, and caps DPR at 1.5.

## Reference choices

The supplied reference briefs informed oversized scroll-reactive typography, an editorial index of real project previews, a clearly active screening selection, tactile glass buttons, bounded pointer response and short depth choreography that settles into readable content. The result keeps Ananda's name, actual work and existing open-source font packages.

Third-party identities, portraits, figurines, robots, commercial-font CDN files, pricing, testimonials, unrelated GIF/video walls, long empty scroll tracks and a heavy fluid/particle renderer were excluded. The exact AP alpha supplies the interactive material instead. One bounded Canvas2D signature study, shared glass reflections and finite CSS/GSAP depth provide the material system without a second heavy 3D renderer. Real page and case-study handoffs give the cinematic transitions a concrete destination. Conceptual Flow architecture and cinema footage are atmospheric layers with device-aware fallbacks, separate from the user's actual film collection.

The [local contact-control comparison](docs/hero-ui-comparison.html) previews a functional UI overlap at the user's request. It toggles against the original hero, leaves the source video bytes intact and is not included in the built portfolio. The default hero keeps the original attribution corner clear.

## Content and assets

Edit `src/content.ts`, and put approved assets in `public/media/`:

- `projectAssets`: actual previews, phone-specific sources, provenance captions and the separate CIRS Admissions capture. Sources are recorded in [docs/cirs-source.md](docs/cirs-source.md) and [docs/project-source-evidence.md](docs/project-source-evidence.md).
- `draftUrl`: genuine process material; a missing value keeps the process-reveal control hidden.
- `beforeUrl` / `afterUrl`: a genuine matching early/final pair; both are required for comparison.
- `creativeMedia`: approved direct video URL, actual poster URL and confirmed contribution credits are all required for playback.
- `directorsCut`: real montage and credits are required before its action appears.
- `siteContent.contact`: verified public email/social routes; no disconnected form is substituted.

Actual CIRS, Vallalar website and AccuFlow prototype captures are now available. The public prototype brands itself **AcuFlow**; the portfolio retains the owner's project name **AccuFlow**. See the source notes for that distinction and the scope of each capture.

Documentary Vallalar photographs, concrete social-media examples, original film files/stills/credits, genuine process drafts and public certificate files still need to be supplied. CIRS personal decisions and lessons, and AccuFlow's exact personal contribution and reflection, still need confirmation. Unanswered reflections and internal publication checklists are omitted from the public case studies. No generated image is presented as project evidence, and Crossroads is not attributed to Ananda.

## Review and handoff

The local redesign passed the production build and all 80 Chromium tests on 4 November 2026. Checks cover 320–1440 px layouts, native phone scrolling, forward/reverse scene progress, actual video decoding and pause controls, keyboard operation, reduced motion and resource fallbacks, route cleanup, browser history and fixture-only original-film playback. The final compiled build also passed direct desktop/mobile visits to all four pages and Work → CIRS → Work navigation with no browser errors or horizontal overflow. [Measured checks](docs/cinematic-redesign-checks.json) and [compiled-build evidence](docs/compiled-preview-checks.json) record the scope and limits.

Current desktop captures: [Home](docs/portfolio-home-1440.png), [Work](docs/portfolio-work-1440.png), [Studio](docs/portfolio-studio-1440.png) and [About](docs/portfolio-about-1440.png). Phone captures: [Home](docs/portfolio-home-390.png), [Work](docs/portfolio-work-390.png), [Studio](docs/portfolio-studio-390.png) and [About](docs/portfolio-about-390.png). Additional chapter captures remain alongside them. These captures record validation before publication; the GitHub Vercel status for the matching commit identifies the deployed release.

The [refinement review](docs/refinement-review.md) records the preceding release. Earlier recordings remain in the [Atelier review](docs/local-atelier-review.md). Compiled ZIP bundles are local review artifacts and are excluded from this source repository. A [read-only preservation check](docs/local-atelier-live-preservation.json) confirmed the Netlify HTML matched the saved production baseline.

The current publication target is Vercel linked to this GitHub repository. The [earlier Netlify deployment record](docs/netlify-deployment.md) describes the separate existing production version; it must remain unchanged.
