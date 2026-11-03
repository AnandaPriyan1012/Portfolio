# CIRS public website screenshot sources

These screenshots were captured from the live public CIRS website on 3 November 2026. The user supplied the website URL; these are newly captured public-page screenshots, not user-uploaded images. They document what the site displayed at capture time, not a claim about who created any particular design or page.

| File | Source URL | Viewport | Capture time (UTC) |
| --- | --- | --- | --- |
| `public/media/cirs-home-desktop.webp` | https://cirschool.org/ | 1440 × 1000 | 2026-11-03T08:11:40.200Z |
| `public/media/cirs-admissions.webp` | https://cirschool.org/admissions.html | 1440 × 1000 | 2026-11-03T08:12:57.646Z |
| `public/media/cirs-home-mobile.webp` | https://cirschool.org/ | 390 × 844 | 2026-11-03T08:12:11.034Z |

## Validation and capture method

- Chromium `/usr/bin/chromium` controlled through Playwright, using the inherited HTTPS proxy. Normal TLS verification remained enabled; no certificate or network-error bypass was used.
- The homepage returned HTTP 200 and the title “Chinmaya International Residential School — Siruvani, Coimbatore”. Its visible heading was “Rooted in Values! Ready for the World.”
- The Admissions URL was obtained from the homepage’s actual “Explore Admissions” navigation link. It returned HTTP 200 with title “Admissions” and visible heading “Admissions Guide.” School branding was checked in the actual page body.
- Both pages were visually inspected to verify the real website, rather than a network error, access-denied page or challenge screen.
- On the Admissions page, the public announcement was dismissed through its own “Close announcement” button so the page design could be captured. The site’s announcement stated that the admissions portal was closed; the screenshot makes no claim that applications were open. No website content was rewritten.
- Viewport captures used device scale factor 1 and reduced-motion rendering. Screenshots were encoded as WebP at Pillow quality 72.

## Scope

The assets show public website appearance on the recorded date. They do not verify project-contribution scope, school claims, current admissions availability, traffic or outcomes. Re-capture if the live design changes.
