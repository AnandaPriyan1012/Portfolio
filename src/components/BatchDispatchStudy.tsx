import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import "./batch-dispatch-study.css";

type Step = { arrived: number; dispatched: boolean; playing: boolean };
type Device = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
  deviceMemory?: number;
};
const bounded = (value: number, low: number, high: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(high, Math.max(low, Math.round(value))) : fallback;
const minutes = (value: number) => value.toFixed(1);

/** An original illustration of the portfolio's separate, deterministic lab model. */
export default function BatchDispatchStudy({ rate, batch, motionEnabled }: {
  rate: number;
  batch: number;
  motionEnabled: boolean;
}) {
  const id = useId();
  const host = useRef<HTMLElement>(null);
  const timer = useRef<number | null>(null);
  const permitted = useRef(false);
  const count = bounded(batch, 2, 4, 2);
  const arrivalRate = bounded(rate, 1, 12, 4);
  const interval = 10 / arrivalRate;
  const departure = (count - 1) * interval;
  const [step, setStep] = useState<Step>({ arrived: count, dispatched: true, playing: false });
  const current = useRef(step);
  const model = useRef(`${arrivalRate}:${count}`);
  const [capable, setCapable] = useState(false);
  const [notice, setNotice] = useState("");
  const [groupAnimation, setGroupAnimation] = useState(false);

  function clearTimer() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }
  function commit(next: Step) {
    const previous = current.current;
    if (previous.arrived === next.arrived && previous.dispatched === next.dispatched && previous.playing === next.playing) return;
    current.current = next;
    setStep(next);
  }
  function finish(message?: string, animateGroup = false) {
    clearTimer();
    setGroupAnimation(animateGroup && permitted.current);
    commit({ arrived: count, dispatched: true, playing: false });
    setNotice(message ?? "");
  }

  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    setGroupAnimation(false);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = matchMedia("(forced-colors: active)");
    const device = navigator as Device;
    const ancestors: HTMLDetailsElement[] = [];
    for (let parent = element.parentElement; parent; parent = parent.parentElement)
      if (parent instanceof HTMLDetailsElement) ancestors.push(parent);
    let visible = false;
    let disposed = false;
    let opening = document.documentElement.dataset.opening === "active";
    const sync = () => {
      if (disposed) return;
      const lowPower = Boolean(device.connection?.saveData ||
        (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) ||
        (device.deviceMemory && device.deviceMemory <= 2));
      const allowed = Boolean(motionEnabled && !reduced.matches && !contrast.matches && !lowPower &&
        visible && !document.hidden && !opening && ancestors.every((parent) => parent.open) &&
        !document.querySelector("dialog[open]"));
      permitted.current = allowed;
      setCapable((previous) => previous === allowed ? previous : allowed);
      if (!allowed) {
        setGroupAnimation(false);
        if (current.current.playing || !current.current.dispatched) finish();
      }
    };
    if (model.current !== `${arrivalRate}:${count}`) {
      model.current = `${arrivalRate}:${count}`;
      finish();
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(element);
    const beforeToggle = (event: Event) => {
      if (event.target instanceof HTMLDialogElement && (event as ToggleEvent).newState === "open") {
        permitted.current = false;
        setCapable(false);
        setGroupAnimation(false);
        if (current.current.playing || !current.current.dispatched) finish();
      }
    };
    const coveredFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest("dialog[open]")) sync();
    };
    const openingChange = (event: Event) => {
      opening = Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active);
      sync();
    };
    reduced.addEventListener("change", sync);
    contrast.addEventListener("change", sync);
    device.connection?.addEventListener?.("change", sync);
    ancestors.forEach((parent) => parent.addEventListener("toggle", sync));
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("beforetoggle", beforeToggle, true);
    document.addEventListener("toggle", sync, true);
    document.addEventListener("focusin", coveredFocus);
    window.addEventListener("ap:openingchange", openingChange);
    sync();
    return () => {
      disposed = true;
      element.dataset.groupAnimation = "false";
      permitted.current = false;
      clearTimer();
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      contrast.removeEventListener("change", sync);
      device.connection?.removeEventListener?.("change", sync);
      ancestors.forEach((parent) => parent.removeEventListener("toggle", sync));
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("beforetoggle", beforeToggle, true);
      document.removeEventListener("toggle", sync, true);
      document.removeEventListener("focusin", coveredFocus);
      window.removeEventListener("ap:openingchange", openingChange);
    };
  }, [arrivalRate, count, motionEnabled]);

  function queueArrival(arrived: number) {
    timer.current = window.setTimeout(() => {
      timer.current = null;
      if (!permitted.current || document.hidden || !current.current.playing) { finish(); return; }
      if (arrived < count) {
        commit({ arrived: arrived + 1, dispatched: false, playing: true });
        queueArrival(arrived + 1);
      } else finish(`Batch complete. All ${count} model orders share one journey.`, permitted.current);
    }, arrived < count ? 600 : 400);
  }
  function restartSteps() {
    clearTimer();
    setGroupAnimation(false);
    commit({ arrived: 1, dispatched: false, playing: false });
    setNotice("Step 1. The first model order arrives at 0.0 minutes.");
  }
  function replay() {
    if (current.current.playing) { finish("Replay stopped. The complete model is shown."); return; }
    if (!permitted.current) { restartSteps(); return; }
    clearTimer();
    setGroupAnimation(false);
    commit({ arrived: 1, dispatched: false, playing: true });
    setNotice("Replay started. Arrival steps use compressed timing.");
    queueArrival(1);
  }
  function advance() {
    clearTimer();
    setGroupAnimation(false);
    if (current.current.dispatched) { restartSteps(); return; }
    if (current.current.arrived < count) {
      const arrived = current.current.arrived + 1;
      commit({ arrived, dispatched: false, playing: false });
      setNotice(`Order ${arrived} arrives at ${minutes((arrived - 1) * interval)} model minutes.${arrived === count ? " The batch is ready to dispatch." : ""}`);
    } else finish(`The model batch dispatches at ${minutes(departure)} minutes. All ${count} orders share one journey.`, permitted.current);
  }

  const phase = step.dispatched ? "complete" : step.arrived === count ? "ready" : "collecting";
  const clock = (step.dispatched ? count - 1 : step.arrived - 1) * interval;
  return (
    <section ref={host} className="batch-dispatch-study" aria-labelledby={`${id}-title`}
      data-phase={phase} data-playing={step.playing} data-arrived={step.arrived} data-motion={capable ? "on" : "off"}
      data-group-animation={groupAnimation}
      style={{ "--batch-orders": count } as CSSProperties}>
      <header className="batch-study-heading">
        <div><span className="batch-study-kicker">Illustration of this model</span><h5 id={`${id}-title`}>Arrive separately.<br />Share one journey.</h5></div>
        <div className="batch-study-clock"><span>Batching clock</span><strong>{minutes(clock)}<small>model min</small></strong></div>
      </header>
      <p className="batch-study-qualification">Illustrative, compressed steps. Batching time, not flight time.</p>
      <ol className="batch-order-list" aria-label="Planned orders in this illustrative batch">
        {Array.from({ length: count }, (_, index) => (
          <li className="batch-order" key={index} data-order={index + 1} data-arrived={index < step.arrived}>
            <span className="batch-order-name"><span aria-hidden="true">0{index + 1}</span>Order {index + 1}<i aria-hidden="true" /></span>
            <dl><div><dt>Planned arrival</dt><dd>{minutes(index * interval)} min</dd></div>
              <div><dt>Planned wait</dt><dd>{minutes(departure - index * interval)} min</dd></div></dl>
          </li>
        ))}
      </ol>
      <div className="batch-shared-journey" data-dispatched={step.dispatched}>
        <span className="batch-join-line" aria-hidden="true" />
        <span className="batch-shared-symbol" aria-hidden="true">
          <span className="batch-packet-pool">
            {Array.from({ length: count }, (_, index) => <i key={index} className="batch-packet"
              data-arrived={index < step.arrived} style={{ "--packet-spread": `${index * 42 / (count - 1)}px`, "--packet-group": `${18 + index * 2}px` } as CSSProperties} />)}
          </span>
          {count}<span>→</span>1
        </span>
        <p><strong>One shared journey</strong><span>Shared dispatch at {minutes(departure)} model min.</span></p>
      </div>
      <p className="batch-cost-explanation">Assumed trip: 12 demo credits ÷ {count} orders + 2 per order = <strong>{(12 / count + 2).toFixed(1)} demo credits per order.</strong></p>
      <div className="batch-study-controls">
        <button className="batch-replay" type="button" onClick={replay}>{step.playing ? "Stop replay" : capable ? "Replay batch" : "Restart steps"}</button>
        <button className="batch-step" type="button" onClick={advance}>{step.dispatched ? "Step through" : step.arrived < count ? "Next arrival" : "Dispatch batch"}</button>
      </div>
      <p className="batch-study-notice" role="status" aria-atomic="true">{notice}</p>
    </section>
  );
}
