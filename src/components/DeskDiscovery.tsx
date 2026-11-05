import { useId, useRef, useState } from "react";
import { Shuffle } from "lucide-react";
import "./desk-discovery.css";

export type Destination = "/work" | "/projects/cirs" | "/projects/community" | "/projects/accuflow" | "/studio" | "/about#contact";
export type DiscoveryProject = { id: string; title: string; href: Destination; action: string };
export type DeskDiscoveryProps = {
  projects: readonly DiscoveryProject[];
  visited: readonly string[];
  onChoose: (id: string) => void;
};

/** Deal a real destination, preferring work this visitor has yet to explore. */
export default function DeskDiscovery({ projects, visited, onChoose }: DeskDiscoveryProps) {
  const statusId = useId();
  const previous = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const explored = projects.filter(project => visited.includes(project.id)).length;

  function choose() {
    const unseen = projects.filter(project => !visited.includes(project.id));
    const pool = unseen.length ? unseen : projects;
    const different = pool.filter(project => project.id !== previous.current);
    const choices = different.length ? different : pool;
    if (!choices.length) return;
    const project = choices[Math.floor(Math.random() * choices.length)];
    previous.current = project.id;
    setAnnouncement(`Your pick: ${project.title}. ${project.action}.`);
    onChoose(project.id);
  }

  return <div className="desk-discovery">
    <button className="desk-discovery-button" type="button" onClick={choose} disabled={!projects.length} aria-describedby={statusId}>
      <span className="desk-discovery-dial" aria-hidden="true"><Shuffle size={16} strokeWidth={1.6} /></span>
      <span>Pick a project</span>
    </button>
    <span className="desk-discovery-progress" id={statusId}><span>{explored.toString().padStart(2, "0")}</span> / {projects.length.toString().padStart(2, "0")} explored</span>
    <span className="desk-discovery-announcement" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
  </div>;
}
