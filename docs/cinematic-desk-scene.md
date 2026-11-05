# Cinematic desk landing page

This revision replaces the earlier flat, grid-based "desk" with one continuous, warm workspace illustration: an open laptop with a visible keyboard and hinge, a brass lamp, a booklet, a tablet, a film reel and a personal calling card on a walnut desk. The earlier implementation did not fulfill the requested cinematic scene. The original environment is generated artwork, not a photograph of the owner's desk or evidence of project work.

## Real work on physical surfaces

| Surface and native link | Material shown | Attribution and scope |
| --- | --- | --- |
| Laptop → `/projects/cirs` | Complete genuine `cirschool.org` homepage capture at 1600 × 1000 | School-team web work; live website |
| Booklet → `/projects/community` | Genuine Vallalar English About opening | Voluntary digital work; website review preview |
| Tablet → `/projects/accuflow` | Genuine initial AccuFlow guide capture | Website and guide prototype; no invented personal role or product results |
| Film reel → `/studio` | Plain illustrated reel and strip; actual work is in Studio | Verified Vantara, TED-Ed auditions and CIRS launch remain accessible |
| Calling card → `/about#contact` | Exact existing AP signature asset | Original personal identity, not payment branding |

Project captures are separate genuine image assets, contained in full and projected onto the corresponding quadrilaterals with CSS `matrix3d`. The treatment adds restrained surface lighting without altering the source files. The scene does not contain a generated website, fake historical sketch, unsupported process hotspot, unrelated stock work or an embedded generated movie. The film strip remains plain because projecting a still across its curve looked unconvincing.

This is a fixed-camera interactive illustration, not a real-time 3D room, a movable camera or a claim of physical screen legibility at every scale. It adds no rendering dependency, WebGL context, background movie or idle animation loop. Four surface transforms update on resize using one `ResizeObserver` and a bounded animation-frame callback; observers and callbacks are cleaned up on route changes.

## Navigation and accessible fallback

Each object and its always-visible caption activate the same single native anchor. Keyboard focus highlights that caption and, on desktop, instantly reveals the complete caption if it would be clipped below the viewport or beneath the fixed header. This corrects native focus scrolling to an object whose caption sits outside its physical hit area. Native modifier-click behavior remains intact, and the existing case-study return-origin tokens are preserved. The header contains the owner's name once, with one separate Work-index link and no duplicate primary menu on Home.

At 1100px and below, the entire scene remains visible and the same five anchors become a readable document-flow list below it. Visitors do not need to hit tiny objects on a phone. If the environment image fails, a status message and the native list remain available. A failed project capture shows an honest unavailable message on its surface while retaining the real project link. Reduced-motion and forced-color treatments remain available. Existing AP page transitions, Skip/Escape behavior, the smaller glass pointer and the two self-hosted typefaces are preserved.

## Asset provenance

The original environment was generated for this requested portfolio composition on 5 November 2026. It contains blank work surfaces, with no rendered project interfaces or third-party branding. Original local file: `/workspace/generated_images/exec-a63fae37-dc55-402a-8e0c-1d7827e4ecf0.png`, 1672 × 941, SHA-256 `213b43b47ea458e09515490e116f9e2aa9baf1b1b9aa88f715ff3466a502ce50`.

| Public asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `/media/cinematic-desk-wide.webp` | 196756 | `37b88f5c124b6ae8d5bf88b94580b18b835d4f2befdcbc31937cd3b20b3b9604` |
| `/media/cinematic-desk-compact.webp` | 62296 | `2e2f058c700048756e6edbf2c1818ac57a3a35c0f6729dd5c69df0e50df13be0` |
| `/media/desk-cirs-home-1600.webp` | 151312 | `c4c00b9c67c95a7b5b2bf379684adb65ef54bc4e2d33bb4f1b0bb97ea7cca57d` |

The environment derivatives use only compression and proportional resizing. The complete CIRS page was captured directly from `https://cirschool.org/` on 5 November 2026 at `10:16:10.986Z`, HTTP 200, with normal certificate validation, no non-read requests and no retouching or fabricated interface. Its original PNG SHA-256 is `bdd768ef6acf5577aaf32877e19482971e67aec9a3984a04041019de55dba4e6`. The CIRS capture fits the physical laptop display without substituting an invented site. Existing Vallalar, AccuFlow and AP source assets remain byte-identical.

The earlier desk-concept Library metadata was found, but this execution environment could not display that reference's pixels. Therefore visual acceptance is against the explicit desk brief and actual rendered desktop/phone scene, not an asserted pixel-for-pixel match with that inaccessible image. The previously blocked Library materialization was not retried, and no sharing permissions were changed.

## Release scope

The owner explicitly requested building and hosting this cinematic desk after reporting the mismatch. Publish only this bounded scene revision through the established GitHub `main` → Vercel workflow after testing, verify the actual public scene and AP transitions, then stop. Gaurav stays absent; other verified project content, films and recognition records are retained. The earlier `desk-preview-and-cursor.md` describes a superseded implementation and its historical review, not this scene's visual acceptance.

Local acceptance uses the compiled `index-CP3Eql8w.js` / `index-BBfdx0dh.css` build. Fourteen targeted scene cases pass, including 320–1920px layouts, native polygon hits, full keyboard-caption visibility, independent projected-corner checks under real resizing, zero idle surface mutations, nonzero-scroll case/history returns, image failures and quiet preferences. The wide-screen clipped-focus regression was reproduced before the bounded correction and passes afterward. Twenty-seven separate AP-loader and cursor regression cases also pass on this compiled build. The independent visual review inspected actual desktop, tablet and phone renders, plus light, reduced-motion and forced-color modes. These are managed Chromium checks and responsive emulation, not a certification of every physical device or a newly verified Google Drive provider player.
