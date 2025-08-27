import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
} from "../utils/userUtils.js";

// Available avatars for player 2
const avatars = [
  "bear.png",
  "cat.png",
  "chicken.png",
  "dog.png",
  "gorilla.png",
  "koala.png",
  "meerkat.png",
  "panda.png",
  "rabbit.png",
  "sloth.png",
];

let currentPlayer2AvatarIndex = 1; // Start with gorilla.png (index 1)

export async function renderDashboard(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/dashboard.html");

  // Setup 2-player modal functionality
  await setup2PlayerModal();
}

async function setup2PlayerModal() {
  // Get elements
  const localTwoPlayerBtn = document.getElementById("local-2player-btn");
  const modal = document.getElementById("2p-setup-modal");
  const closeModal = document.getElementById("2p-close-modal-btn");
  const startGameBtn = document.getElementById("2p-start-game");
  const prevAvatarBtn = document.getElementById("2p-prev-avatar");
  const nextAvatarBtn = document.getElementById("2p-next-avatar");

  if (
    !localTwoPlayerBtn ||
    !modal ||
    !closeModal ||
    !startGameBtn ||
    !prevAvatarBtn ||
    !nextAvatarBtn
  ) {
    console.error("2-player modal elements not found");
    return;
  }

  // Populate Player 1 with current user data
  await populatePlayer1Data();

  // Open modal
  localTwoPlayerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.classList.remove("hidden");
  });

  // Close modal
  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Avatar navigation for Player 2
  prevAvatarBtn.addEventListener("click", () => {
    currentPlayer2AvatarIndex =
      (currentPlayer2AvatarIndex - 1 + avatars.length) % avatars.length;
    updatePlayer2Avatar();
  });

  nextAvatarBtn.addEventListener("click", () => {
    currentPlayer2AvatarIndex =
      (currentPlayer2AvatarIndex + 1) % avatars.length;
    updatePlayer2Avatar();
  });

  // Start game
  startGameBtn.addEventListener("click", () => {
    startTwoPlayerGame();
  });

  // Initialize Player 2 avatar
  updatePlayer2Avatar();
}

async function populatePlayer1Data() {
  const player1Name = document.getElementById(
    "2p-name-player-1",
  ) as HTMLInputElement;
  const player1Avatar = document.getElementById(
    "2p-avatar-player-1",
  ) as HTMLImageElement;

  if (player1Name && player1Avatar) {
    // Get current user display name and avatar
    const displayName = await getUserDisplayName();
    const avatarUrl = await getCurrentUserAvatar();

    player1Name.value = displayName || "Player 1";
    player1Avatar.src = avatarUrl;

    // Add error handling for avatar
    player1Avatar.onerror = () => {
      player1Avatar.src = "/assets/avatars/panda.png";
    };
  }
}

function updatePlayer2Avatar() {
  const player2Avatar = document.getElementById(
    "2p-avatar-player-2",
  ) as HTMLImageElement;
  if (player2Avatar) {
    player2Avatar.src = `/assets/avatars/${avatars[currentPlayer2AvatarIndex]}`;

    // Add error handling for Player 2 avatar
    player2Avatar.onerror = () => {
      player2Avatar.src = "/assets/avatars/meerkat.png";
    };
  }
}

function startTwoPlayerGame() {
  // Collect player data
  const player1Name =
    (document.getElementById("2p-name-player-1") as HTMLInputElement)?.value ||
    "Player 1";
  const player2Name =
    (document.getElementById("2p-name-player-2") as HTMLInputElement)?.value ||
    "Player 2";

  // Get avatar sources with fallbacks
  const player1AvatarElement = document.getElementById(
    "2p-avatar-player-1",
  ) as HTMLImageElement;
  const player1Avatar =
    player1AvatarElement?.src || "/assets/avatars/panda.png";

  const player2AvatarElement = document.getElementById(
    "2p-avatar-player-2",
  ) as HTMLImageElement;
  const player2Avatar =
    player2AvatarElement?.src || "/assets/avatars/meerkat.png";

  // Store player data in localStorage for pong view to access
  const gameData = {
    mode: "2player",
    player1: {
      name: player1Name,
      avatar: player1Avatar,
    },
    player2: {
      name: player2Name,
      avatar: player2Avatar,
    },
  };

  localStorage.setItem("2playerGameData", JSON.stringify(gameData));

  // Close modal
  const modal = document.getElementById("2p-setup-modal");
  if (modal) {
    modal.classList.add("hidden");
  }

  // Navigate to pong game
  const container = document.getElementById("content");
  navigateTo("/pong?mode=2player", container);
}
