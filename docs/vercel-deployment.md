# GitHub and Vercel publication

The reviewed Glass Atelier source is published to GitHub and hosted on Vercel, following the owner's authorization.

- Repository: https://github.com/AnandaPriyan1012/Portfolio
- Live site: https://anandapriyan.vercel.app
- Vercel project: `aps-projects-d0ed6e5a/anandapriyan`.
- Production branch: `main`.
- Framework: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Node version: `24.x`, matching the local build.
- Deployment configuration: `vercel.json`.

The build generates the homepage, five physical project entry points and a branded `404.html`. Vercel serves existing files first and routes unknown URLs to the branded page with HTTP 404.

The first production deployment was `dpl_2cQnQEfUoqokDbbSTsVGTAwPJn5k`, created from source commit `3248e5a` and verified Ready. The public production alias works without authentication. Vercel's API confirms the GitHub link is `AnandaPriyan1012/Portfolio` with production branch `main`. The owner completed Vercel sign-in and installed the Vercel GitHub app through the official flows. No provider credentials are stored in the repository.

## Live acceptance

- Homepage, `/projects/cirs/` and `/projects/accuflow/`: HTTP 200.
- Unknown page and project paths: the branded page with genuine HTTP 404.
- Desktop at 1440px: the actual AP signature, landscape glass and real CIRS capture decoded; no sideways overflow. GSAP/Lenis were active. Wheel scrolling expanded the CIRS frame from 345.59 × 220 to 1267.19 × 660 CSS pixels, then reversed it to the original bounds. View Work navigated to the project.
- Phone emulation at 390px: the distinct portrait glass and mobile CIRS sources decoded; native scrolling, no pins, no sideways overflow. Menu, Escape and View Work worked.
- No uncaught browser errors occurred in the live checks. The screenshots were visually inspected.

Evidence: [desktop](vercel-live-desktop.png), [expanded CIRS](vercel-live-desktop-expanded.png), [phone](vercel-live-mobile.png), [404](vercel-live-404.png) and [measured checks](vercel-live-acceptance.json). These are cloud Chromium checks; physical devices and Safari remain untested.

The existing Netlify site is preserved. A read-only Netlify inspection found no connected repository or build branch, and no Netlify settings or deployments were changed. Its public HTML still matched the saved production SHA-256 after GitHub publication and Vercel deployment.

## Scroll and content refinement

The latest revision uses a 76px desktop / 72px tablet / 64px phone Film Strip header, measured heading clearance and active-section navigation. The CIRS frame begins moving immediately and occupies the centre before the name retires. Warm layered Vallalar surfaces, a cooler AccuFlow frame and dark Studio film rails continue the material treatment beyond the hero.

Actual public Vallalar website-preview and AccuFlow internal-prototype captures replace their reserved visuals. The captures, prototype stages and limits are documented in [project-source-evidence.md](project-source-evidence.md). The owner-confirmed public email is a direct `mailto:` destination. CIRS uses the supplied contribution and observed Admissions structure; personal decisions or lessons were not fabricated. Films, documentary community photos and exact creative credits remain unavailable.

Latest screenshots, scroll samples, browser checks and limits are in [refinement-review.md](refinement-review.md). The earlier evidence above records the first deployment rather than these refinements.

The local production build passes. Provider credential directories, build output, local environment files and compiled ZIP bundles are excluded by `.gitignore`.
