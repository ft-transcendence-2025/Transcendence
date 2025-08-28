import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getTournamentData } from "./tournamentSetup.js";
import { getCurrentUserAvatar } from "../utils/userUtils.js";

// Store tournament data locally for game access
let storedTournamentData: any = null;

export async function renderTournamentTree(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/tournamentTree.html");

  // Get tournament data and setup the tournament tree
  setupTournamentTree();

  // Setup game start listeners
  setupGameStartListeners();
}

function setupTournamentTree() {
  // Get the stored tournament data
  const tournamentData = getTournamentData();
  storedTournamentData = tournamentData; // Store for game access

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
}

function updateTournamentTitle(type: "local" | "remote") {
  const titleElement = document.querySelector("#tournament-tree h2");
  if (titleElement) {
    const typeText = type === "local" ? "Local" : "Remote";
    titleElement.textContent = `${typeText} Tournament Tree`;
  }
}

function setupGameStartListeners() {
  // Add click listeners to game buttons
  const gameButtons = document.querySelectorAll("[data-game]");

  gameButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      const gameNumber = (e.target as HTMLElement).getAttribute("data-game");
      const gameState = (e.target as HTMLElement).getAttribute("data-state");

      // Only start games that are ready
      if (gameState === "ready") {
        await startTournamentGame(gameNumber);
      }
    });
  });
}

async function startTournamentGame(gameNumber: string | null) {
  if (!gameNumber || !storedTournamentData) {
    console.error("No game number or tournament data available");
    return;
  }

  let player1Data, player2Data;

  if (gameNumber === "1") {
    // Game 1: Player 1 vs Player 2
    player1Data = storedTournamentData.players[0];
    player2Data = storedTournamentData.players[1];
  } else if (gameNumber === "2") {
    // Game 2: Player 3 vs Player 4
    player1Data = storedTournamentData.players[2];
    player2Data = storedTournamentData.players[3];
  } else {
    console.error("Invalid game number:", gameNumber);
    return;
  }

  // For Player 1 in Game 1 (current user), get their actual avatar
  let player1Avatar, player2Avatar;
  
  if (gameNumber === "1" && storedTournamentData.type === "local") {
    // Player 1 is always the current user in local tournaments
    player1Avatar = await getCurrentUserAvatar();
    player2Avatar = `/assets/avatars/${player2Data.avatar}`;
  } else {
    // For Game 2 or remote tournaments, use stored avatar filenames
    player1Avatar = `/assets/avatars/${player1Data.avatar}`;
    player2Avatar = `/assets/avatars/${player2Data.avatar}`;
  }

  // Create game data similar to 2-player modal
  const gameData = {
    mode: "tournament",
    gameNumber: gameNumber,
    player1: {
      name: player1Data.username,
      avatar: player1Avatar,
    },
    player2: {
      name: player2Data.username,
      avatar: player2Avatar,
    },
  };

  // Store in localStorage for pong to access
  localStorage.setItem("tournamentGameData", JSON.stringify(gameData));

  // Navigate to pong game
  const container = document.getElementById("content");
  navigateTo("/pong?mode=tournament", container);
}
