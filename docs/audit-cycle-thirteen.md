# C13: personal stories behind the work

A fresh independent visual review of the published C12 release found that Home
already connected its glass room to a substantial CIRS scene, while About moved
straight from a name and signature into categories. The most valuable creative
addition was a personal account of how the real work began.

About now introduces two editorial scenes before the existing four interest
lanes. The CIRS account describes proposing a school-website refresh and then
working with the school's team on page design, development, Admissions and phone
layouts. The Vallalar account starts with preparing and distributing meals, then
asking how else to help. It retains the voluntary role and involvement since
2023. Both accounts come from the existing verified project stories in
`src/content.ts`; neither adds a new outcome, date or sole-authorship claim.

The first scene uses the genuine CIRS Admissions desktop/phone captures. The
second reverses the composition around the actual Tamil About-page capture from
Vallalar's public website review preview. Their captions identify the source and
capture date. The phone CIRS presentation is explicitly an Admissions detail
window; the original file is unchanged and the full project remains available
through an ordinary native link. These are current interface evidence, not
historical proposal sketches or documentary photographs of meal service.

On capable desktops, two scoped ScrollTrigger timelines move the glass proof
planes and their decorative light with forward and reverse scrolling. The prose
and actions remain visible. There are no pinned scenes, idle loops, extra
animation clocks, mandatory gestures, new dependencies or new media files.
Phone, reduced-motion, Motion Off, forced-colors and low-power modes retain a
static composition. Reserved image geometry and a readable failure state keep
the accounts and links usable if a capture cannot load.

The new case links share destinations with the older Builder links. A return
must therefore remember the actual clicked native anchor, rather than choosing
the first link with that URL. Navigation now stores its plain href and occurrence
and restores that exact anchor after restoring the saved viewport. Passing the
actual click target also supports pointer platforms that do not focus anchors
automatically. A missing exact origin falls back to the page heading, rather
than a different duplicate. Existing Home/tour origin handling and native
modified-link behavior remain intact. No new About lane URL format was added.

Independent normal-motion phone testing also caught a same-page Swimmer handoff
that selected the correct lane and focused its heading but left the viewport at
the footer. The lane's height change queued a layout refresh after native smooth
scrolling began. The refresh temporarily reset and restored the scroll position,
cancelling the browser's animation. A trace reproduced the failure before the
fix. Only the same-page `/about#about` handoff now requests an immediate target,
which survives that refresh; Contact and the other scrolling paths retain their
existing behavior. The tour and AP OS entry points are regression checked.

The original AP signature, four interest lanes, source choices, qualified
recognition and sports records, contact card, approved films and genuine film
frames remain. No Drive permissions changed. The existing Library transfer's
HTTP 401 was not retried; unavailable original certificate scans and unmatched
CIRSMUN media remain unpublished.

Build, relevant browser checks and exact compiled/public verification are
recorded separately in `/workspace/cycle-thirteen-release-review`.
The integrated About/back-to-top/recognition run passed 65 checks; the final
origin/navigation/history/loader batch passed 62. After the phone correction,
all 21 compiled real-origin and Swimmer regressions and three adjacent navigation
checks passed. Independent final-build review passed 16 journeys, six visual
views and motion lifecycle checks. Sampled text contrast was at least 4.71:1 in
light mode and 8.34:1 in dark mode. The earlier failed phone evidence and the
corrected local-server test-harness failure are retained separately.
