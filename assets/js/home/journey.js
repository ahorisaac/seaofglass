/* Index Mission Control. */
import { renderLiveNav } from "../core/live-nav.js";
const root = document.getElementById("journey-root");
const render = () => root && renderLiveNav(root, "pages/", { header: true });
render();
addEventListener("pageshow", (e) => e.persisted && render());
addEventListener("storage", render);
