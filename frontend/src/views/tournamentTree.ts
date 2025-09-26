import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUserAvatar } from "../utils/userUtils.js";
import { getTournamentState, TournamentState, fetchTournament, PlayerInfo } from "./tournamentSetup.js";

export async function renderTournamentTree(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/tournamentTree.html");

  // Get tournament data and setup the tournament tree
  setupTournamentTree(container);
}

export async function setupTournamentTree(container: HTMLElement) {

  const localTournamentPlayersInfo = localStorage.getItem("LocalTournamentPlayersInfo");
  if (!localTournamentPlayersInfo) return ;
  const playersInfo = JSON.parse(localTournamentPlayersInfo);
  if (!playersInfo) return ;

  await fetchTournament(playersInfo);

  const localTournamentState = getTournamentState();
  if (!localTournamentState) return 
  setNames(container, localTournamentState);

  const button1 = container.querySelector("#button-game1") as HTMLButtonElement;
  const button2 = container.querySelector("#button-game2") as HTMLButtonElement;
  const button3 = container.querySelector("#button-game3") as HTMLButtonElement;
  if (!button1 || !button2 || !button3) return ;

  if (!localTournamentState.match1.winner) {
    setStartBtn(button1, localTournamentState);
  }
  else if (localTournamentState.match1.winner) {
    // Go to Second Math
    const finalPlayer1 = container.querySelector("#final-player1");
    if (!finalPlayer1) return ;
    finalPlayer1.textContent = localTournamentState.match1.winner;

    setBtnFinished(button1);
    setStartBtn(button2, localTournamentState);
  }
  if (localTournamentState.match2.winner) {
    // Go to Final Match
    const finalPlayer2 = container.querySelector("#final-player2");
    if (!finalPlayer2) return ;
    finalPlayer2.textContent = localTournamentState.match2.winner;

    setBtnFinished(button1);
    setBtnFinished(button2);
    setStartBtn(button3, localTournamentState);
  }
  if (localTournamentState.match3.winner) {
    // Disable buttom
    setBtnFinished(button1);
    setBtnFinished(button2);
    setBtnFinished(button3);
    setTournamentWinner(container, localTournamentState, playersInfo);
  }
}

function setTournamentWinner(container: HTMLElement, localTournamentState: TournamentState, playersInfo: PlayerInfo[]) {
  const tournamentWinner = container.querySelector("#TournamentWinnerName");
  const tournamentWinnerAvatar = container.querySelector("#t-avatar-winner");
  if (!tournamentWinner || !tournamentWinnerAvatar) return ;
  tournamentWinner.textContent = localTournamentState.match3.winner;

  // Set Winner Avatars
  for (const i in playersInfo) {
    if (playersInfo[i].userDisplayName === localTournamentState.match3.winner) {
      tournamentWinnerAvatar.setAttribute("src", `/assets/avatars/${playersInfo[i].avatar}`)
      break ;
    }
  }
}

function setNames(container: HTMLElement, localTournamentState: TournamentState) {
  const player1 = container.querySelector("#game1-player1");
  const player2 = container.querySelector("#game1-player2");
  const player3 = container.querySelector("#game2-player1");
  const player4 = container.querySelector("#game2-player2");
  if (!player1 || !player2 || !player3 || !player4) return ;

  player1.textContent = localTournamentState.match1.player1;
  player2.textContent = localTournamentState.match1.player2;
  player3.textContent = localTournamentState.match2.player1;
  player4.textContent = localTournamentState.match2.player2;
}

function setBtnFinished(button: HTMLButtonElement) {
  button.removeAttribute("class");
  button.setAttribute("class", "rounded bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500")
  button.setAttribute("disabled", "");
  button.textContent = "Finished"
}

function setStartBtn(button: HTMLButtonElement, state: TournamentState) {
  button.removeAttribute("class");
  button.setAttribute("class", "rounded bg-(--color-secondary) px-4 py-2 text-sm font-medium hover:bg-(--color-secondary-light)")
  if (state.currentGameScore.player1 || state.currentGameScore.player2) {
    button.textContent = "Continue"
  }
  else {
    button.textContent = "Start Game"
  }
  button.removeAttribute("disabled");
  button.addEventListener("click", enterGame)
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

