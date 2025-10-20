import { loadHtml } from "../utils/htmlLoader.js";
import { navigateTo } from "../router/router.js";

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
  localStorage.removeItem("isLogin")

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

  const noLogin = document.querySelector("#tournament-link")
  noLogin?.addEventListener("click", () => {
    localStorage.removeItem("LocalTournamentState");
    localStorage.removeItem("LocalTournamentPlayersInfo");
    localStorage.setItem("isLogin", "false")
    navigateTo("/tournament?type=local", container);
  })
}
