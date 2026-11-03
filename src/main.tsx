import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/standard-italic.css";
import App from "./App";
import "./styles.css";
import "./atelier-preview.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
