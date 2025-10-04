import { loadHtml } from   "../../utils/htmlLoader.js";
import { navigateTo } from "../../router/router.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
  getCurrentUsername,
} from "../../utils/userUtils.js";
import { TournamentState } from "./tournamentSetup.js";

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
    const data = await response.json();
    connectRemoteTournament(data.id, data.name);
  } catch (e) {
    console.error("Failed to fetch tournament:", e);
  }
}

function connectRemoteTournament(id: number, name: string) {
  let isRedirected: boolean = false;
  const url = `wss://${window.location.host}/ws/game/remotetournament/${id}/${name}`;
  const ws = new WebSocket(url);
  if (!ws) {
    console.error("Socket Connection falied at connectRemoteTournament");
    return ;
  }

  ws.addEventListener("message", (event) => {
    const tournamentState = JSON.parse(event.data) as TournamentState;
    if (!tournamentState)
      throw("gameState is undefined");
    if (isTournamentFull(tournamentState)) {
      if (isRedirected === false) {
        const container = document.getElementById("content");
        navigateTo("/tournament-tree?mode=remote", container);
      }
      isRedirected = true;
    }
  });
}

function isTournamentFull(tournamentState: TournamentState): boolean {
  if (!tournamentState)
    return false ;
  if (tournamentState.match1.player1 &&
    tournamentState.match1.player2 && 
    tournamentState.match2.player1 &&
    tournamentState.match2.player2) {
    localStorage.setItem("RemoteTournament", JSON.stringify(tournamentState));
    return true ;
  }
  return false ;
}
