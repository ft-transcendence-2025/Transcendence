import { loadHtml } from "../utils/htmlLoader.js";

export async function renderStats(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/stats.html");

}
