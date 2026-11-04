import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import "./drive-film-player.css";

/** Only the canonical Google Drive preview endpoint may be embedded. */
export function isApprovedDriveEmbed(value: unknown): value is string {
  return typeof value === "string" &&
    /^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/preview$/.test(value);
}

/** Mounted inside the modal only after a visitor chooses a film. */
export default function DriveFilmPlayer({
  title,
  embedUrl,
}: {
  title: string;
  embedUrl: string;
}) {
  if (!isApprovedDriveEmbed(embedUrl)) {
    return <p>This film’s player is currently unavailable.</p>;
  }
  return <ApprovedDriveFilmPlayer key={embedUrl} title={title} embedUrl={embedUrl} />;
}

function ApprovedDriveFilmPlayer({
  title,
  embedUrl,
}: {
  title: string;
  embedUrl: string;
}) {
  const [frameOpened, setFrameOpened] = useState(false);
  const [takingLonger, setTakingLonger] = useState(false);
  useEffect(() => {
    if (frameOpened) return;
    const timeout = window.setTimeout(() => setTakingLonger(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [frameOpened]);
  const shieldEmptyFrame = !frameOpened && !takingLonger;
  return (
    <div className="drive-film-player">
      <div className="drive-film-viewport">
        <div className="drive-film-frame" aria-busy={!frameOpened}>
          <iframe
            src={embedUrl}
            title={`${title} — Google Drive player`}
            allow="fullscreen; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            tabIndex={shieldEmptyFrame ? -1 : 0}
            inert={shieldEmptyFrame}
            onLoad={() => setFrameOpened(true)}
          />
        </div>
        {/* A cross-origin frame's load event does not verify its player or film.
            Keep the live status outside the busy region and the fallback usable. */}
        <p
          className="drive-film-status"
          data-frame-opened={frameOpened}
          data-taking-longer={takingLonger}
          role="status"
          aria-atomic="true"
        >
          {shieldEmptyFrame && <span className="drive-film-loading-mark" aria-hidden="true" />}
          {frameOpened
            ? null
            : takingLonger
              ? "Google Drive is taking longer to open. You can try the player or use the direct link below."
              : "Opening Google Drive…"}
        </p>
      </div>
      <div className="drive-film-help">
        <p>
          Use the player’s controls to start the film. If it stays blank, open it
          in Google Drive.
        </p>
        <a
          href={embedUrl.replace(/\/preview$/, "/view")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Drive <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
