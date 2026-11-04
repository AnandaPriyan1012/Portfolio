# Personal card, typography and project pacing review

This document records the refinement’s validation before publication, based on `de73e36`. Production delivery uses `AnandaPriyan1012/Portfolio` → `main` → Vercel. The matching commit’s GitHub Vercel check identifies the deployed release. No provider settings or Drive permissions were changed.

## Audit and changes

Fresh live contact checks passed at 1440, 390 and 320px with no overflow or browser errors. Desktop had substantial unused space beside the invitation, which is now occupied by an original satin-black personal card with gold edges and the exact AP signature. The existing interactive signature study remains in the About opening.

The card turns through an explicit keyboard/touch button. Its contact side contains the verified email, which also remains accessible outside the card. Save contact downloads a vCard containing Ananda’s name, confirmed email and public portfolio URL. Pointer tilt is shallow and event-driven, with no continuous frame loop; touch, reduced motion, motion off and constrained devices retain the usable card without tilt. The design contains no payment details or third-party issuer branding.

Previews: [desktop signature side](identity-card-desktop.png), [contact side](identity-card-contact-side.png), [phone](identity-card-phone.png).

## Type and hierarchy

Syne Variable supplies upright architectural display lettering; Instrument Sans Variable supplies reading and interface text. Both are self-hosted under SIL OFL-1.1, with unchanged notices in `public/fonts/`. Only two Latin WOFF2 files ship, totaling 64,700 bytes. Fraunces and DM Sans dependencies were removed.

[Syne comparison](typography-syne-preview.png) and [Bodoni Moda comparison](typography-bodoni-comparison.png) were assessed on the actual hero/contact composition. Bodoni’s thin strokes weakened against reflective imagery and retained the preceding serif direction. Syne provides a clearer visual change. Repeated heading italics are replaced by weight and tonal emphasis. All four routes were checked at 320/390/768/1024/1440px; the narrow hero name was tuned for internal clearance.

Licenses: [Syne](https://github.com/google/fonts/blob/main/ofl/syne/OFL.txt), [Instrument Sans](https://github.com/Instrument/instrument-sans/blob/master/OFL.txt).

The custom cursor is no longer mounted. Diagonal arrows in portfolio navigation, studies and case pages have been replaced by horizontal or vertical direction marks.

## Project context and pace

CIRS, Vallalar and AccuFlow now introduce their purpose, contribution or scope, and what visitors can explore before the media. CIRS and Vallalar use the supplied roles. AccuFlow describes the prototype’s scope and actual screens without inventing a personal contribution or health outcome. Detailed case-study routes remain available.

Three real thumbnails are visible in the desktop Work index without requiring hover. Repeated framing and spacing were reduced; supplementary interface observations use native disclosures. Genuine captures, all tabs, source links and key prototype labels remain readily available. The reconstructed CIRS concept is a clearly labeled optional disclosure, rather than leading the real project evidence.

Measurements use the same new typography before and after the pacing changes:

| View | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Desktop, 1440px | 10,647px | 8,008px | 24.8% |
| Phone, 390px | 11,794px | 10,002px | 15.2% |

[Work desktop](work-pacing-desktop.png) · [Vallalar phone](work-pacing-phone.png).

## Verified film access

The two supplied public previews now open only after an explicit Watch action:

- **CCK trailer:** public trailer export, 2:22; no final-cut claim. Drive file `1FXMI8GoosQllewx87S8_lJDXRULukrYA`.
- **Farewell video / Farewell AA:** Drive file `1zxuYX1UAG8FwYlfYhWP-SAnP4jaRx5MN`.

No Drive iframe or request is created during ordinary Studio browsing. Players use the canonical Drive preview endpoint, a title, fullscreen support, no-referrer policy, responsive sizing and an ordinary external fallback. Missing films remain unavailable. Native video still requires its actual video, poster and confirmed credits; no stills or production credits were invented for the embeds.

Both real preview endpoints returned HTTP 200 without an authentication redirect or access-request page. Large source videos were not downloaded and full streaming decode was not repeated. Local player tests isolate iframe responses while checking explicit loading, permitted URL shape, keyboard close/focus return, mobile sizing and unavailable-title gates.

## Validation and remaining content

Production build and all **88 Chromium tests passed** in 2.8 minutes. Eight compiled desktop/phone route visits and four compiled card/player interactions passed without browser errors, failed requests or horizontal overflow. [Check record](identity-type-checks.json) and [compiled evidence](identity-type-compiled-checks.json) record the scope. Physical-device performance is not inferred from cloud testing.

Other film files, exact contribution credits, documentary community images and specific personal project reflections remain incomplete. Swimming remains a factual interest; a more personal account needs Ananda’s actual experience rather than an invented training story. Physical devices and Safari are untested.
