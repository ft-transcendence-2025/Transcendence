import { loadHtml } from "../utils/htmlLoader.js";
import { navigateTo } from "../router/router.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
  getCurrentUsername,
} from "../utils/userUtils.js";

export async function renderRemoteTournamentLobby(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/remoteTournamentLobby.html");

  fetchRemoteTournament();
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

async function fetchRemoteTournament() {
  try {
    const name: string = await getUserDisplayName();
    if (name == undefined)
      return ;
    console.log("Name:", name);
    const baseUrl = window.location.origin;

    const response = await fetch(`${baseUrl}/api/tournament/remote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
      }),
    });
    const tournamentState = await response.json();
    console.log("Tournament State:", tournamentState);
  } catch (e) {
    console.error("Failed to fetch tournament:", e);
  }
}

