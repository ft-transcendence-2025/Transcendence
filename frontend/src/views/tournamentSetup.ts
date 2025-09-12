import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
} from "../utils/userUtils.js";
import { localStoreTournamentData } from "./tournamentTree.js";

// Tournament data structure
interface TournamentData {
  type: "local" | "remote";
  players: Array<{
    username: string;
    avatar: string;
  }>;
}

interface Player {
  username: string,
  avatar: string,
}

export interface LocalTournamentAvatarMap {
  player1: Player,
  player2: Player,
  player3: Player,
  player4: Player,
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

  // Initialize tournament based on type
  if (tournamentType === "local") {
    setupLocalTournament();
  } else if (tournamentType === "remote") {
    setupRemoteTournament();
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

function setupRemoteTournament() {
  // Populate Player 1 with current user data
  populatePlayer1Data();

  // Do not allow customization for any players
  enablePlayerCustomization(false);

  // Populate with current user and fetch other players
  populateRemotePlayers();

  // Setup event listeners for remote tournament
  setupRemoteEventListeners();
}

function enablePlayerCustomization(enable: boolean) {
  // For local tournaments, skip Player 1 (read-only current user)
  // For remote tournaments, disable all players
  const startPlayer = enable ? 2 : 1;

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

async function populateRemotePlayers() {
  // Get current user
  const currentDisplayName = await getUserDisplayName();
  const currentAvatarUrl = await getCurrentUserAvatar();

  // Mock data - this has to come from API !!!!!!!
  const remotePlayers = [
    {
      username: currentDisplayName || "You",
      avatar: currentAvatarUrl,
      isUrl: true,
    },
    { username: "Player 2", avatar: "gorilla.png", isUrl: false },
    { username: "Player 3", avatar: "meerkat.png", isUrl: false },
    { username: "Player 4", avatar: "rabbit.png", isUrl: false },
  ];

  // Update player names and avatars in the UI
  remotePlayers.forEach((player, index) => {
    const playerNameElement = document.getElementById(
      `t-player-${index + 1}-name`,
    ) as HTMLInputElement;
    const avatarImg = document.getElementById(
      `t-avatar-player-${index + 1}`,
    ) as HTMLImageElement;

    if (playerNameElement) {
      playerNameElement.value = player.username;
      playerNameElement.placeholder = player.username;
    }

    // Set avatar based on whether it's a URL or filename
    if (avatarImg) {
      if (player.isUrl) {
        // For real user avatars, use the full API URL
        avatarImg.src = player.avatar;
        // If avatar fails default to panda
        avatarImg.onerror = () => {
          avatarImg.src = "/assets/avatars/panda.png";
        };
      } else {
        // For mock data, use default asset images
        avatarImg.src = `/assets/avatars/${player.avatar}`;
      }
    }
  });
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
  };
}

function setupRemoteEventListeners() {
  const startButton = document.getElementById("start-tournament-button");

  if (startButton) {
    startButton.addEventListener("click", (e) => {
      e.preventDefault();
      // Only proceed if data collection succeeds (no duplicates)
      collectRemoteTournamentData().then((success) => {
        if (success) {
          const container = document.getElementById("content");
          navigateTo("/tournament-tree", container);
        }
      });
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

    const username =
      nameInput?.value || nameInput?.placeholder || `Player ${i}`;

    // Check for duplicate names and cancel tournament if found
    if (playerNames.has(username)) {
      alert(`Player name "${username}" is already used.`);
      return false;
    }
    playerNames.add(username);

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
      avatar: avatarData,
    });
  }

  tournamentData = {
    type: "local",
    players: players,
  };

  localStorage.setItem("LocalTournamentAvatarMap", JSON.stringify(players));
  getTournament(tournamentData.players);
  return true;
}

async function getTournament(players: Player[]) {
  try {
    const baseUrl = window.location.origin; 

    const response = await fetch(`${baseUrl}/api/tournament/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        player1: players[0].username,
        player2: players[1].username,
        player3: players[2].username,
        player4: players[3].username
      }) 
    });
    const data = await response.json();
    localStoreTournamentData(data);
  } catch (e) {
    console.error("Failed to fetch tournoment:", e);
  }
}

async function collectRemoteTournamentData() {
  // Get current user
  const currentDisplayName = await getUserDisplayName();

  // Mock data - this has to come from API !!!!!!!
  const players = [
    { username: currentDisplayName || "You", avatar: "panda.png" },
    { username: "Player 2", avatar: "gorilla.png" },
    { username: "Player 3", avatar: "meerkat.png" },
    { username: "Player 4", avatar: "rabbit.png" },
  ];

  tournamentData = {
    type: "remote",
    players: players,
  };

  return true; // Success
  // To do...
  // ...
  // ...
}

// Export functions for tournament tree to use
export function getTournamentData(): TournamentData | null {
  return tournamentData ? { ...tournamentData } : null;
}
