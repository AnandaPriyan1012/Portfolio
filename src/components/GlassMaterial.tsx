import { useId } from "react";
import "./glass-material.css";

/** Thin optical edges follow the actual project glass, never a separate shape. */
export default function GlassMaterial() {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className="glass-material"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop
            offset="0"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".34"
          />
          <stop
            offset=".31"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".035"
          />
          <stop
            offset=".72"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".18"
          />
          <stop
            offset="1"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".025"
          />
        </linearGradient>
        <linearGradient id={`${id}-smoke`} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".009"
          />
          <stop
            offset=".42"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity="0"
          />
          <stop
            offset="1"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".015"
          />
        </linearGradient>
      </defs>
      <path
        className="material-pane"
        fill={`url(#${id}-smoke)`}
        stroke={`url(#${id}-edge)`}
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="material-inner-edge"
        fill="none"
        stroke={`url(#${id}-edge)`}
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="material-film-edge"
        fill="none"
        stroke="var(--material-light, #d3aa7f)"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
