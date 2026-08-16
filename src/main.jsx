import React from "react";
import ReactDOM from "react-dom/client";
import Storefront from "./Storefront.jsx";
import Admin from "./Admin.jsx";

// Simpele routing zonder extra library: /beheer toont het beheerpaneel,
// elk ander pad toont de winkel.
const isAdmin = window.location.pathname.replace(/\/+$/, "") === "/beheer";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{isAdmin ? <Admin /> : <Storefront />}</React.StrictMode>
);
