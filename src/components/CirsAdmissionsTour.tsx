import { useId, useState, type CSSProperties } from "react";
import "./cirs-admissions-tour.css";
import CaptureInspection from "./CaptureInspection";

// Bounds refer to the actual 1440 × 1000 public capture, excluding its frame.
const notes = [
  {
    id: "portal",
    label: "Portal",
    bounds: [118, 799, 230, 53],
    text: "Registered Portal Login is the main action. The application summary asks families to confirm the intake before submitting.",
  },
  {
    id: "process",
    label: "Process",
    bounds: [376, 813, 177, 27],
    text: "Understand the process sits beside the portal, giving the guidance its own route from the introduction.",
  },
  {
    id: "enquiries",
    label: "Enquiries",
    bounds: [117, 881, 961, 95],
    text: "Entry-class availability and dates or assessment need confirmation. The introduction directs current details to the Admissions Office.",
  },
] as const;

type Props = { src: string; motionEnabled?: boolean };

export default function CirsAdmissionsTour({ src, motionEnabled = false }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const descriptionId = useId();
  const active = notes.find((note) => note.id === selected);
  const [x, y, width, height] = active?.bounds ?? [0, 0, 0, 0];
  const focusStyle = {
    "--note-x": `${(x / 1440) * 100}%`,
    "--note-y": `${(y / 1000) * 100}%`,
    "--note-width": `${(width / 1440) * 100}%`,
    "--note-height": `${(height / 1000) * 100}%`,
  } as CSSProperties;

  return (
    <div
      className="cirs-tour"
      data-note={active?.id ?? "overview"}
      data-motion={motionEnabled ? "on" : "off"}
    >
      {!failed && (
        <div className="cirs-tour-controls">
          <span className="cirs-tour-label">Image notes</span>
          <div role="group" aria-label="CIRS Admissions image notes">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                aria-pressed={selected === note.id}
                aria-describedby={descriptionId}
                onClick={() =>
                  setSelected((current) => current === note.id ? null : note.id)
                }
              >
                {note.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="cirs-tour-stage">
        <img
          className="cirs-tour-image"
          src={src}
          width={1440}
          height={1000}
          alt="Admissions page — screenshot captured from the public CIRS website"
          loading="lazy"
          onError={() => setFailed(true)}
        />
        {!failed && (
          <div
            className="cirs-tour-frame"
            aria-hidden="true"
            data-visible={Boolean(active)}
            style={focusStyle}
          />
        )}
      </div>
      <p id={descriptionId} className="cirs-tour-note" role="status" aria-atomic="true">
        {failed
          ? "The capture could not load. The current Admissions Guide is linked below."
          : active?.text ?? "Application access and process guidance sit alongside the details families need to confirm with Admissions."}
      </p>
      {!failed && <CaptureInspection
        src={src}
        title="CIRS Admissions Guide"
        alt="Original 1440 by 1000 browser capture of the CIRS Admissions Guide"
        caption="Public Admissions page capture. Image-note coordinates use this same original."
      />}
    </div>
  );
}
