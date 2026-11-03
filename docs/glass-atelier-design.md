# Glass Atelier — local design notes

This revision is a local review build. The existing Netlify production site remains separate and unchanged. A public release requires Ananda's approval.

## Identity

The supplied AP brush signature is used as `public/media/ap-signature.png` with a transparent background. A warm champagne CSS colour treatment matches the site's cream text, amber edge reflections and brown-charcoal canvas while retaining the brush silhouette. The signature appears in navigation, the opening title, case studies and the branded 404. Text fallbacks keep navigation usable if the image fails.

The selected navigation is the **thin Film Strip line**, with a compact signature, a restrained golden track and Work, Studio, About and Contact links. The rounded Glass Capsule reference was not selected. Phone navigation becomes a labelled Menu with large tap targets.

DM Sans and Fraunces are the two locally hosted type families. No proprietary font licence is implied.

## Artwork and responsive composition

The large smoked-glass hero remains the central physical surface, with subtle light movement rather than particles or a sci-fi interface. `atelier-room-wide.webp` and `atelier-room-tablet.webp` support landscape layouts; `atelier-room-portrait.webp` is a distinct portrait composition. The full glass silhouette is preserved rather than merely cropping the desktop scene for phones.

These generated glass-room assets are decorative artwork. They are not presented as photographs of Ananda's work. The supporting CIRS screenshots are actual captures from the supplied public school website; [source notes](cirs-source.md) record their provenance. Phone CIRS and portrait glass sources avoid loading unnecessary desktop-sized imagery.

## Scroll composition

A single shared SVG surface changes geometry, light and opacity through the project sequence. It is decorative and never contains essential text.

1. The hero's real CIRS support image expands into a large browser frame during a short, reversible desktop pin. Identity retires and factual role/Admissions captions appear with scroll progress.
2. CIRS uses precise lines and a cooler architectural rhythm. The school homepage and Admissions material remain separate authentic captures.
3. Vallalar shifts to warmer, softer edges and spacious purpose/role content. Its major section does not infer impact statistics or substitute staged community imagery.
4. AccuFlow uses a muted teal frame and staged case-study information. Missing product facts and visuals remain explicitly unconfirmed.
5. Studio gives the shared surface a filmstrip edge. The local collection index lists the requested works without fake play controls. The scroll-driven reel activates when genuine ready media exists.
6. About and contact resolve to a clean reading layout. AirKart remains secondary.

Lenis and GSAP share one animation clock on capable desktops. Phone/tablet layouts retain native scrolling, and reduced-motion or low-power fallbacks remove smoothing, pinning and large movement. No scroll snapping or waiting gate is imposed.

## Opening and error state

The AP/glass title is a brief, once-per-session detail over an already usable page. It has a keyboard-accessible Skip control, no percentage and a bounded dismissal time. Reduced-motion and low-power conditions skip it.

Unknown routes use the matching branded 404. The build creates a standalone `404.html` alongside physical known project entry points.

## Content still required

- Permission-cleared Vallalar photos, concrete digital-work examples and confirmed organisation/website wording.
- AccuFlow's accurate description, intended audience, problem, personal contribution, confirmed technology/features, current stage, authentic visuals and reflection.
- Original CCK, farewell and Masquerade films and stills; correct Vantara, TED-Ed 2026 and CIRSMUN 2026 files and contribution credits.
- A real director's montage, original process drafts and genuine before/after pairs if those interactions are to be shown.
- Public-approved certificates and verified contact routes.

No Crossroads work, invented customers, effectiveness claims, outcomes, testimonials or metrics are added. The conditional film player is tested with isolated synthetic fixtures only; those fixtures are not portfolio assets.

See [the local review](local-atelier-review.md) for actual browser screenshots, recordings, measurements and testing limits. The compiled ZIP is a local handoff; no private ChatGPT Sites draft could be created with the tools available in this session.
