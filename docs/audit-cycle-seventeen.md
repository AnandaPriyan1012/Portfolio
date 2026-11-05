# C17: keep a route through the work

Fresh independent reviews of the live C16 release found a useful wayfinding gap.
With its evidence drawers closed, Work was roughly 6,500px tall on desktop and
8,200px on a phone. At AccuFlow, all three project links were more than 4,200px
above the phone viewport. The fixed header offered main-page navigation, but no
direct jump between the projects currently being read.

A compact glass chapter rail now extends that header after the full project
index leaves view. Its three ordinary links use the existing CIRS, Vallalar and
AccuFlow anchors. Pixel numerals reuse the licensed AP Pixelify font, and one
current-reading underline supplies orientation without a fabricated completion
score. There is no new project, gallery or floating dock.

CIRS's reading range includes its optional website and concept evidence until
Vallalar begins. Vallalar continues through its bilingual evidence until AccuFlow;
AccuFlow includes its drawer and ends with WorkPage. The rail hides before the
experiments and Studio handoff, while the full index is available, and while the
phone menu is open. Its native nodes remain mounted when a focused visitor
reverses toward the index. This preserves focus without forcing the user back to
the rail or claiming that it remains fixed onscreen outside its normal range.

Scroll, resize, font and actual layout-size changes schedule one measurement.
React state changes only when visibility or the current chapter changes; no
animation runs at rest. Passive reading writes no URL or history entries and
moves no focus. The links keep native modifiers, keyboard and touch behavior.
Reduced-motion, motion-off, light and forced-color modes retain the same routes.

The rail reserves its measured 56px height before it sticks, including jumps from
the initial index. The existing scroll coordinator adds that space to the actual
header height on Work only. Native margins use the same measured header and rail,
subtracting the document's existing scroll padding. This matters on ordinary
touch browsers: the first prototype counted that padding twice, leaving a new
chapter below the reading line and the previous marker selected. Sticky rail
links also explicitly have no content scroll margin, avoiding a browser pulling
the document back toward the index when focusing a control already under the
header. No second smooth-scroll controller was introduced.

The audit also reproduced a separate existing defect: a fresh direct CIRS
Admissions or AccuFlow interface chapter URL retained its fragment but opened at
the case beginning, with body focus and no active chapter. Case initialization
now recognizes only a real reader chapter belonging to the current project. It
aligns and focuses that native chapter once fonts, preceding eager media and the
AP opening settle. Readiness is bounded; trusted input, a new hash/history move
or unmount cancels the pending arrival. Unknown, malformed, outside-case and
nonchapter fragments retain ordinary entry behavior. Existing mounted chapter
navigation, history restoration and capture dismissal keep their ownership.

Validation includes native jumps and focus continuation, expanded-evidence
reading ranges, reverse/end visibility, mobile-menu suppression, C16 manual
capture and exact case returns, direct/reloaded case fragments, cancellation and
existing navigation/history regressions. Initial harness failures are preserved
separately: an intentionally hidden nav was queried through an accessible-only
locator; one reverse-wheel helper assumed a precise Lenis delta; parallel root
runners briefly shared an artifact directory. Corrections use the actual DOM,
native reading boundaries and isolated artifact directories, without relaxing
chapter alignment, current-state or saved-position assertions. Two older tests
were updated for the preserved C16 Work fragment and the newly reserved rail.

The exact local/public results and deployment identity are recorded separately
under `/workspace/cycle-seventeen-release-review`. Build success alone does not
establish publication.

Local coverage includes all 21 rail behaviors, 11 initial case-link checks and
seven unchanged About/Studio journeys. Existing regression coverage includes
46 history, case-reader, capture and C16 checks, plus the corrected legacy Work
return assertion. Nine visual modes verify 27 native chapter jumps; separate
keyboard and responsive-capture journeys pass. The final TypeScript/Vite/static
route build, three cache checks and approved-film/frame integrity checks pass.

All project and personal claims, approved films and genuine frame derivatives,
AP assets, recognition qualifications and original source images remain. No
media or dependency was added. The prior Library materialization HTTP 401 was
not retried; inaccessible certificates and unmatched MUN material remain
unpublished, with no sharing changes.
