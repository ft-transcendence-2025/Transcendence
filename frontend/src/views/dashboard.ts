import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
  getCurrentUsername,
} from "../utils/userUtils.js";
import { RemoteGame } from "./game/RemoteGame.js";
import { FetchData } from "./game/utils.js";

// Available avatars for both players
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

// Track current avatar index for each player
const currentAvatarIndex: { [key: number]: number } = {};

export async function renderDashboard(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/dashboard.html");

  // Setup 2-player modal functionality
  await setup2PlayerModal();
  setupTournament();
}

function setupTournament() {
  const localTournamentBtn = document.getElementById("local-tournament");
  if (!localTournamentBtn) return;

  localTournamentBtn.addEventListener("click", () => {
    const localTournamentState = localStorage.getItem("LocalTournamentState");
    const container = document.getElementById("content");

    if (localTournamentState === null) {
      navigateTo("/tournament?type=local", container);
    }
    else {
      const tournamentState = JSON.parse(localTournamentState);
      if (!tournamentState)
        return ;
      if (tournamentState.match3.winner) {
        localStorage.removeItem("LocalTournamentState")
        navigateTo("/tournament?type=local", container);
        return ;
      }
      navigateTo("/tournament-tree", container);
    }
  })
}

async function setup2PlayerModal() {
  // Get elements
  const localTwoPlayerBtn = document.getElementById("local-2player-btn");
  const modal = document.getElementById("2p-setup-modal");
  const closeModal = document.getElementById("2p-close-modal-btn");
  const startGameBtn = document.getElementById("2p-start-game");

  if (
    !localTwoPlayerBtn ||
    !modal ||
    !closeModal ||
    !startGameBtn
  ) {
    console.error("2-player modal elements not found");
    return;
  }

  // Initialize avatars for both players
  initializeAvatars();

  // Populate Player 1 with current user data (if logged in)
  await populatePlayer1Data();

  // Open modal
  localTwoPlayerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const gameMode = localStorage.getItem("GameMode");
    if (gameMode === null || gameMode === "PvE") {
      modal.classList.remove("hidden");
    }
    else {
      // Navigate to pong game
      const container = document.getElementById("content");
      navigateTo("/pong?mode=2player", container);
    }
  });

  // Close modal
  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Start game
  startGameBtn.addEventListener("click", () => {
    localStorage.removeItem("2playerGameData");
    startTwoPlayerGame();
  });
}

async function populatePlayer1Data() {
  const player1Name = document.getElementById(
    "2p-name-player-1",
  ) as HTMLInputElement;
  const player1Avatar = document.getElementById(
    "2p-avatar-player-1",
  ) as HTMLImageElement;

  if (player1Name && player1Avatar) {
    // Check if user is logged in
    const currentUsername = getCurrentUsername();
    
    if (currentUsername) {
      // User is logged in - prefill with their data
      const displayName = await getUserDisplayName();
      const avatarUrl = await getCurrentUserAvatar();

      player1Name.value = displayName || "Player 1";
      player1Avatar.src = avatarUrl;

      // Add error handling for avatar - fallback to local avatar
      player1Avatar.onerror = () => {
        player1Avatar.src = "/assets/avatars/panda.png";
        // Set the avatar index to match the fallback
        currentAvatarIndex[1] = 7; // panda.png is at index 7
      };
    } else {
      // User not logged in - set default values
      player1Name.value = "";
      player1Name.placeholder = "Player 1";
      // Default avatar will be set by initializeAvatars
    }
  }
}

// Avatar management functions
function updateAvatar(slot: number, index: number): void {
  const img = document.getElementById(
    `2p-avatar-player-${slot}`,
  ) as HTMLImageElement;
  if (!img) return;

  currentAvatarIndex[slot] = index;
  img.src = `/assets/avatars/${avatars[index]}`;
}

function previousAvatar(slot: number): void {
  let index = currentAvatarIndex[slot] ?? 0;
  index = (index - 1 + avatars.length) % avatars.length;
  updateAvatar(slot, index);
}

function nextAvatar(slot: number): void {
  let index = currentAvatarIndex[slot] ?? 0;
  index = (index + 1) % avatars.length;
  updateAvatar(slot, index);
}

function initializeAvatars() {
  const slots = [1, 2]; // Both players
  
  // Check if Player 1 is logged in user with custom avatar
  const currentUsername = getCurrentUsername();
  const player1Avatar = document.getElementById("2p-avatar-player-1") as HTMLImageElement;
  
  if (currentUsername && player1Avatar && !player1Avatar.src.includes('/assets/avatars/')) {
    // Don't override Player 1 avatar, but let them change if they want
    currentAvatarIndex[1] = 0; // Default to first avatar if they switch
  } else {
    updateAvatar(1, 0); // Set to first avatar
  }
  
  // Set default avatar for Player 2
  updateAvatar(2, 1); // Set to second avatar (cat.png)

  // Add event listeners for navigation buttons for both players
  for (let slot = 1; slot <= 2; slot++) {
    const avatarImg = document.getElementById(`2p-avatar-player-${slot}`);
    if (avatarImg?.parentElement) {
      // Get the div that contains the avatar and buttons
      const avatarContainer = avatarImg.parentElement;
      
      const prevBtn = avatarContainer.querySelector("button.avatar-prev");
      const nextBtn = avatarContainer.querySelector("button.avatar-next");

      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          previousAvatar(slot);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          nextAvatar(slot);
        });
      }
    }
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

  // Check if Player 2 display name is the same as current user (Player 1)
  if (player2Name.trim() === player1Name.trim()) {
    alert("Please choose a different name.");
    return;
  }

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

  // Get current username for Player 1 (if logged in)
  const currentUsername = getCurrentUsername();

  // Store player data in localStorage for pong view to access
  const gameData = {
    mode: "2player",
    player1: {
      username: currentUsername, // Will be null if not logged in
      userDisplayName: player1Name,
      avatar: player1Avatar,
    },
    player2: {
      username: null, // Player 2 is always a guest in local 2-player
      userDisplayName: player2Name,
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
