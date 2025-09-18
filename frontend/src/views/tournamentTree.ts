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

  // Extract player display names
  const playerNames = tournamentData.players.map((p) => p.userDisplayName);

  // Populate player names in the tournament tree
  populatePlayerNames(playerNames);

  // Add tournament type info to the title if needed
  updateTournamentTitle(tournamentData.type);
}

function populatePlayerNames(playerNames: string[]) {
  // Game 1 players
  const game1Player1 = document.getElementById("game1-player1");
  const game1Player2 = document.getElementById("game1-player2");

  if (game1Player1) {
    game1Player1.textContent = playerNames[0] || "Player 1";
  }
  if (game1Player2) {
    game1Player2.textContent = playerNames[1] || "Player 2";
  }

  // Game 2 players
  const game2Player1 = document.getElementById("game2-player1");
  const game2Player2 = document.getElementById("game2-player2");

  if (game2Player1) {
    game2Player1.textContent = playerNames[2] || "Player 3";
  }
  if (game2Player2) {
    game2Player2.textContent = playerNames[3] || "Player 4";
  }

  const game3Player2 = document.getElementById("final-player2");
  const localStorageTournamentState = localStorage.getItem("localTournamentState");
  if (localStorageTournamentState) {
    const localTournamentState = JSON.parse(localStorageTournamentState);
    if (localTournamentState && localTournamentState.match1.winner) {
      firstMatch(localTournamentState.match1.winner);
    }
    if (localTournamentState && localTournamentState.match2.winner) {
      secondMatch(localTournamentState.match2.winner);
    }
    if (localTournamentState && localTournamentState.match3.winner) {
      finalMatch(localTournamentState.match3.winner);
    }
  }
}

function finalMatch(winner: string) {
  const tournamentWinnerName = document.getElementById("TournamentWinnerName");
  if (tournamentWinnerName) {
    tournamentWinnerName.textContent = winner;
  }
  const buttonGame3 = document.querySelector("#button-game3 button");
  if (buttonGame3) {
    buttonGame3.setAttribute("disabled", "");
    buttonGame3.setAttribute("data-state", "waiting");
    buttonGame3.setAttribute("class", "rounded bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500");
    buttonGame3.textContent = "Finished"
  }
  const storeData = localStorage.getItem("LocalTournamentAvatarMap");
  if (storeData) {
    const players = JSON.parse(storeData);
    for (let i = 0; i < players.length; ++i) {
      if (players[i].userDisplayName === winner) {
        const avatar = document.getElementById("t-avatar-winner");
        if (avatar) {
          avatar.setAttribute("src", `../assets/avatars/${players[i].avatar}`); 
        }
        break ;
      }
    }
  }

}

function secondMatch(winner: string) {
  const finalPlayer2 = document.getElementById("final-player2");
  if (finalPlayer2) {
    finalPlayer2.textContent = winner;
  }
  const buttonGame2 = document.querySelector("#button-game2 button");
  const buttonGame3 = document.querySelector("#button-game3 button");

  if (buttonGame3) {
    buttonGame3.removeAttribute("disabled");
    buttonGame3.setAttribute("data-state", "ready");
    buttonGame3.setAttribute("class", "rounded bg-(--color-secondary) px-4 py-2 text-sm font-medium hover:bg-(--color-secondary-light)");
    buttonGame3.textContent = "Start Game"
  }
  if (buttonGame2) {
    buttonGame2.setAttribute("disabled", "");
    buttonGame2.setAttribute("data-state", "waiting");
    buttonGame2.setAttribute("class", "rounded bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500");
    buttonGame2.textContent = "Finished"
  }
}

function firstMatch(winner: string) {
  const finalPlayer1 = document.getElementById("final-player1");
  if (finalPlayer1) {
    finalPlayer1.textContent = winner;
  }
  const buttonGame1 = document.querySelector("#button-game1 button");
  const buttonGame2 = document.querySelector("#button-game2 button");

  if (buttonGame2) {
    buttonGame2.removeAttribute("disabled");
    buttonGame2.setAttribute("data-state", "ready");
    buttonGame2.setAttribute("class", "rounded bg-(--color-secondary) px-4 py-2 text-sm font-medium hover:bg-(--color-secondary-light)");
    buttonGame2.textContent = "Start Game"
  }
  if (buttonGame1) {
    buttonGame1.setAttribute("disabled", "");
    buttonGame1.setAttribute("data-state", "waiting");
    buttonGame1.setAttribute("class", "rounded bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500");
    buttonGame1.textContent = "Finished"
  }
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
  }
  else if (gameNumber === "2") {
    // Game 2: Player 3 vs Player 4
    player1Data = storedTournamentData.players[2];
    player2Data = storedTournamentData.players[3];
  }
  else if (gameNumber === "final") {
    const localTournamentState = localStorage.getItem("localTournamentState");
    if (localTournamentState) {
      const tounamentState = JSON.parse(localTournamentState);
      if (tounamentState && tounamentState.match1.winner && tounamentState.match2.winner) {
        player1Data = tounamentState.match1.winner;
        player2Data = tounamentState.match2.winner;
      }
    }
  }
  else {
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
  const gameData: MatchData = {
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
  if (storedTournamentData.type === "local") {
    navigateTo("/pong?mode=localtournament", container);
  }
  else if (storedTournamentData.type === "remote") {
    navigateTo("/pong?mode=remotetournament", container);
  }
}

export function localStoreTournamentData(data: TournomentState) {
  const tournamentState: TournomentState = {
    id: data.id,
    match1: {
      player1: data.match1.player1,
      player2: data.match1.player2,
      winner: null,
    },
    match2: {
      player1: data.match2.player1,
      player2: data.match2.player2,
      winner: null,
    },
    match3: {
      player1: data.match3.player1,
      player2: data.match3.player2,
      winner: null,
    }
  }
  localStorage.setItem("localTournamentState", JSON.stringify(tournamentState));
}

export interface TournomentState {
  id: number,
  match1: {
    player1: string | null,
    player2: string | null,
    winner: string | null,
  }
  match2: {
    player1: string | null,
    player2: string | null,
    winner: string | null,
  }
  match3: {
    player1: string | null,
    player2: string | null,
    winner: string | null,
  }
}

export interface MatchData {
  mode: string,
  gameNumber: string,
  player1: {
    name: string,
    avatar: string,
  }
  player2: {
    name: string,
    avatar: string,
  }
}
