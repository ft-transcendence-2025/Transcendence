import { navigateTo } from "../../router/router.js";
import { loadHtml }   from "../../utils/htmlLoader.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
  getCurrentUsername,
} from "../../utils/userUtils.js";
import { GameData } from "../pong.js";
import { GameState } from "../game/utils.js";

export interface TournamentState {
  id: number,
  match1: {
    player1: string | null,
    player2: string | null,
    winner: string | null,
  }
  match2: {
    player1: string | null,
    player2: string | null,
    winner: string | null,
  }
  match3: {
    player1: string,
    player2: string,
    winner: string,
  }
  currentGameScore: {
    player1: number,
    player2: number,
  },
  gameState: GameState | null,
}

export interface PlayerInfo {
  username: string | null;
  userDisplayName: string;
  avatar: string;
}

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
  // Initialize avatars for all players (1-4)
  initializeAvatars();

  // Populate Player 1 with current user data if logged in
  populatePlayer1Data();

  // Setup event listeners for local tournament
  setupLocalEventListeners();
}

async function populatePlayer1Data() {
  const player1Name = document.getElementById(
    "t-player-1-name",
  ) as HTMLInputElement;
  const player1Avatar = document.getElementById(
    "t-avatar-player-1",
  ) as HTMLImageElement;

  if (player1Name && player1Avatar) {
    // Check if user is logged in
    const currentUsername = getCurrentUsername();

    // If user is logged-in, populate their data
    if (currentUsername) {
      const displayName = await getUserDisplayName();
      const avatarUrl = await getCurrentUserAvatar();

      player1Name.value = displayName || "Player 1";
      player1Avatar.src = avatarUrl;

      // Add error handling for avatar - fallback to local avatar
      player1Avatar.onerror = () => {
        player1Avatar.src = "/assets/avatars/panda.png";
        // Set the avatar index to match the fallback (panda is index 7)
        currentAvatarIndex[1] = 7;
      };
    } else {
      // User not logged in - set default values
      player1Name.value = "";
      player1Name.placeholder = "LazyLoader";
      // default avatar will be set by initializeAvatars()
    }
  }
}

/*
 ** Avatar management functions (for local tournaments)
 */
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
  const slots = [1, 2, 3, 4]; // Include all players

  // Check if Player 1 is logged in user with custom avatar
  const currentUsername = getCurrentUsername();
  const player1Avatar = document.getElementById(
    "t-avatar-player-1",
  ) as HTMLImageElement;

  if (
    currentUsername &&
    player1Avatar &&
    !player1Avatar.src.includes("/assets/avatars/")
  ) {
    // don't override Player 1 avatar, but let them change if they want
    currentAvatarIndex[1] = 0; // Default to first avatar if player makes avatar switch
  } else {
    updateAvatar(1, 0); // Set to first avatar
  }

  // Set default avatars for other players
  slots.slice(1).forEach((slot) => updateAvatar(slot, slot - 1));

  // Add event listeners for navigation buttons for all players (1-4)
  for (let slot = 1; slot <= 4; slot++) {
    const avatarImg = document.getElementById(`t-avatar-player-${slot}`);
    if (avatarImg?.parentElement) {
      // Get the div that contains the avatar and buttons
      const avatarContainer = avatarImg.parentElement;

      // Use specific CSS classes for more robust selection
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

async function setupLocalEventListeners() {
  const startButton = document.getElementById("start-tournament-button");

  if (startButton) {
    startButton.addEventListener("click", async (e) => {
      localStorage.removeItem("LocalTournamentState");
      localStorage.removeItem("LocalTournamentPlayersInfo");

      // Only proceed if data collection succeeds (no duplicates)
      if (await collectLocalTournamentData()) {
        let container = document.getElementById("content");
        if (!container) return ;
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

    // Determine username and avatar handling
    let username = null;
    let avatarData;

    const avatarSrc = avatarImg?.src || "";
    avatarData = avatarSrc.split("/").pop() || avatars[i - 1];

    players.push({
      username: username,
      userDisplayName: userDisplayName,
      avatar: avatarData,
    });
  }
  fetchLocalTournament(players);

  return true;
}

export async function fetchLocalTournament(players: PlayerInfo[]) {
  try {
    const baseUrl = window.location.origin;

    const response = await fetch(`${baseUrl}/api/tournament/local`, {
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
    const tournamentState = await response.json();
    localStoreTournamentData(tournamentState, players);
  } catch (e) {
    console.error("Failed to fetch tournament:", e);
  }
}

export function localStoreTournamentData(tournamentState: TournamentState, players: PlayerInfo[]) {
  localStorage.setItem("LocalTournamentState", JSON.stringify(tournamentState));
  localStorage.setItem("LocalTournamentPlayersInfo", JSON.stringify(players));
}

export function getLocalTournamentState() {
  const localTournamentStateString = localStorage.getItem("LocalTournamentState");
  if (!localTournamentStateString) return ;

  const localTournamentState = JSON.parse(localTournamentStateString) as TournamentState;
  if (!localTournamentState) return ;

  return localTournamentState ;
}

export function getRemoteTournamentState(): TournamentState | void {
  const remoteTournamentStateString = localStorage.getItem("RemoteTournament");
  if (!remoteTournamentStateString)
    return ;

  const remoteTournamentState = JSON.parse(remoteTournamentStateString) as TournamentState;
  if (!remoteTournamentState) return ;

  return remoteTournamentState ;
}
