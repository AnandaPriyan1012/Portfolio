# Scroll-story validation

Validated on 3 November 2026 in this cloud environment. The site has not been deployed.

## Implemented and measured

- GSAP ScrollTrigger drives screenshot expansion, mask/caption timing, the community glass layer, AccuFlow outline/information, and the conditional studio filmstrip.
- Lenis is driven only by GSAP's ticker on capable desktops. Phone/tablet scrolling is native; reduced motion removes pins and large motion.
- At 1440 × 1000, the real CIRS frame begins at x 604.8 with size 748.8 × 550. After 850 px of actual wheel scrolling it reaches x 86.4 with size 1267.2 × 660. Reverse scrolling restores the original bounds. Captions are fully opaque at this intermediate position.
- Normal direct `/#community`, hash changes and browser Back settle at a 100 px fixed-header offset after fonts/image/pin measurements. Interaction cancels delayed initial repositioning.
- Critical-image failure reverts the scroll effects, leaves the live-site link accessible and presents normal content.
- Production build succeeds.24 Chromium tests passed; targeted post-change CIRS and film-credit tests also passed. Firefox scene/layout/player acceptance passed.
- Layout widths checked:320,375,390,768,1024,1440 px. No page-level horizontal overflow; actual phone capture/crop, visible View Work, menu, tested 44 px controls, semantic content, direct navigation and reduced motion were checked.

## Screenshots and recording

| View | Start | Middle | End |
| --- | --- | --- | --- |
| Desktop | [Start](scroll-desktop-start.png) | [Expanded CIRS](scroll-desktop-middle.png) | [End](scroll-desktop-end.png) |
| Phone 390 px | [Start](scroll-mobile-start.png) | [Middle](scroll-mobile-middle.png) | [End](scroll-mobile-end.png) |

[Community transition](scroll-desktop-community.png) · [Silent actual desktop wheel recording](scroll-story.webm)

The recording was captured from an actual browser scrolling the implementation; it is not a mockup, generated animation or proof of finished missing media.

## Performance observation

One production Chromium run at 390 px/DPR 2, cold cache,150 ms latency,1.6 Mbps download,4× CPU throttling and reduced motion measured:

- First contentful paint:1748 ms.
- Largest contentful paint observed:1748 ms.
- Resource transfer reported:181853 bytes.
- Actual CIRS mobile screenshot begins around 371 px within the 844 px viewport.

A separate normal-motion desktop wheel sample recorded 154 frame intervals over about 2.6 seconds. No interval exceeded 50 ms; maximum was 49.9 ms. The scene progressed to.899 with caption opacity 1.

These are single controlled lab observations. They do not establish stable 60 fps, battery behavior, real-device speed or production-CDN performance.

## Real limits

- Physical iOS/Android phones and physical laptops were not available. Phone layouts were browser emulations.
- Chromium and Firefox were exercised. Actual Safari was not. WebKit downloaded but could not launch because six required native libraries are unavailable on this host; a download is not a successful browser test.
- Real CIRS homepage/mobile/Admissions images were captured from the user-supplied public website with normal TLS. Provenance and the announcement dismissal are recorded in [cirs-source.md](cirs-source.md). Capturing a page does not verify contribution scope or website outcomes.
- Vallalar permission-cleared photos and AccuFlow's confirmed facts/visuals are missing; their reserved scenes are explicitly labelled. No charity or product imagery was invented.
- Personal films, posters and confirmed credits have not been supplied. The public filmstrip/Film navigation remains hidden. Isolated browser-only synthetic fixtures verify conditional layout, scroll translation, credit gating, explicit playback, muted default, no autoplay and reduced/mobile alternatives. This is not a review of Ananda's actual films. See [tests/fixtures/README.md](../tests/fixtures/README.md).
- Real director's footage, original drafts, certificates and contact details remain owner-supplied requirements. Missing actions are hidden rather than simulated.
