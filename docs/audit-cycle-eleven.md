# C11: let the films do more of the talking

Two independent reviews of the live C10 release reproduced the same Studio
problems. On phones, choosing a title could leave its Watch action above the
viewport. A deliberate selection also left the previous film in the URL, so
refreshing or copying the link pointed to different work. The existing Work
briefs and project evidence remained useful; this cycle concentrates on Studio
and the Creative case rather than rebuilding those pages.

Each available programme row now has a direct 44px Watch action beside its native
radio choice. Choosing a film updates that history entry's canonical fragment,
preserving its key, framework metadata, query, scroll position and keyboard
focus. Passive scroll staging still avoids rewriting the URL or adding history
entries. Both actions retain explicit, paused playback and the existing ready
source gates. Unavailable films get no Watch action.

The three approved local films have a new frame index: three genuine, timestamped
stills each. Vantara uses 00:24, 01:16 and 02:04; the final TED-Ed auditions export
uses 00:02, 00:14 and 00:19; the CIRS website launch uses 00:05, 00:17 and 00:26.
The nine complete frames total 133,288 bytes at 480 by 270 pixels. They were
visually selected and their exact source PTS checked. Encoding only resizes the
full frame and produces WebP; it adds no graphics, cropping or color treatment.
The manifest records source and derivative hashes, dimensions and timestamps.
`node scripts/check-film-moments.mjs` verifies the integrated records and bytes.

Opening a frame mounts the existing native player at that approved moment,
paused. An unrelated source, missing approval or arbitrary timestamp cannot
create a cue. The ordinary Watch action still begins at zero. Seeking waits for
metadata, and native controls remain available; no background video is loaded
to preview these frames. The interaction follows the native
[currentTime API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime)
and [metadata event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/loadedmetadata_event).
Phones use a native horizontal frame strip; keyboard and reduced-motion
alternatives retain the same content. A bounded layout-height observer refreshes
the existing scroll coordinator when the selected frame index changes page
height, without polling transforms.

The Creative case's five artworks are now whole native links to their matching
Studio films, preserving normal modified and middle clicks. The generic link is
labelled Browse Studio. This corrects a featured Vantara image previously leading
only through a generic action to the default CCK selection.

No production credit, speaker identity, chapter interpretation, motivation or
outcome was inferred from the frames. The page visible within the CIRS launch
film remains footage within that film, without a standalone Crossroads credit.
Vantara and Masquerade remain one entry. All supplied black sections and all
original MP4 bytes are preserved. Gaurav source qualifications, exact AP assets,
Drive fallbacks and private-source exclusions remain unchanged. The unresolved
Library materialization HTTP 401 was not retried and no Drive sharing changed.

Validation passed: 163 combined checks covering the new interactions and adjacent
Studio, native/Drive playback, history, tour, Home/About and Creative case flows;
the build/typecheck, three cache-policy checks and source/frame hash checks also
passed. Independent final compiled review passed 15 interaction probes and six
light/forced-color views across 1440, 390 and 320px. Its contrast review caught and
verified a scoped light-theme correction before release. No new JavaScript or
transport errors were reported in those checks.

Exact local/public release evidence is recorded separately under
`/workspace/cycle-eleven-release-review`; a local build alone does not establish
publication.
