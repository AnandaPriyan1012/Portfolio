import { useId, useLayoutEffect, useState, type CSSProperties } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./cirs-admissions-tour.css";
import CaptureInspection from "./CaptureInspection";

// Bounds refer to the actual 1440 × 1000 public capture, excluding its frame.
const notes = [
  {
    id: "portal",
    label: "Portal",
    workLabel: "Application portal",
    workDescription: "A route for registered families.",
    bounds: [118, 799, 230, 53],
    text: "Registered Portal Login is the main action. The application summary asks families to confirm the intake before submitting.",
  },
  {
    id: "process",
    label: "Process",
    workLabel: "Admissions process",
    workDescription: "Entry and application information.",
    bounds: [376, 813, 177, 27],
    text: "Understand the process sits beside the portal, giving the guidance its own route from the introduction.",
  },
  {
    id: "enquiries",
    label: "Enquiries",
    workLabel: "School enquiries",
    workDescription: "Dates and assessment arrangements.",
    bounds: [117, 881, 961, 95],
    text: "Entry-class availability and dates or assessment need confirmation. The introduction directs current details to the Admissions Office.",
  },
] as const;

type Props = { src: string; motionEnabled?: boolean; presentation?: "case" | "work" };

export default function CirsAdmissionsTour({ src, motionEnabled = false, presentation = "case" }: Props) {
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
  const work = presentation === "work";
  useLayoutEffect(() => {
    if (work) ScrollTrigger.refresh();
  }, [work, selected, failed]);
  const image = (
    <div className="cirs-tour-stage">
      <img className="cirs-tour-image" src={src} width={1440} height={1000}
        alt={work ? "The real CIRS Admissions page" : "Admissions page — screenshot captured from the public CIRS website"}
        loading="lazy" decoding="async" onError={() => setFailed(true)} />
      {!failed && <div className="cirs-tour-frame" aria-hidden="true" data-visible={Boolean(active)} style={focusStyle} />}
    </div>
  );

  return (
    <div
      className="cirs-tour"
      data-note={active?.id ?? "overview"}
      data-motion={motionEnabled ? "on" : "off"}
      data-presentation={presentation}
    >
      {!work && !failed && (
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
      {work ? <figure className="admissions-detail">{image}
        <figcaption>The Admissions page · cirschool.org/admissions.html</figcaption>
      </figure> : image}
      {work && !failed && <ol className="cirs-interface-map" aria-label="CIRS Admissions image notes">
        {notes.map((note, index) => <li key={note.id}>
          <button type="button" aria-label={note.workLabel} aria-pressed={selected === note.id}
            aria-describedby={descriptionId} onClick={() => setSelected((current) => current === note.id ? null : note.id)}>
            <span aria-hidden="true">0{index + 1}</span><strong>{note.workLabel}</strong><small>{note.workDescription}</small>
          </button>
        </li>)}
      </ol>}
      <p id={descriptionId} className="cirs-tour-note" role="status" aria-atomic="true">
        {failed
          ? work ? "The capture could not load. The current Admissions Guide is linked alongside this image." : "The capture could not load. The current Admissions Guide is linked below."
          : active?.text ?? "Application access and process guidance sit alongside the details families need to confirm with Admissions."}
      </p>
      {!failed && <CaptureInspection
        src={src}
        title="CIRS Admissions Guide"
        alt="Original 1440 by 1000 browser capture of the CIRS Admissions Guide"
        caption="Public Admissions page capture. Image-note coordinates use this same original."
        detail={active ? { label: active.label, bounds: active.bounds, sourceWidth: 1440, sourceHeight: 1000 } : undefined}
      />}
    </div>
  );
}
