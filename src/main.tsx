import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AtelierLoader from "./components/AtelierLoader";
import "./styles.css";
import "./atelier-preview.css";
import "./glass-finish.css";
import "./cinematic-chapters.css";
import "./scroll-scenes.css";
import "./hero-film.css";
import "./components/atelier-navigation.css";
import "./components/screening-room.css";
import "./components/work-page.css";
import "./components/home-directory.css";
import "./components/interface-atlas.css";
import "./components/interactive-signature.css";
import "./components/studio-atmosphere.css";
import "./components/scroll-corridor.css";
import "./components/cirs-concept-study.css";
import "./components/community-language-study.css";
import "./multi-page.css";
import "./components/identity-card.css";
import "./typography.css";
import "./components/about-identity.css";
import "./proof-led.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <AtelierLoader />
  </React.StrictMode>,
);
