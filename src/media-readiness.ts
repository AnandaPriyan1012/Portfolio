type NativeFilmSource = {
  videoUrl: string | null;
  posterUrl: string | null;
  credits: string | null;
  nativePlaybackApproved?: boolean;
};

/** Missing credits are allowed only for explicitly approved, locally served
 * owner-supplied MP4/poster pairs. Existing credited sources retain their gate. */
export function hasApprovedNativePlayback<T extends NativeFilmSource>(
  film: T,
): film is T & { videoUrl: string; posterUrl: string } {
  if (!film.videoUrl || !film.posterUrl) return false;
  if (film.credits) return true;
  return film.nativePlaybackApproved === true &&
    /^\/media\/[a-z0-9][a-z0-9._-]*\.mp4$/i.test(film.videoUrl) &&
    /^\/media\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(film.posterUrl);
}
