# Hashed build-asset cache policy

This change adds a one-year immutable browser cache only to this Vite build's
hash-shaped `/assets/` JavaScript, CSS and WOFF/WOFF2 paths. That namespace is
reserved for generated output; the build check rejects a `public/assets` folder.
Vite changes these filenames when their emitted content changes.

The existing filesystem handler and final `/404.html` rewrite remain in their
original order. The asset-header rule uses `continue: true`, so it cannot replace
file serving or turn an unknown path into an app response. The final 404 rule
explicitly restores `public, max-age=0, must-revalidate`, including a missing URL
that happens to look like a hashed asset. HTML, page routes, mutable `/media/`,
unhashed `/fonts/`, licenses and the excluded local comparison gain no immutable
policy. No media URLs, provider settings, permissions or dependencies change.

The match deliberately recognizes the current eight-character Vite/Rollup hash
format. If build output naming changes, the check fails for review rather than
silently extending immutable caching to a broader path.

Validation: `npm run build`, followed by
`node --test scripts/check-asset-cache.mjs`. These are configuration/build checks,
not a claim that local Vite preview emulates Vercel response headers. After the
GitHub/Vercel release, inspect a real emitted JS/CSS/font URL, HTML, mutable media,
an unknown page, an unknown hash-shaped asset and the local-comparison URL. The
asset should be immutable; both error responses must remain genuine HTTP 404
with revalidation. Browser-cache freshness is expected; a CDN HIT is not required.

Current official references, checked 4 November 2026:

- [Vercel route headers and continuation](https://vercel.com/docs/project-configuration/vercel-json#routes)
  document applying response headers while continuing normal routing.
- [Vercel Cache-Control guidance](https://vercel.com/docs/caching/cache-control-headers)
  recommends a year plus `immutable` for content-hashed JS, CSS and fonts.

This note describes the configuration and local validation. The release record
separately confirms deployment and public response headers.
