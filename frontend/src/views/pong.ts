import { loadHtml } from "../utils/htmlLoader.js";
import { LocalGame } from "./game/LocalGame.js";
import { RemoteGame } from "./game/RemoteGame.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
  getCurrentUsername,
} from "../utils/userUtils.js";
import { getUserAvatar } from "../services/profileService.js";
import { FetchData } from "./game/utils.js";
import { request, getHeaders } from "../utils/api.js";
import { TournamentState, PlayerInfo } from "./tournament/tournamentSetup.js";


export interface GameData {
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
    enterTournamentGame(gameMode);
  }
  else {
    enterGame(gameMode, null);
  }
}

function enterTournamentGame(gameMode: string): void {
  if (gameMode === "localtournament") {
    const localTournamentStateString = localStorage.getItem("LocalTournamentState");
    const playerInfoString = localStorage.getItem("LocalTournamentPlayersInfo");
    if (!localTournamentStateString || !playerInfoString) return ;

    const localTournamentState = JSON.parse(localTournamentStateString);
    const playerInfo = JSON.parse(playerInfoString);
    if (!localTournamentState || !playerInfo) return ;

    setTournament(localTournamentState, gameMode,  playerInfo)
  }
  else if (gameMode === "remotetournament") {
    const remoteTournamentStateString = localStorage.getItem("RemoteTournament");
    if (!remoteTournamentStateString) return ;
    const remoteTournamentState = JSON.parse(remoteTournamentStateString);
    if (!remoteTournamentState) return ;

    setTournament(remoteTournamentState, gameMode)
  }

}

async function setTournament(tournamentState: TournamentState, gameMode: string, playerInfo?: PlayerInfo[]) {
  const player1 = document.querySelector("#player1-name");
  const player2 = document.querySelector("#player2-name");
  const player1Avatar = document.querySelector("#player1-avatar");
  const player2Avatar = document.querySelector("#player2-avatar");
  if (!player1 || !player2 || !player1Avatar || !player2Avatar) return ;

  // Set Names depending on which match
  if (!tournamentState.match1.winner) {
    player1.textContent = tournamentState.match1.player1;
    player2.textContent = tournamentState.match1.player2;
  }
  else if (!tournamentState.match2.winner) {
    player1.textContent = tournamentState.match2.player1;
    player2.textContent = tournamentState.match2.player2;
  }
  else {
    player1.textContent = tournamentState.match3.player1;
    player2.textContent = tournamentState.match3.player2;
  }

  if (gameMode === "localtournament" && playerInfo) {
    // set Avatars
    for (const i in playerInfo) {
      if (playerInfo[i].userDisplayName === player1.textContent) {
        player1Avatar.setAttribute("src", `/assets/avatars/${playerInfo[i].avatar}`)
      }
      else if (playerInfo[i].userDisplayName === player2.textContent) {
        player2Avatar.setAttribute("src", `/assets/avatars/${playerInfo[i].avatar}`)
      }
    }
    const localGame = new LocalGame(gameMode, tournamentState.id);
  }
  else if (gameMode === "remotetournament") {
    const avatar1 = await getUserAvatar(player1.innerHTML.trim());
    const avatar2 = await getUserAvatar(player2.innerHTML.trim());
    player1Avatar.setAttribute("src", `${avatar1}`)
    player2Avatar.setAttribute("src", `${avatar2}`)

    const userName = getCurrentUsername();
    if (userName === player1.innerHTML.trim()) {
      const remotePlayerGame = new RemoteGame(gameMode, tournamentState.id, "left");
    }
    else if (userName === player2.innerHTML.trim()) {
      const remotePlayerGame = new RemoteGame(gameMode, tournamentState.id, "right");
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
        const remoteGame = new RemoteGame(response.gameMode, response.id, response.side);
      }
      else {
        const remoteGame = new RemoteGame(gameData.gameMode, gameData.id, gameData.side);
      }
    }
    else {
      const response = await request(`${baseUrl}/api/getgame/local`, {
        credentials: "include"
      }) as FetchData;
      const localGame = new LocalGame(gameMode, response.id);
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
