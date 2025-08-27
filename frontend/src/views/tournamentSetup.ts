import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getUserDisplayName, getCurrentUserAvatar } from "../utils/userUtils.js";

// Tournament data structure
interface TournamentData {
  type: "local" | "remote";
  players: Array<{
    username: string;
    avatar: string;
  }>;
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
  // Initialize avatars for local tournament
  initializeAvatars();

  // Setup event listeners for local tournament
  setupLocalEventListeners();

  // Show input fields and avatar selectors (visible by default)
  enablePlayerCustomization(true);
}

function setupRemoteTournament() {
  // Hide avatar selection and input fields for remote tournament
  enablePlayerCustomization(false);

  // Populate with current user and fetch other players
  populateRemotePlayers();

  // Setup event listeners for remote tournament
  setupRemoteEventListeners();
}

function enablePlayerCustomization(enable: boolean) {
  for (let i = 1; i <= 4; i++) {
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

async function populateRemotePlayers() {
  // Get current user
  const currentDisplayName = await getUserDisplayName();
  const currentAvatarUrl = await getCurrentUserAvatar();

  // Mock data - this has to come from API !!!!!!!
  const remotePlayers = [
    { username: currentDisplayName || "You", avatar: currentAvatarUrl, isUrl: true },
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
  const slots = [1, 2, 3, 4];
  // Each slot gets fixed sequential avatar
  slots.forEach((slot) => updateAvatar(slot, slot - 1));

  // Add event listeners for navigation buttons
  for (let slot = 1; slot <= 4; slot++) {
    const avatarContainer = document.getElementById(
      `t-avatar-player-${slot}`,
    )?.parentElement;
    if (avatarContainer) {
      const buttons = avatarContainer.querySelectorAll("button");
      const prevBtn = buttons[0]; // First button is previous
      const nextBtn = buttons[1]; // Second button is next

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
    startButton.addEventListener("click", (e) => {
      e.preventDefault();
      collectLocalTournamentData();
      const container = document.getElementById("content");
      navigateTo("/tournament-tree", container);
    });
  }
}

function setupRemoteEventListeners() {
  const startButton = document.getElementById("start-tournament-button");

  if (startButton) {
    startButton.addEventListener("click", (e) => {
      e.preventDefault();
      collectRemoteTournamentData();
      const container = document.getElementById("content");
      navigateTo("/tournament-tree", container);
    });
  }
}

function collectLocalTournamentData() {
  const players = [];

  for (let i = 1; i <= 4; i++) {
    const nameInput = document.getElementById(
      `t-player-${i}-name`,
    ) as HTMLInputElement;
    const avatarImg = document.getElementById(
      `t-avatar-player-${i}`,
    ) as HTMLImageElement;

    const username =
      nameInput?.value || nameInput?.placeholder || `Player ${i}`;
    const avatarSrc = avatarImg?.src || "";
    const avatarFilename = avatarSrc.split("/").pop() || avatars[i - 1];

    players.push({
      username: username,
      avatar: avatarFilename,
    });
  }

  tournamentData = {
    type: "local",
    players: players,
  };
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
  // To do...
  // ...
  // ...
}

// Export functions for tournament tree to use
export function getTournamentData(): TournamentData | null {
  return tournamentData ? { ...tournamentData } : null;
}
