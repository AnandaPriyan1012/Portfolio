# Glass Atelier — design and source notes

The portfolio is published through GitHub and Vercel. The latest refinement is reviewed locally before its `main` branch release; [the refinement review](refinement-review.md) records that version's evidence. The existing Netlify production site remains separate and unchanged.

## Identity

The supplied AP brush signature is used as `public/media/ap-signature.png` with a transparent background. A warm champagne CSS colour treatment matches the site's cream text, amber edge reflections and brown-charcoal canvas while retaining the brush silhouette. The signature appears in navigation, the opening title, case studies and the branded 404. Text fallbacks keep navigation usable if the image fails.

The selected navigation is the **thin Film Strip line**, with a compact signature, a restrained golden track and Work, Studio, About and Contact links. Its height is 76 px on desktop, 72 px on tablet and 64 px on phone. A filled film marker and a small active indicator identify the current section. Phone navigation becomes a labelled Menu with large tap targets. Heading and anchor clearance follow the measured header height.

DM Sans and Fraunces are the two locally hosted type families. No proprietary font licence is implied.

## Artwork and responsive composition

The large smoked-glass hero remains the central physical surface, with subtle light movement rather than particles or a sci-fi interface. `atelier-room-wide.webp` and `atelier-room-tablet.webp` support landscape layouts; `atelier-room-portrait.webp` is a distinct portrait composition. The full glass silhouette is preserved rather than merely cropping the desktop scene for phones.

The generated glass-room assets are decorative artwork. The CIRS screenshots are actual captures from the supplied public school website; [source notes](cirs-source.md) record their provenance. The Vallalar and AccuFlow media are actual website captures documented in [project source evidence](project-source-evidence.md). All three projects have phone-specific image sources. The hero retains its distinct portrait artwork.

## Scroll composition

A single shared SVG surface changes geometry, light and opacity through the project sequence. It is decorative and never contains essential text.

1. The hero's real CIRS support image starts expanding immediately during a short, reversible desktop pin. The name remains through the early movement so the transition retains a focal point. Factual role and Admissions captions appear as the browser frame reaches its larger composition.
2. CIRS uses precise lines and a cooler architectural rhythm. The school homepage and Admissions material remain separate authentic captures. The case study explains the supplied web-development and creative contribution, then describes the actual Admissions interface. Unconfirmed personal choices and lessons are left out.
3. Vallalar uses a warm layered perimeter, softer edge reflections and a lateral glass peel around purpose and contribution. Its image shows the actual About page from a website review preview. The crop ends before the page's imagery; no food-reference photo is presented as a photograph of the organisation or its service.
4. AccuFlow uses muted teal underlighting, a traced product frame and staged information around the real guide interface. The source identifies itself as an internal prototype. The case study covers the six-page product website and interaction concept without claiming medical effectiveness, users or a launched physical product. The source brand is AcuFlow; the owner's portfolio project name remains AccuFlow.
5. Studio uses darker film material and film rails. A concise index names the requested pieces without six repeated upload notices. Actual films, stills and credits remain absent, so no play controls appear. The scroll-driven reel activates when genuine ready media exists.
6. About and contact resolve to a clean reading layout. The confirmed email, `anandapriyan1012@gmail.com`, opens a real email destination. AirKart remains secondary.

Lenis and GSAP share one animation clock on capable desktops. Phone/tablet layouts retain native scrolling, and reduced-motion or low-power fallbacks remove smoothing, pinning and large movement. No scroll snapping or waiting gate is imposed.

## Opening and error state

The AP/glass title is a brief, once-per-session detail over an already usable page. It has a keyboard-accessible Skip control, no percentage and a bounded dismissal time. Reduced-motion and low-power conditions skip it.

Unknown routes use the matching branded 404. The build creates a standalone `404.html` alongside physical known project entry points.

## Evidence and remaining material

The actual website captures and their boundaries are recorded in [project source evidence](project-source-evidence.md). Vallalar's screen is a website review preview; AccuFlow's screen is an internal product/interaction prototype. They do not establish project outcomes or exact personal authorship.

- Permission-cleared documentary Vallalar photos and concrete social-media or digital-storytelling examples.
- AccuFlow's exact personal contribution, collaborators, personal process and reflection; any capabilities beyond those observable in the documented prototype require confirmation.
- CIRS original process material, personal decisions and lessons. The public case study currently uses the supplied contribution and observable interface evidence.
- Original CCK, farewell and Masquerade films and stills; correct Vantara, TED-Ed 2026 and CIRSMUN 2026 files and contribution credits.
- A real director's montage, original process drafts and genuine before/after pairs if those interactions are to be shown.
- Public-approved certificates. A public email destination is confirmed and implemented.

No Crossroads work, invented customers, effectiveness claims, outcomes, testimonials or metrics are added. The conditional film player is tested with isolated synthetic fixtures only; those fixtures are not portfolio assets.

See [the refinement review](refinement-review.md) for the latest browser evidence and [the earlier Atelier review](local-atelier-review.md) for previous recordings and measurements. The compiled ZIP remains a local handoff; no private ChatGPT Sites draft could be created with the tools available in this session.
