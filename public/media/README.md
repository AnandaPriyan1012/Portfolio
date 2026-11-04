# Real project media

The three CIRS WebP files are newly captured screenshots of the public website supplied by URL in the brief:

- `cirs-home-desktop.webp`: https://cirschool.org/ — 1440 × 1000, 69 KB.
- `cirs-home-mobile.webp`: https://cirschool.org/ — 390 × 844, 21 KB.
- `cirs-admissions.webp`: https://cirschool.org/admissions.html — 1440 × 1000, 53 KB.

Capture date: 3 November 2026. These are public-site captures, not user-uploaded files or invented mockups. Exact times, validation and the Admissions announcement dismissal are recorded in `docs/cirs-source.md`. No claim that admissions are currently open is made.

## Additional real interface captures

- `vallalar-website-{desktop,mobile}.webp` show the existing public website review preview's About page. These are website screenshots, not community photographs, and end before any illustrative/reference imagery.
- `accuflow-prototype-{desktop,mobile}.webp` show the existing public guide interface in its initial state. It is an internal website prototype, without claims of medical effectiveness or product results.

URLs, dimensions, source limits and hashes are recorded in `docs/project-source-evidence.md`.

## Identity and decorative artwork

The AP PNG preserves the supplied signature's transparent brush silhouette. The website applies its warm colour through the original alpha as a CSS mask, with an image/text fallback. The wide, tablet and portrait `atelier-room-*.webp` files are decorative glass-room artwork, not evidence of project work.

`amber-architecture-loop.mp4` is an authorized decorative Flow/Veo background: 8 seconds, 1280 × 720, H.264, 24 fps, 672,315 bytes, no audio. Its forward/reverse loop is copied without modifying the original bytes (SHA-256 `fa661257e1b018713e856dd52868138d7334e437336cd65b05039a8bd7fc9c02`). `amber-architecture-poster.webp` is an uncropped first-frame poster. The visible Veo watermark is required and remains in the clear lower-right corner. The video uses `object-fit: contain` outside the cropped still-image layer; its scroll exit changes opacity only. Do not crop, scale beyond its frame, obscure or remove that mark.

The ambient film loads only on capable fine-pointer desktops with motion enabled. A visible pause control, offscreen/tab pausing and the original still fallback remain available. Phone, reduced-motion, Save Data and low-power paths do not fetch the MP4 or its poster. This generated architectural background is separate from the Studio collection and is not presented as Ananda's film work.

`scroll-corridor.mp4` is a user-supplied conceptual glass passage, decoded forwards and backwards with the existing Home directory's scroll. Its original bytes and complete frame are preserved. It adds no page height and loads only near its section on eligible desktops. `studio-atmosphere-loop.mp4` is a separate user-supplied empty cinema setting behind the Studio programme. It is conceptual atmosphere, including its generic EXIT sign, not a documentary venue or an original film credit. Both retain their Veo mark in the standard portfolio. Details: `docs/corridor-evaluation.json` and `docs/studio-atmosphere-evaluation.json`.

`cirs-reconstructed-concept.png` is the exact supplied concept image. Its visible caption states “Reconstructed concept · Created for this portfolio”; it is not a historical CIRS draft. Original-draft gates in `src/content.ts` remain unchanged. `atlas-*.webp` and `vallalar-language-*.webp` are genuine public interface captures, with exact sources, state and hashes in the respective source manifests.

## Editor notes: missing originals

`src/content.ts` is the editing source. Leave absent files as `null`.

- Vallalar documentary photographs and social-media examples remain unavailable. Its website-preview screenshot is labelled accurately.
- AccuFlow's exact personal contribution and reflection remain unconfirmed. The actual website prototype establishes its interface and prototype stage.
- No original CCK trailer, Farewell video, Masquerade trailer, Vantara, TED-Ed 2026 or CIRSMUN 2026 files/posters/credits have been supplied. The public collection index has no fake play controls. Set videoUrl, posterUrl and confirmed credits together to enable a real film.
- No genuine before/draft images or director's montage have been supplied. Process controls and the director's action remain hidden until those originals exist.

Do not substitute generated work, staged charity imagery or fictional product interfaces for missing originals.
