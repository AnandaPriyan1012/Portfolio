import { useId, useLayoutEffect, useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import "./capture-inspection.css";

type Props = {
  src: string;
  mobileSrc?: string;
  alt: string;
  title: string;
  caption?: string;
};

function localCapture(src: string) {
  return /^\/media\/[a-z0-9][a-z0-9_./-]*\.(?:webp|png|jpe?g)$/i.test(src) &&
    !src.includes("..");
}

export default function CaptureInspection({ src, mobileSrc, alt, title, caption }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const closeTouch = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  function close() {
    const modal = dialog.current;
    if (!modal) return;
    if (modal.open) modal.close();
    setSource(null);
    setZoomed(false);
    // close events are queued; React may unmount the dialog before they run.
    if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
  }

  useLayoutEffect(() => {
    const cover = (event: Event) => {
      if ((event as CustomEvent<{ active: boolean }>).detail?.active) close();
    };
    window.addEventListener("ap:openingchange", cover);
    return () => {
      // Remove the top layer synchronously before a route's AP opening.
      dialog.current?.close();
      window.removeEventListener("ap:openingchange", cover);
    };
  }, []);

  useLayoutEffect(() => {
    if (!source || !dialog.current) return;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.showModal();
    return () => {
      if (modal.open) modal.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [source]);

  if (!localCapture(src) || (mobileSrc && !localCapture(mobileSrc))) return null;

  return (
    <>
      <button
        ref={opener}
        className="capture-inspection-open"
        type="button"
        aria-label={`View larger capture: ${title}`}
        onClick={() => {
          setLoaded(false);
          setFailed(false);
          setZoomed(false);
          setSource(mobileSrc && matchMedia("(max-width: 767px)").matches ? mobileSrc : src);
        }}
      >
        <Expand size={15} aria-hidden="true" /> View larger capture
      </button>
      {source && (
        <dialog
          ref={dialog}
          className="atelier-dialog capture-inspection-dialog"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-caption`}
          data-lenis-prevent
          onClose={() => {
            setSource(null);
            setZoomed(false);
            // Native close already restores focus in most browsers. This
            // preventScroll fallback also preserves the case reading position.
            if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <header className="capture-inspection-header">
            <h2 id={`${id}-title`}>{title}</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close capture"
              onTouchStart={(event) => {
                const touch = event.touches[0];
                closeTouch.current = event.touches.length === 1
                  ? { id: touch.identifier, x: touch.clientX, y: touch.clientY, moved: false } : null;
              }}
              onTouchMove={(event) => {
                const start = closeTouch.current;
                const touch = event.touches[0];
                if (event.touches.length !== 1 || touch.identifier !== start?.id) closeTouch.current = null;
                else if (start && Math.hypot(touch.clientX - start.x, touch.clientY - start.y) >= 8) start.moved = true;
              }}
              onTouchCancel={() => { closeTouch.current = null; }}
              onTouchEnd={(event) => {
                const start = closeTouch.current;
                closeTouch.current = null;
                const touch = event.changedTouches[0];
                // Chromium can suppress the next compatibility click during
                // image-scroll momentum. Cancel the touchend default before
                // removing the top layer, so it cannot click the page below.
                if (start && !start.moved && event.touches.length === 0 && touch.identifier === start.id &&
                    Math.hypot(touch.clientX - start.x, touch.clientY - start.y) < 8) {
                  event.preventDefault();
                  close();
                }
              }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="capture-inspection-toolbar">
            <button
              type="button"
              disabled={!loaded || failed}
              aria-pressed={zoomed}
              aria-controls={`${id}-viewport`}
              onClick={() => {
                setZoomed((current) => !current);
                viewport.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
            >
              {zoomed ? "Fit whole image" : "Actual size (100%)"}
            </button>
            <a href={source} target="_blank" rel="noopener noreferrer">Open original image</a>
          </div>
          <div
            ref={viewport}
            id={`${id}-viewport`}
            className="capture-inspection-viewport"
            data-zoom={zoomed ? "actual" : "fit"}
            role="region"
            aria-label="Capture inspection area"
            tabIndex={0}
          >
            {failed ? (
              <p className="capture-inspection-error">This capture could not load. Open the original image to try it directly.</p>
            ) : (
              <img
                className="capture-inspection-image"
                src={source}
                alt={alt}
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
              />
            )}
          </div>
          <p className="capture-inspection-caption" id={`${id}-caption`}>
            {caption ?? "Original browser capture."} {zoomed ? "Scroll to inspect the image at its original pixel size." : "The whole capture is shown. Choose actual size to inspect details."}
          </p>
        </dialog>
      )}
    </>
  );
}
