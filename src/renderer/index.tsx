import { render } from "preact";
import { App } from "./App.tsx";

// oxlint-disable-next-line import/no-unassigned-import
import "bootstrap/dist/css/bootstrap.min.css";
// oxlint-disable-next-line import/no-unassigned-import
import "./styles.css";

const root = globalThis.document.querySelector("#root");

if (root == null) {
    throw new Error("Root element not found");
}

render(<App />, root);
