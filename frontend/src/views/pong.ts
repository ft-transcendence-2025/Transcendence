import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getUserNickname } from "../utils/userUtils.js";
import { SinglePlayerGame } from "./game/Game.js";
import { GameMode, PaddleSide } from "./game/utils.js";

export async function renderPong(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/pong.html");

  // Event listeners to open/close game instructions modal
  renderInstructionsModal();

  // Get the game parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const gameMode = urlParams.get("mode") || "2player"; // default to "2player"

  // Update the player names based on game mode
  await updatePlayerNames(gameMode);

  enterGame(gameMode);

}


async function enterGame(gameMode: string) {
  try {
    const response = await fetch("http://localhost:4000/getgame/singleplayer", {
      credentials: "include"
    });
    const data = await response.json();
    const singlePlayerGame = new SinglePlayerGame(gameMode, data);

  } catch (error) {
    console.error("Failed to fetch game:", error);
  }
}


/**
 * Update the player usernames based on game mode
 */
async function updatePlayerNames(gameMode: string) {
  const player1Element = document.getElementById("player1-name");
  const player2Element = document.getElementById("player2-name");

  if (gameMode === "ai") {
    // AI vs Player mode
    if (player1Element) {
      player1Element.textContent = "AI";
    }
    if (player2Element) {
      // Fetch nickname asynchronously
      const currentNickname = await getUserNickname();
      player2Element.textContent = currentNickname;
    }
  } else if (gameMode === "2player") {
    // Player vs Player mode
    if (player1Element) {
      player1Element.textContent = "Player 1";
    }
    if (player2Element) {
      player2Element.textContent = "Player 2";
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
 * Open and close game instructions modal
 */
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
