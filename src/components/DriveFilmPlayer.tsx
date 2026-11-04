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
  return (
    <div className="drive-film-player">
      <div className="drive-film-frame">
        <iframe
          src={embedUrl}
          title={`${title} — Google Drive player`}
          allow="fullscreen; encrypted-media"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
      <div className="drive-film-help">
        <p>
          Hosted on Google Drive. Use the player’s controls to start the film.
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
