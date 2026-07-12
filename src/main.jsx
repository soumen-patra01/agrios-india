import React from "react";
import { createRoot } from "react-dom/client";
import AgriOS from "./App.jsx";

// In the claude.ai artifact runtime, window.storage is provided by the host.
// In local dev / normal browsers, shim it onto localStorage so data persists.
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const value = localStorage.getItem(key);
      return value == null ? null : { value };
    },
    set: async (key, value) => {
      localStorage.setItem(key, value);
    },
  };
}

createRoot(document.getElementById("root")).render(<AgriOS />);
