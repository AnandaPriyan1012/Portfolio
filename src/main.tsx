import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/standard-italic.css";
import App from "./App";
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
