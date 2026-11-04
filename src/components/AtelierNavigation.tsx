import { Menu, X } from "lucide-react";
import Signature from "./Signature";

type Props = {
  activeSection: string;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onNavigate: (id: string) => void;
  currentPage?: "home" | "work" | "studio" | "about";
  onHome?: () => void;
};

const chapters = [
  { id: "work", label: "Work", number: "01", href: "/work" },
  { id: "studio", label: "Studio", number: "02", href: "/studio" },
  { id: "about", label: "About", number: "03", href: "/about" },
  { id: "contact", label: "Contact", number: "04", href: "/about#contact" },
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
}: Props) {
  return (
    <header className="site-header atelier-navigation">
      <a
        className="wordmark"
        href="/"
        aria-label="Ananda Priyan, home"
        aria-current={currentPage === "home" ? "page" : undefined}
        onClick={(event) => {
          if (
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
        Ananda Priyan<span>{pageCaptions[currentPage]}</span>
      </span>
      <nav
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
            <span
              className="navigation-number"
              data-number={chapter.number}
              aria-hidden="true"
            />
            {chapter.label}
            <span className="navigation-light" aria-hidden="true" />
          </a>
        ))}
      </nav>
      <button
        className="menu-button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onClick={onMenuToggle}
      >
        <span>{menuOpen ? "Close" : "Menu"}</span>
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
    </header>
  );
}
