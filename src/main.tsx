import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const __tauriWindow = window as {
  enableCORSFetch?: (v: boolean) => void;
};
if (__tauriWindow?.enableCORSFetch) {
  __tauriWindow.enableCORSFetch(true);
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
