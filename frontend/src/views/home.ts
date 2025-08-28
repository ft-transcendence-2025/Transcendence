import { loadHtml } from "../utils/htmlLoader.js";

export async function renderHome(
  container: HTMLElement | null,
  hideAnimations = false,
) {
  if (!container) return;

  // Hide the navbar on home page
  const navbar = document.getElementById("navbar");
  if (navbar) {
    navbar.classList.add("hidden");
  }

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/home.html");

  // Hide animations if requested (for backdrops)
  if (hideAnimations) {
    const animatedElements = container.querySelectorAll(
      ".animate-paddle-left, .animate-paddle-right, .animate-pong-ball",
    );
    animatedElements.forEach((element) => {
      element.classList.add("hidden");
    });
  }
}
