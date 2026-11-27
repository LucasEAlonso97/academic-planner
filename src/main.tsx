import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { loadCareer } from "./data/career";
import { loadStored } from "./store/persistence";

// Antes de arrancar se descarga solo la carrera que la persona usa.
async function start() {
  await loadCareer(loadStored().activeCareerId);

  const { default: App } = await import("./App");

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void start();
