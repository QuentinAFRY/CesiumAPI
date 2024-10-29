import * as React from "react"
import * as ReactDOM from "react-dom/client"
import App from "./App";
import Viewer from "./workingFiles/Viewer";

const rootElement = document.getElementById("root") as HTMLDivElement | null;

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <>
      <App/>
    </>
  );
} else {
  console.error("Failed to find the root element with ID 'App'.");
}