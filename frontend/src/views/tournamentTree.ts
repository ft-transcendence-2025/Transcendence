import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getTournamentData } from "./tournamentSetup.js";

export async function renderTournamentTree(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/tournamentTree.html");

  // Get tournament data and setup the tournament tree
  setupTournamentTree();
}

function setupTournamentTree() {
  // Get the stored tournament data
  const tournamentData = getTournamentData();

  if (!tournamentData) {
    console.warn("No tournament data found, using defaults");
    // Use default players
    populatePlayerNames(["LazyLoader", "SegPaw", "SoftShell", "FetchRequest"]);
    return;
  }

  // Extract player usernames
  const playerNames = tournamentData.players.map((p) => p.username);

  // Populate player names in the tournament tree
  populatePlayerNames(playerNames);

  // Add tournament type info to the title if needed
  updateTournamentTitle(tournamentData.type);
}

function populatePlayerNames(playerNames: string[]) {
  // Game 1 players
  const game1Player1 = document.getElementById("game1-player1");
  const game1Player2 = document.getElementById("game1-player2");

  if (game1Player1) game1Player1.textContent = playerNames[0] || "Player 1";
  if (game1Player2) game1Player2.textContent = playerNames[1] || "Player 2";

  // Game 2 players
  const game2Player1 = document.getElementById("game2-player1");
  const game2Player2 = document.getElementById("game2-player2");

  if (game2Player1) game2Player1.textContent = playerNames[2] || "Player 3";
  if (game2Player2) game2Player2.textContent = playerNames[3] || "Player 4";

  console.log("Player names populated in tournament tree");
}

function updateTournamentTitle(type: "local" | "remote") {
  const titleElement = document.querySelector("#tournament-tree h2");
  if (titleElement) {
    const typeText = type === "local" ? "Local" : "Remote";
    titleElement.textContent = `${typeText} Tournament Tree`;
  }
}
