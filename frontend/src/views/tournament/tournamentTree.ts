import { navigateTo } from "../../router/router.js";
import { loadHtml }   from "../../utils/htmlLoader.js";
import {
  getUserDisplayName,
  getCurrentUserAvatar,
  getCurrentUsername,
} from "../../utils/userUtils.js";
import { 
  getLocalTournamentState, TournamentState, fetchLocalTournament, 
  PlayerInfo, getRemoteTournamentState
} from "./tournamentSetup.js";
import { router } from "./../../router/router.js";

export async function renderTournamentTree(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/tournamentTree.html");
  const mode = window.location.search.split("=")[1];


  if (mode === "remote") {
    connectRemoteTournament(container);
  }
  else {
    setupLocalTournamentTree(container);
  }
}


async function connectRemoteTournament(container: HTMLElement) {
  const remoteTournamentState = getRemoteTournamentState() as TournamentState;

  const userName = await getUserDisplayName();

  const url = `wss://${window.location.host}/ws/game/remotetournament/${remoteTournamentState.id}/${userName}`;
  const ws = new WebSocket(url);
  if (!ws) {
    console.error("Socket Connection falied at connectRemoteTournament");
    return ;
  }
  ws.addEventListener("message", (event) => {
    const tournamentState = JSON.parse(event.data) as TournamentState;
    // console.log("Tournament State:", tournamentState);
    if (!tournamentState)
      throw("gameState is undefined");
    localStorage.setItem("RemoteTournament", JSON.stringify(tournamentState));
    if (location.search.split("=")[1] === "remote") {
      setNames(container, tournamentState);
      setButtons(container, tournamentState);
    }
  });
  leaveRemoteTournament(container, ws);
}

function leaveRemoteTournament(container: HTMLElement, ws: WebSocket) {
  const leaveBtn = document.querySelector("#leave-tournament-btn");
  if (!leaveBtn) return ;

  leaveBtn.addEventListener("click", (e) => {
    localStorage.removeItem("RemoteTournament");
    ws.send(JSON.stringify({
      type: "command",
      key: "leave",
    }))
    ws.close();
    navigateTo("/dashboard", container);
  })
}


async function setupLocalTournamentTree(container: HTMLElement) {
  const localTournamentPlayersInfo = localStorage.getItem("LocalTournamentPlayersInfo");
  if (!localTournamentPlayersInfo) return ;
  const playersInfo = JSON.parse(localTournamentPlayersInfo);
  if (!playersInfo) return ;


  await fetchLocalTournament(playersInfo);

  const localTournamentState = getLocalTournamentState();
  if (!localTournamentState) return 

  setNames(container, localTournamentState);
  setButtons(container, localTournamentState);
  leaveLocalTournament(container);
}

function leaveLocalTournament(container: HTMLElement) {
  const leaveBtn = document.querySelector("#leave-tournament-btn");
  if (!leaveBtn) return ;

  leaveBtn.addEventListener("click", async () => {
    localStorage.removeItem("LocalTournamentPlayersInfo");
    localStorage.removeItem("LocalTournamentState");
    const baseUrl = window.location.origin;

    const response = await fetch(`https://localhost:5000/api/tournament/local`, {
      method: "DELETE",
    });

    const isLogin = isPlayerLogin();
    if (isLogin) {
      localStorage.removeItem("isLogin")
      navigateTo("/", container);
    }
    else {
      navigateTo("/dashboard", container);
    }

  })
}

function isPlayerLogin() {
  const isLoginStr = localStorage.getItem("isLogin");
  if (!isLoginStr) {
    return false;
  }
  return true;
}


function setButtons(container: HTMLElement, tournamentState: TournamentState) {
  const localTournamentPlayersInfo = localStorage.getItem("LocalTournamentPlayersInfo");
  if (!localTournamentPlayersInfo) return ;
  const playersInfo = JSON.parse(localTournamentPlayersInfo);
  if (!playersInfo) return ;

  const button1 = container.querySelector("#button-game1") as HTMLButtonElement;
  const button2 = container.querySelector("#button-game2") as HTMLButtonElement;
  const button3 = container.querySelector("#button-game3") as HTMLButtonElement;
  if (!button1 || !button2 || !button3) return ;

  if (!tournamentState.match1.winner) {
    setStartBtn(button1, tournamentState);
  }
  else if (tournamentState.match1.winner) {
    // Go to Second Math
    const finalPlayer1 = container.querySelector("#final-player1");
    if (!finalPlayer1) return ;
    finalPlayer1.textContent = tournamentState.match1.winner;

    setBtnFinished(button1);
    setStartBtn(button2, tournamentState);
  }
  if (tournamentState.match2.winner) {
    // Go to Final Match
    const finalPlayer2 = container.querySelector("#final-player2");
    if (!finalPlayer2) return ;
    finalPlayer2.textContent = tournamentState.match2.winner;

    setBtnFinished(button1);
    setBtnFinished(button2);
    setStartBtn(button3, tournamentState);
  }
  if (tournamentState.match3.winner) {
    // Disable buttom
    setBtnFinished(button1);
    setBtnFinished(button2);
    setBtnFinished(button3);
    setTournamentWinner(container, tournamentState, playersInfo);
  }
}

async function setTournamentWinner(container: HTMLElement, tournamentState: TournamentState, playerInfo: PlayerInfo[]) {
  const tournamentWinner = container.querySelector("#TournamentWinnerName");
  const tournamentWinnerAvatar = container.querySelector("#t-avatar-winner");
  if (!tournamentWinner || !tournamentWinnerAvatar) return ;
  tournamentWinner.textContent = tournamentState.match3.winner;

  let avatar = "";
  console.log("playerInfo:", playerInfo);
  for (let i = 0; i < 4; ++i) {
    if (playerInfo[i].userDisplayName === tournamentState.match3.winner) {
      avatar = `/assets/avatars/${playerInfo[i].avatar}`;
      break ;
    }
  }

  // Set Winner Avatars
  tournamentWinnerAvatar.setAttribute("src", avatar);
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
  const mode = window.location.search.split("=")[1];

  if (mode === "remote") {
    const container = document.getElementById("content");
    navigateTo("/pong?mode=remotetournament", container);
  }
  else {
    const container = document.getElementById("content");
    navigateTo("/pong?mode=localtournament", container);
  }
}

function updateTournamentTitle(type: "local" | "remote") {
  const titleElement = document.querySelector("#tournament-tree h2");
  if (titleElement) {
    const typeText = type === "local" ? "Local" : "Remote";
    titleElement.textContent = `${typeText} Tournament Tree`;
  }
}
