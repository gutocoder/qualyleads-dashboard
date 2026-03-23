import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Onboarding from "./Onboarding.jsx";

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {path === "/onboarding" ? <Onboarding /> : <App />}
  </React.StrictMode>
);
