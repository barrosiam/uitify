import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import GeneralToast from "./components/toast/GeneralToast.tsx";
import SimpleHeader from "./components/layout/header";
import logoUrl from "./assets/uitify-logo.svg";
import docs from "./docs/FE-Developer-HW.pdf";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GeneralToast />
    <SimpleHeader
      logoSrc={logoUrl}
      logoAlt="Uitify Logo"
      items={[
        { label: "About", href: "https://uitify.com/" },
        { label: "README", href: "https://github.com/barrosiam/uitify" },
        { label: "Docs", href: docs },
      ]}
    />
    <main id="main" className="mx-auto max-w-6xl p-2">
      {" "}
      <App />{" "}
    </main>
  </StrictMode>,
);
