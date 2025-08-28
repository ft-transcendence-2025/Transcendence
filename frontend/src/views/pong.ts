import { loadHtml } from "../utils/htmlLoader.js";
import { getUserDisplayName, getCurrentUserAvatar } from "../utils/userUtils.js";
import { SinglePlayerGame } from "./game/SinglePlayerGame.js";
import { RemoteGame } from "./game/RemoteGame.js";

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

  enterGame(gameMode);
}


async function enterGame(gameMode: string) {
  try {
    if (gameMode === "remote") {
      const response = await fetch("http://localhost:4000/getgame/remote", {
        credentials: "include"
      });
      const data = await response.json();
      const remoteGame = new RemoteGame(data);
    }
    else {
      const response = await fetch("http://localhost:4000/getgame/singleplayer", {
        credentials: "include"
      });
      const data = await response.json();
      const singlePlayerGame = new SinglePlayerGame(gameMode, data);
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
      const data = JSON.parse(gameData);
      
      if (player1Element) {
        player1Element.textContent = data.player1.name;
        player1Avatar.src = data.player1.avatar;
      }
      
      if (player2Element) {
        player2Element.textContent = data.player2.name;
        player2Avatar.src = data.player2.avatar;
      }
      
      // Clear the data after use
      localStorage.removeItem("2playerGameData");
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
  } else if (gameMode === "remote") {
    // TODO Remote mode, fetch player names from the server
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
