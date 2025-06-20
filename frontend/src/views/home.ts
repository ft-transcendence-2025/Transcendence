import { loadHtml } from "../utils/htmlLoader.js";

export async function renderHome(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/home.html");
}
