import { loadHtml } from "../utils/htmlLoader.js";

export async function renderNavbar(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/navbar.html");

  // Add event listeners for navigation links
}
