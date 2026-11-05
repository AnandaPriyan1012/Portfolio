import { ArrowLeft, ArrowRight } from "lucide-react";
import "./capture-navigation.css";

export default function CaptureNavigation({ labels, index, onSelect, label }: {
  labels: readonly string[];
  index: number;
  onSelect: (index: number) => void;
  label: string;
}) {
  const previous = index > 0 ? labels[index - 1] : undefined;
  const next = index < labels.length - 1 ? labels[index + 1] : undefined;
  return (
    <nav className="capture-navigation" aria-label={label}>
      <div className="capture-navigation-current"><span>{String(index + 1).padStart(2, "0")} / {String(labels.length).padStart(2, "0")} captured views</span><strong>{labels[index]}</strong></div>
      <button type="button" className="capture-previous" disabled={!previous}
        aria-label={previous ? `Previous capture: ${previous}` : "Previous capture"}
        onClick={() => { if (previous) onSelect(index - 1); }}>
        <ArrowLeft size={16} aria-hidden="true" /><span>Previous capture<strong>{previous ?? "First view"}</strong></span>
      </button>
      <button type="button" className="capture-next" disabled={!next}
        aria-label={next ? `Next capture: ${next}` : "Next capture"}
        onClick={() => { if (next) onSelect(index + 1); }}>
        <span>Next capture<strong>{next ?? "Last view"}</strong></span><ArrowRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
