# Ananda Priyan — Glass Atelier

This repository contains Ananda's **Glass Atelier portfolio**, live at **https://anandapriyan.vercel.app**. Vercel is connected to this repository's `main` branch for automatic deployments. Verification is recorded in [the deployment notes](docs/vercel-deployment.md). The existing [Netlify site](https://anandapriyan.netlify.app) remains the earlier production version and is preserved separately.

The site uses the supplied AP brush signature, a full smoked-glass hero, the chosen thin Film Strip navigation and an implemented scroll story. The latest refinement adds a slimmer active-section header, a continuous hero-to-CIRS transition, distinct material treatments and actual Vallalar website and AccuFlow prototype captures. See [the refinement review](docs/refinement-review.md) for current evidence and [design and asset notes](docs/glass-atelier-design.md) for the visual treatment and content limits. The [earlier Atelier review](docs/local-atelier-review.md) preserves the previous captures and checks.

## Run locally

Node 24 and npm are required; local and Vercel builds use the same major version.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

The React + TypeScript app uses Vite, GSAP ScrollTrigger and Lenis. `npm run build` creates `dist/`, physical `/projects/<id>/index.html` entries and a branded `404.html`. Vercel serves existing files first and sends unknown paths to the branded page with HTTP 404.

Playwright uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when supplied, otherwise system Chromium or Playwright's browser. Optional engines can be run with `AP_TEST_BROWSERS=firefox npm test` or `AP_TEST_BROWSERS=all npm test` after installing their browsers and native dependencies. This cloud host runs Chromium and Firefox; WebKit is blocked by missing native libraries. Safari and physical devices have not been tested.

## Implemented experience

- **Navigation:** the Film Strip is 76 px tall on desktop, 72 px on tablet and 64 px on phone. A visible active marker follows Work, Studio, About and Contact. Heading and anchor clearance use the measured header height.
- **Hero → CIRS:** the full glass sculpture introduces Ananda, with a real CIRS preview visible in the opening. The screenshot begins expanding as the desktop scroll scene starts, while the name remains until the image reaches the central composition. A short, reversible pin leads into readable role and Admissions captions. The case study covers the supplied contribution and the observable Admissions interface; it does not invent personal design decisions or lessons.
- **Vallalar:** warm layered edges and a lateral glass transition surround the substantial community story and supplied voluntary Social Media & Technology Head role since 2023. The media shows the actual About page from an existing website review preview. It contains no organisation photograph or temporary food-reference image.
- **AccuFlow:** teal light, a traced frame and staged information support the actual pressure-point guide interface from a publicly viewable internal website prototype. The case study describes the six-page product website and its interaction scope. Exact personal responsibilities and lessons remain unconfirmed; no medical effectiveness or product outcomes are claimed.
- **Creative Studio:** a concise collection index names the six requested works without repeating an upload notice on every row. Original films, stills and confirmed credits are still absent. The conditional desktop filmstrip and accessible muted player activate when all three are present; mobile uses a normal vertical gallery.
- **About/contact:** readable personal content, swimming and supplied achievement scope end the story. AirKart remains a secondary student project with an explicitly illustrative model. The owner-confirmed email, [anandapriyan1012@gmail.com](mailto:anandapriyan1012@gmail.com), is a direct contact destination.
- **States:** a short, skippable AP/glass title runs once per session without blocking access. Unknown routes show a matching 404 with a clear Home action.

## Animation and accessibility

`src/animation/useScrollStory.ts` owns the animation; `src/content.ts` owns project facts and media. Lenis follows the documented GSAP integration: `autoRaf: false`, one GSAP ticker callback, `lenis.raf(time * 1000)` and Lenis scroll events updating ScrollTrigger. It runs only on capable desktop pointers. `gsap.matchMedia()` selects desktop, phone/tablet and reduced-motion behavior.

Phones and tablets use native scrolling and lighter transitions. Reduced motion and simulated low-power devices skip smoothing, pinning and large motion while retaining readable content. Scoped triggers, ticker callbacks, events, pending frames and Lenis instances are cleaned up on route or motion changes. Images and fonts refresh measurements; direct anchors and browser Back remain available. The optional glass cursor keeps the normal cursor and is disabled on touch and reduced motion.

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

The [refinement review](docs/refinement-review.md) records the latest desktop and phone captures, transition and header checks, responsive behavior and browser limitations. Earlier recordings and regression evidence remain in the [Atelier review](docs/local-atelier-review.md). Compiled ZIP bundles are local review artifacts and are excluded from this source repository. A [read-only preservation check](docs/local-atelier-live-preservation.json) confirmed the Netlify HTML still matched the saved production baseline.

A private ChatGPT Sites version was requested earlier, but this session has no tool for creating a Sites draft. No Sites version has been created. The current publication target is Vercel linked to this GitHub repository. The [earlier Netlify deployment record](docs/netlify-deployment.md) describes the separate existing production version; it must remain unchanged.
