# C14: connect the launch film to the website work

A fresh public Work/Studio audit found a useful missing connection. The CIRS
website case already led to its supplied launch film, while Studio provided no
route back to the website case. Its existing three-frame index offered genuine
evidence but no account of the related website contribution.

The CIRS frame strip now includes a concise, source-backed account and an
ordinary website-case link. The account identifies an Admissions Guide view at
00:26 and points to the related website work with the school's team.
The timestamp is gated by the exact approved film and frame record. The film
and dated website capture show different wording, so they are not described as
identical versions or a before/after sequence. No film-production credit is
assigned. The other films receive no invented related projects, and no extra
gallery, media file or dependency is added.

A deliberate related-project action selects the CIRS programme entry and its
canonical fragment before entering the case. Returns preserve that selection,
the exact native source anchor and the saved reading position. Modified and
middle activation retain normal link behavior. Fresh film-fragment entries and
the existing native fragment navigation remain distinct from a return to the
related-project action.

Repeated native Back tests exposed a transient selection race: native fragment
traversal could leave focus on the body during the AP opening, allowing a scroll
preview to replace CIRS before the source link regained focus. Selection-preserving
restoration now cancels competing anchor staging, and automatic previews pause
while the AP cover is active. They resume through the existing focus check when
the cover closes. These guards do not change ordinary film-fragment navigation.

The audit also reproduced two interaction defects on the public release.
First, desktop scroll previews could replace a focused CIRS moment button with
another film's frame strip, disconnecting the button and dropping focus to the
body. The selected frame/context region now participates in the existing focus
guard. Passive previews continue when the reader is outside its controls;
ordinary initial page-heading focus does not disable the programme.

Second, browser Back between two fragments of the same case could leave a
capture viewer open while the background URL and position changed, retaining
its body scroll lock. History-driven dismissal now releases the top layer and
lock without restoring focus to the obsolete capture opener. Manual Close,
Escape and touch dismissal retain their existing source-focus behavior and
click-through protection.

The existing frames, original films and black sections, AP assets, source
qualifications, recognition, sports, four-page navigation and C13 About stories
remain. The blocked Library transfer was not retried and no sharing permissions
changed. Exact compiled/public validation is recorded separately under
`/workspace/cycle-fourteen-release-review`.

Validation passed 122 combined regressions, the two deterministic native-scroll
Back-to-top checks, and seven prior Swimmer handoffs. The compiled related-project
suite passed all nine checks and ten repetitions of the two formerly failing
desktop journeys: 25 recorded returns with zero position drift. Independent
compiled review covered six visual modes and four complete cue/case/inspection/
return journeys; sampled new text contrast was at least 10.38:1. Build/typecheck,
static routes, three cache checks and original-film/frame integrity passed.
Earlier failures, the interrupted pre-correction run and final results remain
separate in the release evidence.
