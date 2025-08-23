import { loadHtml } from "../utils/htmlLoader.js";
import { getUsers } from "../services/userService.js";

export async function renderStats(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/stats.html");

}
