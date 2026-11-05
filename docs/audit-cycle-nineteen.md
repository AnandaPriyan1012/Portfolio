# C19: bring the CIRS launch into its story

Fresh independent reviews of the published C18 portfolio chose a major-project
opportunity: the CIRS launch chapter contained a large inert film poster and a
link to Studio. That handoff worked, but interrupted the project story. The same
verified, owner-supplied 38-second launch film can now play inside its existing
case-study chapter. The Studio link and collection remain available.

The chapter connects the actual campus-life, writing and Admissions material
visible in the supplied film. It makes no new production credit, sole-authorship
or school-outcome claim. CIRS's existing team attribution and the Admissions tour
are preserved. Vallalar and AccuFlow were reviewed; their native bilingual and
prototype journeys worked, and another selector would have added less value.
AirKart was unchanged this cycle.

An intentional poster uses the complete frame at exactly five seconds, showing
students beneath the website's CIRS Experience heading. It complements the
Admissions screenshot immediately before it. The full 1920×1080 frame was
selected at PTS 76800 with source time base 1/15360 and encoded as a 160,088-byte
WebP. No crop, resizing, colour treatment, added artwork or original-film edit
was applied. `cirs-launch-case-poster.json` records its source and derivative
hashes. The visible caption identifies it as the poster frame; it does not label
the film's changing playhead as five seconds.

The 16:9 native video reserves its geometry before loading and initially has no
media source, no controls and `preload="none"`. Entering, scrolling, reading a
different cut or returning to this chapter never loads the MP4 or starts it.
Watch assigns the verified local source and calls Play inside the real keyboard
or tap gesture. The film starts from its beginning. Native controls then remain
available, with an additional stable Play/Pause action, replay after completion,
and an honest retry/Studio alternative for media or playback failures.

Explicit playback is available with reduced motion, Motion Off, forced colours
and low-power preferences. This is requested content rather than an atmospheric
loop. Offscreen, visibility, opening-screen and dialog-cover handlers pause it;
route cleanup pauses even a retained detached video reference. Re-entry does
not resume playback. The native player is excluded from the case reader's
decorative media transforms, keeping its controls steady and legible.

The new end-to-end journey also reproduced a navigation defect: after following
the native Studio link and pressing Back, the case's fragment alignment replaced
the saved reading position and opener focus. The fix recognizes only a saved
CIRS-to-Studio film link returning from Studio. The existing position-restoration
coordinator preserves that entry's fragment, actual Y and exact native anchor;
the case skips its fresh-entry alignment for that restored entry. Fresh and
reloaded chapter links retain their existing alignment, while ordinary case,
Work, Studio and other history flows retain their ownership.

Validation covers genuine decoded playback/time advancement, all initial media
gates, native and custom pause controls, focus, offscreen/opening/unmount cleanup,
reading cuts, error/rejection recovery, responsive geometry and three native
Studio-return variants. Existing case evidence, direct/reloaded chapter links
and Studio-film lifecycle regressions are checked separately. An initial visual
harness failed to pass a host timing variable into its browser evaluation; that
raw failure and its correction are retained independently from the actual
history defect. Exact results, screenshots and publication identity are stored
under `/workspace/cycle-nineteen-release-review`; a build alone is not evidence
of deployment.

Original MP4s, original posters, nine prior source-PTS frame derivatives, the
exact AP signature, genuine website captures, credits and personal recognition
qualifications remain intact. The only new media is the derivative poster from
the approved film. No dependency, font, scroll owner or sharing change was added.
The previous Library materialization HTTP 401 was not retried; unavailable
certificate originals and unmatched MUN material remain unpublished.
