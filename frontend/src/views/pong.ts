import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getUserDisplayName } from "../utils/userUtils.js";
import { getUserAvatar } from "../utils/userUtils.js";
import { Game } from "./game/Game.js";
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
  await updatePlayerInfo(gameMode);
  
  // const url = (location.protocol === "https:" ? "wss:" : "ws:") + "//" + location.host + "/ws/game";
  // const ws = new WebSocket(url);
  //
  // ws.addEventListener('open', () => console.log('connected'));
  // ws.addEventListener('message', e => console.log('msg', e.data));
  // ws.addEventListener('close', e => console.log('closed', e.code, e.reason));
  // ws.addEventListener('error', e => console.error('error', e));

  // Initialize the game based on the selected mode
  if (gameMode === "ai") {
    const game = new Game(GameMode.PvE, PaddleSide.Left);
    game.gameLoop();
  } else if (gameMode === "2player") {
    const game = new Game();
    game.gameLoop();
  } else if (gameMode === "remote") {
    // TODO: Implement remote game mode
    const game = new Game();
    game.gameLoop();
  }
}

/**
** Update the player usernames based on game mode
**/
async function updatePlayerInfo(gameMode: string) {
  const userDisplayName = await getUserDisplayName();
  const userAvatar = await getUserAvatar();
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
    // Player vs Player mode
    if (player1Element) {
      player1Element.textContent = userDisplayName;
      player1Avatar.src = userAvatar; // Set user avatar
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
