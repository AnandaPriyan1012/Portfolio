# GitHub and Vercel publication

The owner authorized publication of the reviewed Glass Atelier source to GitHub and hosting through Vercel linked to the repository.

- Repository: https://github.com/AnandaPriyan1012/Portfolio
- Production branch: `main`.
- Framework: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Deployment configuration: `vercel.json`.

The build generates the homepage, five physical project entry points and a branded `404.html`. Vercel serves existing files first and routes unknown URLs to the branded page with HTTP 404.

Vercel authentication is pending in this environment. A GitHub-connected Vercel project and a successful public deployment have not yet been verified. This record must be updated after authentication and deployment; it is not a claim of a live Vercel site.

The existing Netlify site is preserved. A read-only Netlify inspection found no connected repository or build branch, and no Netlify settings or deployments were changed.

The local production build passes. Existing browser validation and missing personal assets are documented in `local-atelier-review.md`. Provider credential directories, build output, local environment files and compiled ZIP bundles are excluded by `.gitignore`.
