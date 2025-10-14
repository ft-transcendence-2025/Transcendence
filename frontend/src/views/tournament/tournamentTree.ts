import { navigateTo } from "../../router/router.js";
import { loadHtml } from "../../utils/htmlLoader.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
  getCurrentUsername,
  truncateString25,
} from "../../utils/userUtils.js";
import { getUserAvatar } from "../../services/profileService.js";
import {
  getLocalTournamentState,
  TournamentState,
  fetchLocalTournament,
  PlayerInfo,
} from "./tournamentSetup.js";
import { router } from "./../../router/router.js";

export async function renderTournamentTree(container: HTMLElement | null) {
  if (!container) return;

  setupLocalTournamentTree(container);
}

async function setupLocalTournamentTree(container: HTMLElement) {
  const localTournamentPlayersInfo = localStorage.getItem(
    "LocalTournamentPlayersInfo",
  );
  if (!localTournamentPlayersInfo) return;
  const playersInfo = JSON.parse(localTournamentPlayersInfo);
  if (!playersInfo) return;

  await fetchLocalTournament(playersInfo);

  const localTournamentState = getLocalTournamentState();
  if (!localTournamentState) return;

  container.innerHTML = await loadHtml("/html/tournamentTree.html");
  setNames(container, localTournamentState);
  setButtons(container, localTournamentState);
  leaveLocalTournament(container);
}

function leaveLocalTournament(container: HTMLElement) {
  const leaveBtn = document.querySelector("#leave-tournament-btn");
  if (!leaveBtn) return;

  leaveBtn.addEventListener("click", async () => {
    localStorage.removeItem("LocalTournamentPlayersInfo");
    localStorage.removeItem("LocalTournamentState");
    const baseUrl = window.location.origin;

    const response = await fetch(
      `${window.location.origin}/api/tournament/local`,
      {
        method: "DELETE",
      },
    );

    const isLogin = isPlayerLogin();
    if (isLogin) {
      localStorage.removeItem("isLogin");
      navigateTo("/", container);
    } else {
      navigateTo("/dashboard", container);
    }
  });
}

function isPlayerLogin() {
  const isLoginStr = localStorage.getItem("isLogin");
  if (!isLoginStr) {
    return false;
  }
  return true;
}

function setButtons(container: HTMLElement, tournamentState: TournamentState) {
  let playersInfo = null;
  if (location.search.split("=")[1] !== "remote") {
    const localTournamentPlayersInfo = localStorage.getItem(
      "LocalTournamentPlayersInfo",
    );
    if (!localTournamentPlayersInfo) return;
    playersInfo = JSON.parse(localTournamentPlayersInfo);
    if (!playersInfo) return;
  }

  const button1 = container.querySelector("#button-game1") as HTMLButtonElement;
  const button2 = container.querySelector("#button-game2") as HTMLButtonElement;
  const button3 = container.querySelector("#button-game3") as HTMLButtonElement;
  if (!button1 || !button2 || !button3) return;

  if (!tournamentState.match1.winner) {
    setStartBtn(button1, tournamentState);
    updateMatchStatus(container, 1, "active");
    updateProgressBar(container, 33, "Match 1 in Progress");
  } else if (tournamentState.match1.winner) {
    // Go to Second Math
    const finalPlayer1 = container.querySelector("#final-player1");
    if (!finalPlayer1) return;
    finalPlayer1.setAttribute(
      "data-full-name",
      tournamentState.match1.winner || "",
    );
    finalPlayer1.textContent = truncateString25(tournamentState.match1.winner);
    finalPlayer1.classList.remove("text-gray-400");
    finalPlayer1.classList.add("text-gray-900", "font-bold");

    // Show winner indicator for game 1
    showWinnerIndicator(container, 1, tournamentState.match1.winner);

    updateMatchStatus(container, 1, "completed");
    setBtnFinished(button1);
    setStartBtn(button2, tournamentState);
    updateMatchStatus(container, 2, "active");
    updateProgressBar(container, 50, "Match 2 in Progress");
  }
  if (tournamentState.match2.winner) {
    // Go to Final Match
    const finalPlayer2 = container.querySelector("#final-player2");
    if (!finalPlayer2) return;
    finalPlayer2.setAttribute(
      "data-full-name",
      tournamentState.match2.winner || "",
    );
    finalPlayer2.textContent = truncateString25(tournamentState.match2.winner);
    finalPlayer2.classList.remove("text-gray-400");
    finalPlayer2.classList.add("text-gray-900", "font-bold");

    // Show winner indicator for game 2
    showWinnerIndicator(container, 2, tournamentState.match2.winner);

    updateMatchStatus(container, 1, "completed");
    updateMatchStatus(container, 2, "completed");
    setBtnFinished(button1);
    setBtnFinished(button2);
    setStartBtn(button3, tournamentState);
    updateMatchStatus(container, 3, "active");
    updateProgressBar(container, 75, "Final Match in Progress");
  }
  if (tournamentState.match3.winner) {
    console.log("[Tournament Tree] Match 3 winner detected:", tournamentState.match3.winner);
    // Disable buttom
    updateMatchStatus(container, 1, "completed");
    updateMatchStatus(container, 2, "completed");
    updateMatchStatus(container, 3, "completed");
    setBtnFinished(button1);
    setBtnFinished(button2);
    setBtnFinished(button3);
    setTournamentWinner(container, tournamentState, playersInfo);
    updateProgressBar(container, 100, "Tournament Complete!");
  }
}

async function setTournamentWinner(
  container: HTMLElement,
  tournamentState: TournamentState,
  playerInfo: PlayerInfo[] | null,
) {
  const tournamentWinner = container.querySelector("#TournamentWinnerName");
  const tournamentWinnerAvatar = container.querySelector("#t-avatar-winner");
  if (!tournamentWinner || !tournamentWinnerAvatar) return;
  
  if (!tournamentState.match3.winner) {
    console.error("No winner found in tournament state");
    return;
  }
  
  tournamentWinner.setAttribute(
    "data-full-name",
    tournamentState.match3.winner || "",
  );
  tournamentWinner.textContent = truncateString25(
    tournamentState.match3.winner,
  );

  let avatar = "";
  if (playerInfo === null) {
    // Remote tournament - fetch winner's avatar from server by username
    console.log(`Fetching avatar for tournament winner: ${tournamentState.match3.winner}`);
    avatar = await getUserAvatar(tournamentState.match3.winner);
  } else {
    // Local tournament - find avatar in player info
    for (let i = 0; i < 4; ++i) {
      if (playerInfo[i].userDisplayName === tournamentState.match3.winner) {
        avatar = `${playerInfo[i].avatar}`;
        break;
      }
    }
  }

  // Set Winner Avatars
  tournamentWinnerAvatar.setAttribute("src", avatar);
}

function setNames(
  container: HTMLElement,
  localTournamentState: TournamentState,
) {
  const player1 = container.querySelector("#game1-player1");
  const player2 = container.querySelector("#game1-player2");
  const player3 = container.querySelector("#game2-player1");
  const player4 = container.querySelector("#game2-player2");
  if (!player1 || !player2 || !player3 || !player4) return;

  // Store full names in data attributes and display truncated names
  player1.setAttribute(
    "data-full-name",
    localTournamentState.match1.player1 || "",
  );
  player1.textContent = truncateString25(localTournamentState.match1.player1);

  player2.setAttribute(
    "data-full-name",
    localTournamentState.match1.player2 || "",
  );
  player2.textContent = truncateString25(localTournamentState.match1.player2);

  player3.setAttribute(
    "data-full-name",
    localTournamentState.match2.player1 || "",
  );
  player3.textContent = truncateString25(localTournamentState.match2.player1);

  player4.setAttribute(
    "data-full-name",
    localTournamentState.match2.player2 || "",
  );
  player4.textContent = truncateString25(localTournamentState.match2.player2);
}

function setBtnFinished(button: HTMLButtonElement) {
  button.removeAttribute("class");
  button.setAttribute(
    "class",
    "game-button w-full rounded-lg bg-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed",
  );
  button.setAttribute("disabled", "");
  const buttonText = button.querySelector(".button-text");
  const icon = button.querySelector("i");
  if (buttonText && icon) {
    icon.className = "fa-solid fa-check mr-2";
    buttonText.textContent = "Completed";
  } else {
    button.innerHTML = '<i class="fa-solid fa-check mr-2"></i><span class="button-text">Completed</span>';
  }
}

function setStartBtn(button: HTMLButtonElement, state: TournamentState) {
  button.removeAttribute("class");
  button.setAttribute(
    "class",
    "game-button w-full rounded-lg bg-(--color-primary) px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-(--color-primary-dark) hover:shadow-md",
  );
  
  const buttonText = button.querySelector(".button-text");
  const icon = button.querySelector("i");
  
  if (state.currentGameScore.player1 || state.currentGameScore.player2) {
    if (buttonText && icon) {
      icon.className = "fa-solid fa-rotate-right mr-2";
      buttonText.textContent = "Continue Match";
    } else {
      button.innerHTML = '<i class="fa-solid fa-rotate-right mr-2"></i><span class="button-text">Continue Match</span>';
    }
  } else {
    if (buttonText && icon) {
      icon.className = "fa-solid fa-play mr-2";
      buttonText.textContent = "Start Match";
    } else {
      button.innerHTML = '<i class="fa-solid fa-play mr-2"></i><span class="button-text">Start Match</span>';
    }
  }
  
  button.removeAttribute("disabled");
  button.addEventListener("click", enterGame);
}

// Update match status badges
function updateMatchStatus(container: HTMLElement, matchNumber: number, status: "waiting" | "active" | "completed") {
  const statusBadge = container.querySelector(`.match-status-${matchNumber}`) as HTMLElement;
  if (!statusBadge) return;

  const statusText = statusBadge.querySelector(".status-text");
  const icon = statusBadge.querySelector("i");
  
  if (!statusText || !icon) return;

  // Reset classes
  statusBadge.className = "match-status-badge match-status-" + matchNumber + " rounded-full px-3 py-1 text-xs font-medium";

  switch (status) {
    case "active":
      statusBadge.classList.add("bg-(--color-primary)", "text-white");
      icon.className = "fa-solid fa-circle-dot mr-1";
      statusText.textContent = "Live";
      break;
    case "completed":
      statusBadge.classList.add("bg-(--color-primary-dark)", "text-white");
      icon.className = "fa-solid fa-check mr-1";
      statusText.textContent = "Complete";
      break;
    case "waiting":
    default:
      statusBadge.classList.add("bg-gray-100", "text-gray-500");
      icon.className = "fa-solid fa-clock mr-1";
      statusText.textContent = "Waiting";
      break;
  }
  
  // Update player number badges color
  updatePlayerBadges(container, matchNumber, status);
}

// Update player number badge colors based on match status
function updatePlayerBadges(container: HTMLElement, matchNumber: number, status: string) {
  let badge1: Element | null | undefined = null;
  let badge2: Element | null | undefined = null;
  
  if (matchNumber === 1) {
    badge1 = container.querySelector("#game1-player1")?.previousElementSibling?.querySelector("div");
    badge2 = container.querySelector("#game1-player2")?.previousElementSibling?.querySelector("div");
  } else if (matchNumber === 2) {
    badge1 = container.querySelector("#game2-player1")?.previousElementSibling?.querySelector("div");
    badge2 = container.querySelector("#game2-player2")?.previousElementSibling?.querySelector("div");
  }
  
  if (badge1 && badge2) {
    if (status === "active") {
      badge1.className = "flex h-7 w-7 items-center justify-center rounded-full bg-(--color-primary) text-xs font-bold text-white";
      badge2.className = "flex h-7 w-7 items-center justify-center rounded-full bg-(--color-primary) text-xs font-bold text-white";
    } else if (status === "completed") {
      badge1.className = "flex h-7 w-7 items-center justify-center rounded-full bg-(--color-primary-dark) text-xs font-bold text-white";
      badge2.className = "flex h-7 w-7 items-center justify-center rounded-full bg-(--color-primary-dark) text-xs font-bold text-white";
    }
  }
}

// Update progress bar
function updateProgressBar(container: HTMLElement, percentage: number, text: string) {
  const progressBar = container.querySelector("#tournament-progress-bar") as HTMLElement;
  const progressText = container.querySelector("#tournament-progress-text");
  
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
  
  if (progressText) {
    progressText.textContent = text;
  }
}

function enterGame() {
  const container = document.getElementById("content");
  navigateTo("/pong?mode=localtournament", container);
}

function updateTournamentTitle(type: "local" | "remote") {
  const titleElement = document.querySelector("#tournament-tree h2");
  if (titleElement) {
    const typeText = type === "local" ? "Local" : "Remote";
    titleElement.textContent = `${typeText} Tournament Tree`;
  }
}

function showWinnerIndicator(
  container: HTMLElement,
  gameNumber: number,
  winnerName: string,
) {
  // Determine which player won based on their name
  const game1Player1 = container.querySelector("#game1-player1")?.textContent;
  const game1Player2 = container.querySelector("#game1-player2")?.textContent;
  const game2Player1 = container.querySelector("#game2-player1")?.textContent;
  const game2Player2 = container.querySelector("#game2-player2")?.textContent;

  let winnerIndicatorId = "";

  if (gameNumber === 1) {
    if (winnerName === game1Player1) {
      winnerIndicatorId = "#game1-player1-indicator";
    } else if (winnerName === game1Player2) {
      winnerIndicatorId = "#game1-player2-indicator";
    }
  } else if (gameNumber === 2) {
    if (winnerName === game2Player1) {
      winnerIndicatorId = "#game2-player1-indicator";
    } else if (winnerName === game2Player2) {
      winnerIndicatorId = "#game2-player2-indicator";
    }
  }

  if (winnerIndicatorId) {
    const indicator = container.querySelector(winnerIndicatorId);
    if (indicator) {
      indicator.classList.remove("hidden");
    }
  }
}
