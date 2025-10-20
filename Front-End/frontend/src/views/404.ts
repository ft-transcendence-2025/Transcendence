import { loadHtml } from "../utils/htmlLoader.js";

// 404 Not Found View
export async function render404(container: HTMLElement | null) {
  if (!container) return;

  // Hide the navbar on 404 page (like home page)
  const navbar = document.getElementById("navbar");
  if (navbar) {
    navbar.classList.add("hidden");
  }

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/404.html");
}
