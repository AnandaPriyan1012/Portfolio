import { Menu, X } from "lucide-react";
import Signature from "./Signature";

type Props = {
  activeSection: string;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onNavigate: (id: string) => void;
  currentPage?: "home" | "work" | "studio" | "about";
  onHome?: () => void;
  objectsAsNavigation?: boolean;
};

const chapters = [
  { id: "work", label: "Work", href: "/work" },
  { id: "about", label: "About", href: "/about" },
  { id: "contact", label: "Contact", href: "/about#contact" },
];

const pageCaptions = {
  home: "Selected portfolio",
  work: "Selected projects",
  studio: "Screening room",
  about: "About & contact",
};

/** A quiet glass chapter index; the mobile menu remains an ordinary disclosure. */
export default function AtelierNavigation({
  activeSection,
  menuOpen,
  onMenuToggle,
  onNavigate,
  currentPage = "home",
  onHome,
  objectsAsNavigation = false,
}: Props) {
  return (
    <header className="site-header atelier-navigation" data-desk={objectsAsNavigation || undefined}>
      <a
        className="wordmark"
        href="/"
        aria-label="Ananda Priyan, home"
        aria-current={currentPage === "home" ? "page" : undefined}
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          if (onHome) {
            event.preventDefault();
            onHome();
          }
        }}
      >
        <Signature />
      </a>
      <span className="navigation-caption" aria-hidden="true">
        Ananda Priyan{!objectsAsNavigation && <span>{pageCaptions[currentPage]}</span>}
      </span>
      {!objectsAsNavigation && <button
        className="menu-button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onClick={onMenuToggle}
      >
        <span>{menuOpen ? "Close" : "Menu"}</span>
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>}
      {!objectsAsNavigation && <nav
        id="site-nav"
        className={menuOpen ? "main-nav is-open" : "main-nav"}
        aria-label="Main navigation"
      >
        {chapters.map((chapter) => (
          <a
            key={chapter.id}
            href={chapter.href}
            aria-current={activeSection === chapter.id ? "location" : undefined}
            onClick={(event) => {
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              onNavigate(chapter.id);
            }}
          >
            {chapter.label}
          </a>
        ))}
      </nav>}
    </header>
  );
}
