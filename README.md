# Ananda Priyan — Glass Atelier

This repository contains Ananda's **Glass Atelier portfolio**, live at **https://anandapriyan.vercel.app**. Vercel is connected to this repository's `main` branch for automatic deployments. Verification is recorded in [the deployment notes](docs/vercel-deployment.md). The existing [Netlify site](https://anandapriyan.netlify.app) remains the earlier production version and is preserved separately.

The preview uses the supplied AP brush signature, a full smoked-glass hero, the chosen thin Film Strip navigation and an implemented scroll story. [Review screenshots, actual scroll recordings and test results](docs/local-atelier-review.md) show the current desktop and phone designs. [Design and asset notes](docs/glass-atelier-design.md) explain the visual treatment and remaining content needs.

## Run locally

Node 24 and npm are required; local and Vercel builds use the same major version.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

The React + TypeScript app uses Vite, GSAP ScrollTrigger and Lenis. `npm run build` creates `dist/`, physical `/projects/<id>/index.html` entries and a branded `404.html`. Unknown Netlify paths retain a genuine 404 response; a wildcard SPA rewrite is not required for the generated case-study routes.

Playwright uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when supplied, otherwise system Chromium or Playwright's browser. Optional engines can be run with `AP_TEST_BROWSERS=firefox npm test` or `AP_TEST_BROWSERS=all npm test` after installing their browsers and native dependencies. This cloud host runs Chromium and Firefox; WebKit is blocked by missing native libraries. Safari and physical devices have not been tested.

## Implemented experience

- **Hero → CIRS:** the full glass sculpture introduces Ananda, with a real CIRS preview visible in the opening. On capable desktop devices, a short scroll-linked pin expands the screenshot into an immersive project frame and reveals readable role and Admissions captions. Scrolling back reverses the sequence.
- **Vallalar:** the shared glass surface changes shape and warmth around a substantial community story. Ananda's supplied voluntary Social Media & Technology Head role since 2023 is included. Permission-cleared imagery remains unsupplied.
- **AccuFlow:** a restrained teal treatment, staged information and product-frame outline support a major case study. Unconfirmed descriptions, features, stage and results are not invented.
- **Creative Studio:** the local draft shows a collection index for the six requested works. A real film needs an approved video, actual poster and confirmed credits before its play control appears. The conditional desktop filmstrip and accessible muted player are implemented; mobile uses a normal vertical gallery.
- **About/contact:** readable personal content, swimming and supplied achievement scope end the story. AirKart remains a secondary student project with an explicitly illustrative model. Contact actions need verified contact details.
- **States:** a short, skippable AP/glass title runs once per session without blocking access. Unknown routes show a matching 404 with a clear Home action.

## Animation and accessibility

`src/animation/useScrollStory.ts` owns the animation; `src/content.ts` owns project facts and media. Lenis follows the documented GSAP integration: `autoRaf: false`, one GSAP ticker callback, `lenis.raf(time * 1000)` and Lenis scroll events updating ScrollTrigger. It runs only on capable desktop pointers. `gsap.matchMedia()` selects desktop, phone/tablet and reduced-motion behavior.

Phones and tablets use native scrolling and lighter transitions. Reduced motion and simulated low-power devices skip smoothing, pinning and large motion while retaining readable content. Scoped triggers, ticker callbacks, events, pending frames and Lenis instances are cleaned up on route or motion changes. Images and fonts refresh measurements; direct anchors and browser Back remain available. The optional glass cursor keeps the normal cursor and is disabled on touch and reduced motion.

## Content and assets

Edit `src/content.ts`, and put approved assets in `public/media/`:

- `projectAssets`: genuine previews, phone-specific sources and the separate CIRS Admissions capture. CIRS provenance is recorded in [docs/cirs-source.md](docs/cirs-source.md).
- `draftUrl`: genuine process material; a missing value keeps the process-reveal control hidden.
- `beforeUrl` / `afterUrl`: a genuine matching early/final pair; both are required for comparison.
- `creativeMedia`: approved direct video URL, actual poster URL and confirmed contribution credits are all required for playback.
- `directorsCut`: real montage and credits are required before its action appears.
- `siteContent.contact`: verified public email/social routes; no disconnected form is substituted.

Vallalar imagery and concrete digital-work examples, AccuFlow facts and visuals, film files/stills/credits, original drafts, public certificate files and contact details still need to be supplied or confirmed. See the content checklists and [review limitations](docs/local-atelier-review.md#limits-and-missing-material). No generated image is presented as a project screenshot, community photograph or film still. Crossroads is not attributed to Ananda.

## Review and handoff

The [review package](docs/local-atelier-review.md) contains desktop and phone captures, forward/reverse scroll recordings, responsive checks, keyboard/media-failure coverage and browser limitations. Compiled ZIP bundles are local review artifacts and are excluded from this source repository. A [read-only preservation check](docs/local-atelier-live-preservation.json) confirmed the Netlify HTML still matched the saved production baseline.

A private ChatGPT Sites version was requested earlier, but this session has no tool for creating a Sites draft. No Sites version has been created. The current publication target is Vercel linked to this GitHub repository. The [earlier Netlify deployment record](docs/netlify-deployment.md) describes the separate existing production version; it must remain unchanged.
