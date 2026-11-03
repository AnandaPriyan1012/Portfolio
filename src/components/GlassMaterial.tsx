import { useId } from "react";
import "./glass-material.css";

/** A single decorative material carried between the semantic project scenes. */
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
            stopOpacity=".76"
          />
          <stop
            offset=".31"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".12"
          />
          <stop
            offset=".72"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".5"
          />
          <stop
            offset="1"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".08"
          />
        </linearGradient>
        <linearGradient id={`${id}-smoke`} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".022"
          />
          <stop
            offset=".42"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity="0"
          />
          <stop
            offset="1"
            stopColor="var(--material-light, #e2d4bd)"
            stopOpacity=".035"
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
