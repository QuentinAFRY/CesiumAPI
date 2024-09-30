import * as React from "react"
import * as ReactDOM from "react-dom/client"
import Viewer from "./Viewer"
import { WorldProvider } from "./Viewer";

const rootElement = document.getElementById("App") as HTMLDivElement | null;

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <>
      <WorldProvider>
        <Viewer />
      </WorldProvider>
    </>
  );
} else {
  console.error("Failed to find the root element with ID 'App'.");
}
