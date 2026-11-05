import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowDownToLine, ArrowRight } from "lucide-react";

type Device = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
  deviceMemory?: number;
};

/** A personal calling card. The original AP image supplies the foil's shape. */
export default function IdentityCard({
  email,
  motionEnabled,
}: {
  email: string;
  motionEnabled: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const signatureButton = useRef<HTMLButtonElement>(null);
  const contactButton = useRef<HTMLButtonElement>(null);
  const focusAfterTurn = useRef<HTMLButtonElement | null>(null);
  const restoreTurnFocus = useRef(false);
  const [contactSide, setContactSide] = useState(false);
  const [settledSide, setSettledSide] = useState(false);
  const [turning, setTurning] = useState(false);
  const [animated, setAnimated] = useState(false);
  const faceId = useId();

  const turnCard = (event: MouseEvent<HTMLButtonElement>) => {
    if (turning) return;
    focusAfterTurn.current = event.detail === 0 ? event.currentTarget : null;
    const next = !contactSide;
    setContactSide(next);
    if (animated) setTurning(true);
    else {
      restoreTurnFocus.current = Boolean(focusAfterTurn.current);
      setSettledSide(next);
    }
  };

  const finishTurn = useCallback(() => {
    const trigger = focusAfterTurn.current;
    // Let Tab, a click elsewhere or another deliberate focus move keep control.
    restoreTurnFocus.current = Boolean(trigger &&
      (document.activeElement === trigger || document.activeElement === document.body));
    setSettledSide(contactSide);
    setTurning(false);
  }, [contactSide]);

  useLayoutEffect(() => {
    if (turning || !restoreTurnFocus.current) return;
    restoreTurnFocus.current = false;
    focusAfterTurn.current = null;
    const nextButton = settledSide ? contactButton : signatureButton;
    nextButton.current?.focus({ preventScroll: true });
  }, [settledSide, turning]);

  useEffect(() => {
    if (!turning) return;
    if (!animated) {
      finishTurn();
      return;
    }
    // A background tab or a motion preference change can cancel transitionend.
    const fallback = window.setTimeout(finishTurn, 900);
    return () => window.clearTimeout(fallback);
  }, [turning, animated, finishTurn]);

  useEffect(() => {
    const host = root.current;
    const surface = stage.current;
    if (!host || !surface) return;
    const fine = matchMedia("(pointer: fine) and (hover: hover)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = matchMedia("(forced-colors: active)");
    const device = navigator as Device;
    let capable = false;
    let frame = 0;
    let x = 0.5;
    let y = 0.5;

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      host.style.removeProperty("--card-rx");
      host.style.removeProperty("--card-ry");
      host.style.removeProperty("--card-foil-x");
      host.style.removeProperty("--card-foil-y");
    };
    const sync = () => {
      const lowPower =
        device.connection?.saveData ||
        (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) ||
        (device.deviceMemory && device.deviceMemory <= 2);
      const allowTurn = Boolean(motionEnabled && !reduced.matches &&
        !contrast.matches && !lowPower);
      setAnimated(allowTurn);
      capable = allowTurn && fine.matches;
      host.dataset.tilt = capable ? "enabled" : "disabled";
      if (!capable) reset();
    };
    const move = (event: PointerEvent) => {
      if (!capable || event.pointerType !== "mouse") return;
      const bounds = surface.getBoundingClientRect();
      x = Math.max(
        0,
        Math.min(1, (event.clientX - bounds.left) / bounds.width),
      );
      y = Math.max(
        0,
        Math.min(1, (event.clientY - bounds.top) / bounds.height),
      );
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        host.style.setProperty("--card-rx", `${(0.5 - y) * 8}deg`);
        host.style.setProperty("--card-ry", `${(x - 0.5) * 10}deg`);
        host.style.setProperty("--card-foil-x", `${x * 100}%`);
        host.style.setProperty("--card-foil-y", `${y * 100}%`);
      });
    };
    sync();
    surface.addEventListener("pointermove", move, { passive: true });
    surface.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    contrast.addEventListener("change", sync);
    device.connection?.addEventListener?.("change", sync);
    return () => {
      reset();
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      contrast.removeEventListener("change", sync);
      device.connection?.removeEventListener?.("change", sync);
    };
  }, [motionEnabled]);

  const contactFile = [
    "BEGIN:VCARD",
    "VERSION:4.0",
    "FN:Ananda Priyan",
    `EMAIL:${email}`,
    "URL:https://anandapriyan.vercel.app",
    "END:VCARD",
    "",
  ].join("\r\n");

  return (
    <figure
      className="identity-card"
      ref={root}
      aria-label="Ananda Priyan personal card"
      data-side={contactSide ? "contact" : "signature"}
      data-motion={animated ? "on" : "off"}
      data-turning={turning ? "true" : "false"}
    >
      <div className="identity-card-stage" ref={stage}>
        <div className="identity-card-motion">
          <div className="identity-card-turn" onTransitionEnd={event => {
            if (turning && event.target === event.currentTarget && event.propertyName === "transform") finishTurn();
          }}>
            <div
              id={`${faceId}-signature`}
              className="identity-card-face identity-card-front"
              aria-hidden={settledSide}
              inert={settledSide}
            >
              <button
                ref={signatureButton}
                className="identity-card-flip"
                type="button"
                aria-label="Show contact side"
                aria-controls={`${faceId}-contact`}
                onClick={turnCard}
              />
              <div className="identity-card-topline">
                <span>A personal introduction</span>
                <span
                  className="identity-card-gilded-rule"
                  aria-hidden="true"
                />
              </div>
              <span className="identity-card-mark" aria-hidden="true">
                <img
                  src="/media/ap-signature.png"
                  alt=""
                  width="212"
                  height="113"
                  loading="lazy"
                />
              </span>
              <div className="identity-card-nameplate">
                <p>Ananda Priyan</p>
                <span>Web / Film / Community</span>
              </div>
              <span className="identity-card-engraving" aria-hidden="true" />
            </div>
            <div
              id={`${faceId}-contact`}
              className="identity-card-face identity-card-back"
              aria-hidden={!settledSide}
              inert={!settledSide}
            >
              <button
                ref={contactButton}
                className="identity-card-flip"
                type="button"
                aria-label="Show signature side"
                aria-controls={`${faceId}-signature`}
                onClick={turnCard}
              />
              <div className="identity-card-topline">
                <span>Ananda Priyan / Contact</span>
                <span
                  className="identity-card-gilded-rule"
                  aria-hidden="true"
                />
              </div>
              <p className="identity-card-invitation">
                A conversation
                <br />
                <em>starts here.</em>
              </p>
              <a href={`mailto:${email}`} className="identity-card-email">
                {email}
                <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="identity-card-caption">
        <span className="identity-card-side-note" aria-live="polite">
          Personal card / {settledSide ? "Contact" : "Signature"}
        </span>
        <div className="identity-card-controls">
          <a
            href={`data:text/vcard;charset=utf-8,${encodeURIComponent(contactFile)}`}
            download="ananda-priyan.vcf"
          >
            <ArrowDownToLine size={14} aria-hidden="true" />
            Save contact
          </a>
        </div>
      </figcaption>
    </figure>
  );
}
