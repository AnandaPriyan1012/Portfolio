# Synthetic playback fixtures

`synthetic-film.webm` is a one-second, silent, flat-colour WebM generated with FFmpeg for native-player validation. `synthetic-poster.svg` explicitly labels itself as a synthetic test frame.

The film tests intercept Vite's content module and media URLs **inside that test browser only**. They populate three temporary film slots to exercise the conditional filmstrip and player. They do not edit application content, place files in `public/`, or represent Ananda's films. Successful fixture playback does not validate missing personal footage, credits, captions, or real source-media compatibility.
