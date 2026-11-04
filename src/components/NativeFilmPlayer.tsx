import { useEffect, useRef, useState } from "react";
import { findFilmMoment, formatFilmTime } from "../film-moments";

type Film = { id: string; title: string; videoUrl: string; posterUrl: string; credits: string | null; nativePlaybackApproved?: boolean };

export default function NativeFilmPlayer({ film, startAt }: { film: Film; startAt?: number }) {
  const player = useRef<HTMLVideoElement>(null);
  const [seekFailed, setSeekFailed] = useState(false);
  const moment = findFilmMoment(film, startAt);
  useEffect(() => {
    const video = player.current;
    return () => video?.pause();
  }, []);
  return (
    <>
      <video ref={player} className="actual-video" aria-label={`${film.title} video player`}
        controls playsInline tabIndex={0} preload="metadata" poster={film.posterUrl}
        onLoadedMetadata={(event) => {
          if (!moment) return;
          try { event.currentTarget.currentTime = moment.seconds; }
          catch { setSeekFailed(true); }
        }}>
        <source src={film.videoUrl} />
        Your browser does not support video playback.
      </video>
      {moment && <p className="dialog-introduction" role="status">
        {seekFailed ? "Use the player’s controls to find the selected moment."
          : `Starts at ${formatFilmTime(moment.seconds)}. Press Play when you’re ready.`}
      </p>}
    </>
  );
}
