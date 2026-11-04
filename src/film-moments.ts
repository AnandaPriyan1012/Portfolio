import records from "./film-moments-data.json";
import { hasApprovedNativePlayback } from "./media-readiness";

type MomentSource = {
  id: string;
  videoUrl: string | null;
  posterUrl: string | null;
  credits: string | null;
  nativePlaybackApproved?: boolean;
};
export type FilmMoment = { seconds: number; image: string; alt: string };

/** Only the exact approved local film can expose its extracted frame index. */
export function filmMoments(film: MomentSource): FilmMoment[] {
  if (!hasApprovedNativePlayback(film)) return [];
  const record = records.find((item) => item.id === film.id && item.source === film.videoUrl);
  return record?.frames ?? [];
}

/** An arbitrary timestamp or an unrelated source cannot create a cue. */
export function findFilmMoment(film: MomentSource, seconds: unknown) {
  return typeof seconds === "number" && Number.isFinite(seconds)
    ? filmMoments(film).find((moment) => moment.seconds === seconds)
    : undefined;
}

export function formatFilmTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
