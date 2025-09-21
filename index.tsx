
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is available. Although used in reducer, good to have it here.

// A simple way to make uuid available globally if needed, though direct import is better.
(window as any).uuidv4 = uuidv4;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
