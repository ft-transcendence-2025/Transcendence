import { loadHtml } from "../utils/htmlLoader.js";
import { navigateTo } from "../router/router.js";

export async function renderRemoteTournamentLobby(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/remoteTournamentLobby.html");

  // Setup event listeners
  setupEventListeners();
}

function setupEventListeners() {
  const backButton = document.getElementById("lobby-back-to-dashboard");

  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      const container = document.getElementById("content");
      navigateTo("/dashboard", container);
    });
  }
}

  // TODO: Add Functions for remote tournament management