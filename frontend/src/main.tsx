import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

// Find the root element
const container = document.getElementById("root") as HTMLElement;

// Create a root
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);