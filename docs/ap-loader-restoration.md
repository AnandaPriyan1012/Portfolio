# Restore the AP opening on page changes

The AP signature opening is intentionally restored after it was unmounted in the desk release. The desk presentation stays unchanged. Content-motion simplification must not silently remove this separately requested opening.

Three production changes implement this repair:

- Mount the existing AtelierLoader once beside App in main.tsx.
- Apply the existing final 220ms fade to its inner pane, keeping the outer stage opaque black until removal.
- Label the existing shared ap-motion preference “Motion”, since it affects both the opening and glass cursor.

The exact supplied AP image and retained drawing sequence are unchanged. Normal duration is bounded at 1600ms; reduced motion, forced colors, manual motion-off, Save Data and constrained devices retain the 120ms static alternative. Skip, Escape, keyboard/scroll intent, focus restoration, native cursor fallback and timer cleanup remain. The stage does not wait for media downloads or lock body scrolling.

Initial load and changes of pathname replay the opening, including project pages and Back/Forward. Same-page anchors or film selections do not restart it. The existing persisted-pageshow event branch remains; synthetic branch coverage must not be described as physical-device BFCache verification.

Acceptance must cover actual black viewport coverage, advancing exact-logo animation, normal/quiet bounded lifetime, desktop/mobile native navigation, case return focus and scroll, Back/Forward/reload, Skip/Escape, native modal/media cleanup and glass-cursor recovery. No unrelated redesign, new asset, permission change or additional work cycle belongs to this release. Publish through the established production main workflow only after the specific checks pass, verify the live result, then stop.
