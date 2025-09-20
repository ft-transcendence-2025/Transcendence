import { loadHtml } from "../utils/htmlLoader.js";
import { SinglePlayerGame } from "./game/SinglePlayerGame.js";
import { RemoteGame } from "./game/RemoteGame.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
  getCurrentUsername,
} from "../utils/userUtils.js";
import { TournomentState, MatchData } from "./tournamentTree.js";
import {  FetchData } from "./game/utils.js";
import { request, getHeaders } from "../utils/api.js";


interface GameData {
  mode: string,
  player1: {
    username: string | null,
    userDisplayName: string,
    avatar: string,
  },
  player2: {
    username: string | null,
    userDisplayName: string,
    avatar: string,
  },
}

export async function renderPong(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/pong.html");

  // Event listeners to open/close game instructions modal
  renderInstructionsModal();

  // Get the game parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const gameMode = urlParams.get("mode") || "2player"; // default to "2player"

  await updatePlayerInfo(gameMode);

  if (gameMode === "localtournament" || gameMode === "remotetournament") {
    setUpTournoment();
  }

  enterGame(gameMode, null);
}

function setUpTournoment(): void {
  const player1 = document.getElementById("player1-name") as HTMLCanvasElement;
  const player2 = document.getElementById("player2-name") as HTMLCanvasElement;

  const localStorageTournamentState = localStorage.getItem("localTournamentState");
  if (localStorageTournamentState) {
    const tournamentState: TournomentState = JSON.parse(localStorageTournamentState);
    if (tournamentState.match1.winner === null && tournamentState.match1.player1 && tournamentState.match1.player2) {
      player1.innerHTML = tournamentState.match1.player1;
      player2.innerHTML = tournamentState.match1.player2;
    }
    else if (tournamentState.match2.winner === null && tournamentState.match2.player1 && tournamentState.match2.player2) { 
      player1.innerHTML = tournamentState.match2.player1;
      player2.innerHTML = tournamentState.match2.player2;
    }
    else if (tournamentState.match3.winner === null && tournamentState.match3.player1 && tournamentState.match3.player2) { 
      player1.innerHTML = tournamentState.match3.player1;
      player2.innerHTML = tournamentState.match3.player2;
    }
  }
}

async function enterGame(gameMode: string, gameData: FetchData | null) {
  try {
    const baseUrl = window.location.origin; 
    const user = getCurrentUsername();

    if (gameMode === "remote") {
      if (!gameData) {
        const response = await request(`${baseUrl}/api/getgame/remote`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            name: getCurrentUsername(),
          })
        }) as FetchData;
        const remoteGame = new RemoteGame(response);
      }
      else {
        const remoteGame = new RemoteGame(gameData);
      }
    }
    else {
      const response = await request(`${baseUrl}/api/getgame/singleplayer`, {
        credentials: "include"
      }) as FetchData;
      const singlePlayerGame = new SinglePlayerGame(gameMode, response);
    }
  } catch (error) {
    console.error("Failed to fetch game:", error);
  }
}


/**
 ** Update the player usernames based on game mode
 **/
async function updatePlayerInfo(gameMode: string) {
  const userDisplayName = await getUserDisplayName();
  const userAvatar = await getCurrentUserAvatar();
  const player1Element = document.getElementById("player1-name");
  const player2Element = document.getElementById("player2-name");
  const player1Avatar = document.getElementById(
    "player1-avatar",
  ) as HTMLImageElement;
  const player2Avatar = document.getElementById(
    "player2-avatar",
  ) as HTMLImageElement;

  if (gameMode === "ai") {
    // AI vs Player mode
    if (player1Element) {
      player1Element.textContent = "AI";
      player1Avatar.src = "/assets/avatars/robot.png"; // Set AI avatar
    }
    if (player2Element) {
      player2Element.textContent = userDisplayName;
      player2Avatar.src = userAvatar; // Set user avatar
    }
  } else if (gameMode === "2player") {
    // 2P mode - fetch local storage data from 2P modal if available
    const gameData = localStorage.getItem("2playerGameData");

    if (gameData) {
      // Use custom player data from setup modal
      const data = JSON.parse(gameData) as GameData;

      if (player1Element) {
        player1Element.textContent = data.player1.userDisplayName;
        player1Avatar.src = data.player1.avatar;
      }

      if (player2Element) {
        player2Element.textContent = data.player2.userDisplayName;
        player2Avatar.src = data.player2.avatar;
      }
    } else {
      // Fallback to default behavior
      if (player1Element) {
        player1Element.textContent = userDisplayName;
        player1Avatar.src = userAvatar;
      }
      if (player2Element) {
        player2Element.textContent = "Player 2";
        player2Avatar.src = "/assets/avatars/meerkat.png";
      }
    }
  } else if (gameMode === "tournament") {
    // Tournament mode - fetch tournament game data
    const gameData = localStorage.getItem("tournamentGameData");

    if (gameData) {
      // Use tournament player data
      const data = JSON.parse(gameData);

      if (player1Element) {
        player1Element.textContent = data.player1.name;
        player1Avatar.src = data.player1.avatar;
      }

      if (player2Element) {
        player2Element.textContent = data.player2.name;
        player2Avatar.src = data.player2.avatar;
      }

      // Don't clear tournament data yet - might need it for winner handling
    } else {
      // Fallback
      if (player1Element) {
        player1Element.textContent = "Player 1";
        player1Avatar.src = "/assets/avatars/panda.png";
      }
      if (player2Element) {
        player2Element.textContent = "Player 2";
        player2Avatar.src = "/assets/avatars/bear.png";
      }
    }
  } else if (gameMode === "remote") {
    // TODO Remote mode.................................
    if (player1Element) {
      player1Element.textContent = "Remote Player 1";
    }
    if (player2Element) {
      player2Element.textContent = "Remote Player 2";
    }
  }
}

/**
 ** Open and close game instructions modal
 **/
function renderInstructionsModal() {
  const instructionsModal = document.getElementById("instructions-modal");
  const instructionsBtn = document.getElementById("instructions-btn");
  const closeBtn = document.getElementById("close-instructions-btn");
  const gotItBtn = document.getElementById("got-it-btn");

  // Show modal when instructions icon is clicked
  instructionsBtn?.addEventListener("click", () => {
    instructionsModal?.classList.remove("hidden");
    instructionsModal?.classList.add("flex");
  });

  // Hide modal when close x is clicked
  closeBtn?.addEventListener("click", () => {
    instructionsModal?.classList.add("hidden");
    instructionsModal?.classList.remove("flex");
  });

  // Hide modal when "Got it!" button is clicked
  gotItBtn?.addEventListener("click", () => {
    instructionsModal?.classList.add("hidden");
    instructionsModal?.classList.remove("flex");
  });
}
