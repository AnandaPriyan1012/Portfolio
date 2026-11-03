# Production deployment

- Live site: https://anandapriyan.netlify.app
- Owner: the user's authorized Netlify account.
- Site ID: `c5ce7d48-5f19-4500-9d7f-e4db18a49f4c`.
- Production deploy: `6ae9a8c583e2688ed83a6773`.
- Deploy details: https://app.netlify.com/projects/anandapriyan/deploys/6ae9a8c583e2688ed83a6773
- Authentication: Netlify's supported CLI OAuth ticket flow. No personal token or login credential is stored in the app or this record.

The initially anonymous review site was claimed into the user's account and renamed to the requested name. The production build was then uploaded using an authenticated deploy. The named production site is owned by the user; it is not an expiring anonymous preview.

## Verified against the actual HTTPS site

- Homepage: HTTP 200, real CIRS image decoded, GSAP/Lenis active.
- Desktop actual wheel scrolling: CIRS image width grew from 748.8px to 1267.2px.
- `/projects/cirs/`: HTTP 200, correct case-study heading and real Admissions image.
- `/projects/accuflow/`: HTTP 200, correct case-study heading.
- Phone at 390px: decoded the real mobile CIRS capture; document width exactly 390px, working open/close menu, View Work within the first screen.
- Unsupplied film gallery stays hidden; no browser page errors in the live checks.
- Local production build and all 24 functional checks passed; the relevant case-route checks were rerun after adding physical entry points for static hosts.

Live captures: `netlify-live-desktop.png` and `netlify-live-mobile.png`.

## Remaining personal content

Vallalar permission-cleared visuals, actual CIRS design decisions and earlier versions, AccuFlow's verified details, original films with confirmed credits, certificates and public contact routes still require the owner's input. No facts were inferred from the Netlify account's private profile.

## Cloud draft note

An optional `NETLIFY_AUTH_TOKEN` personal requirement was added before OAuth became available. It remains an unapplied cloud-environment draft; deployment did not use it. That alternative requires reviewing/saving the environment settings and publishing the environment to apply it. OAuth already completed deployment, so applying that token alternative is unnecessary. No cloud-environment publication was performed.
