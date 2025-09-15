import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
  getCurrentUsername,
} from "../utils/userUtils.js";
import { localStoreTournamentData } from "./tournamentTree.js";

// Tournament data structure
interface TournamentData {
  type: "local" | "remote";
  players: Array<{
    username: string | null;
    userDisplayName: string;
    avatar: string;
  }>;
}

interface Player {
  username: string | null;
  userDisplayName: string;
  avatar: string;
}

export interface LocalTournamentAvatarMap {
  player1: Player;
  player2: Player;
  player3: Player;
  player4: Player;
}

// Global storage for tournament data
let tournamentData: TournamentData | null = null;

// Available avatars for local tournaments
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

const currentAvatarIndex: { [key: number]: number } = {};

export async function renderTournament(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/tournament.html");

  // Get tournament type from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentType =
    (urlParams.get("type") as "local" | "remote") || "local";

  // Handle local tournaments, redirect remote to waiting room
  if (tournamentType === "local") {
    setupLocalTournament();
  } else {
    // Redirect remote tournaments to the waiting view
    const waitingContainer = document.getElementById("content");
    navigateTo("/remote-tournament-lobby", waitingContainer);
    return;
  }
}

function setupLocalTournament() {
  // Populate Player 1 with current user data
  populatePlayer1Data();

  // Initialize avatars for local tournament (Players 2-4 only)
  initializeAvatars();

  // Setup event listeners for local tournament
  setupLocalEventListeners();

  // Show input fields and avatar selectors for players 2-4 only
  enablePlayerCustomization(true);
}

function enablePlayerCustomization(enable: boolean) {
  // For local tournaments, skip Player 1 (read-only current user)
  const startPlayer = 2;

  for (let i = startPlayer; i <= 4; i++) {
    const inputField = document.getElementById(
      `t-player-${i}-name`,
    ) as HTMLInputElement;
    const avatarContainer = document.getElementById(
      `t-avatar-player-${i}`,
    )?.parentElement;

    if (inputField) {
      inputField.disabled = !enable;
      if (!enable) {
        inputField.style.cursor = "not-allowed";
      }
    }

    if (avatarContainer) {
      const buttons = avatarContainer.querySelectorAll("button");
      buttons.forEach((btn) => {
        (btn as HTMLButtonElement).disabled = !enable;
        btn.style.display = enable ? "block" : "none";
      });
    }
  }
}

async function populatePlayer1Data() {
  const player1Name = document.getElementById(
    "t-player-1-name",
  ) as HTMLInputElement;
  const player1Avatar = document.getElementById(
    "t-avatar-player-1",
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

// Avatar management functions (for local tournaments)
function updateAvatar(slot: number, index: number): void {
  const img = document.getElementById(
    `t-avatar-player-${slot}`,
  ) as HTMLImageElement;
  if (!img) return;

  currentAvatarIndex[slot] = index;
  img.src = `assets/avatars/${avatars[index]}`;
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
  const slots = [2, 3, 4]; // Skip Player 1 as it's current user
  // Each slot gets fixed sequential avatar (Players 2-4 get avatars 1-3)
  slots.forEach((slot) => updateAvatar(slot, slot - 2));

  // Add event listeners for navigation buttons (Players 2-4 only)
  for (let slot = 2; slot <= 4; slot++) {
    const avatarContainer = document.getElementById(
      `t-avatar-player-${slot}`,
    )?.parentElement;
    if (avatarContainer) {
      const buttons = avatarContainer.querySelectorAll("button");
      const prevBtn = buttons[0];
      const nextBtn = buttons[1];

      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          previousAvatar(slot);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          nextAvatar(slot);
        });
      }
    }
  }
}

function setupLocalEventListeners() {
  const startButton = document.getElementById("start-tournament-button");

  if (startButton) {
    startButton.addEventListener("click", async (e) => {
      e.preventDefault();
      // Only proceed if data collection succeeds (no duplicates)
      if (await collectLocalTournamentData()) {
        const container = document.getElementById("content");
        navigateTo("/tournament-tree", container);
      }
    });
  }
}

async function collectLocalTournamentData() {
  const players = [];
  const playerNames = new Set(); // To track duplicate names

  for (let i = 1; i <= 4; i++) {
    const nameInput = document.getElementById(
      `t-player-${i}-name`,
    ) as HTMLInputElement;
    const avatarImg = document.getElementById(
      `t-avatar-player-${i}`,
    ) as HTMLImageElement;

    const userDisplayName =
      nameInput?.value || nameInput?.placeholder || `Player ${i}`;

    // Check for duplicate names and cancel tournament if found
    if (playerNames.has(userDisplayName)) {
      alert(`Player name "${userDisplayName}" is already used.`);
      return false;
    }
    playerNames.add(userDisplayName);

    // For Player 1, get the actual username; for others, set to null
    const username = i === 1 ? getCurrentUsername() : null;

    let avatarData;
    if (i === 1) {
      // dummy avatar for Player 1 for data consistency
      // The actual user avatar URL will be handled in tournamentTree
      avatarData = "panda.png";
    } else {
      // For Players 2-4, extract filename from local avatar path
      const avatarSrc = avatarImg?.src || "";
      avatarData = avatarSrc.split("/").pop() || avatars[i - 2];
    }

    players.push({
      username: username,
      userDisplayName: userDisplayName,
      avatar: avatarData,
    });
  }

  tournamentData = {
    type: "local",
    players: players,
  };

  localStorage.setItem("LocalTournamentAvatarMap", JSON.stringify(players));
  if (tournamentData) {
    getTournoment(tournamentData.players);
  }
  return true;
}

async function getTournoment(players: Player[]) {
  try {
    const baseUrl = window.location.origin;

    const response = await fetch(`${baseUrl}/api/tournament/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player1: players[0].userDisplayName,
        player2: players[1].userDisplayName,
        player3: players[2].userDisplayName,
        player4: players[3].userDisplayName,
      }),
    });
    const data = await response.json();
    localStoreTournamentData(data);
  } catch (e) {
    console.error("Failed to fetch tournament:", e);
  }
}

// Export functions for tournament tree to use
export function getTournamentData(): TournamentData | null {
  return tournamentData ? { ...tournamentData } : null;
}
