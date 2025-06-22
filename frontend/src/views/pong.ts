import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";

export async function renderPong(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/pong.html");
}
