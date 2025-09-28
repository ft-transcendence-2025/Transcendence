import { loadHtml } from "../utils/htmlLoader.js";
import {
  getPlayerMatches,
  MatchResponse,
  Match
} from "../services/blockchainService.js";
import { getAccessToken } from "../utils/api.js";

/*
//Extracting the username from the JWT token.
function getPlayerIdFromToken(token: string | null): string | null {
  if (!token) {
    console.log("No token found. Please log in.");
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Rough JWT decode
    return payload.username || null;
  } catch (err: any) {
    console.error("Invalid token format:", err.message);
    return null;
  }
}*/

function getPlayerIdQueryString(): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    if (!username) {
      console.log("No username found in query string.");
      return null;
    }
    return username;
  } catch (err: any) {
    console.error("Error parsing query string:", err.message);
    return null;
  }
}

export async function renderStats(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  // container.innerHTML = await loadHtml("/html/stats.html");

  // Fetching player games history
  let playerMatchesResponse: MatchResponse | null = null;
  const token = getAccessToken();
  const playerId = getPlayerIdQueryString();
  if (!playerId) {
    console.error("Cannot fetch matches: No valid playerId from token.");
    return; // Stop if no valid playerId
  }
  try {
    playerMatchesResponse = await getPlayerMatches(playerId);
  } catch (err: any) {
    console.error(`Error fetching matches for ${playerId}:`, err.message || err);
  }

  // Updating the visual element placeholders
  // User Total Games
  let gamesCount: number = 0;
  const totalGames = document.getElementById("user-total-games-count"); 
  if (totalGames) {
    gamesCount = playerMatchesResponse?.count ?? 0; //Default value equals 0.
    totalGames.textContent = gamesCount.toString();
  } else {
    console.error("Element 'user-total-games-count' not found");
  }

  // User Total Games Won
  let winCount: number = 0;
  const totalGamesWon = document.getElementById("user-games-won-count");
  if (totalGamesWon) {
    if (playerMatchesResponse?.matches) {
      winCount = playerMatchesResponse?.matches?.reduce((count, match) => {
        return match.winner === playerId ? count + 1 : count;
      }, 0);
      totalGamesWon.textContent = winCount.toString();
    } else {
      totalGamesWon.textContent = "0";
    }
  } else {
    console.error("Element 'user-games-won-count' not found");
  }

  // User Total Games Lost
  let lostCount: number = 0;
  const totalGamesLost = document.getElementById("user-games-lost-count");
  if (totalGamesLost) {
    lostCount = gamesCount - winCount;
    totalGamesLost.textContent = lostCount.toString();
  } else {
    console.error("Element 'user-games-lost-count' not found")
  }

  // Overall Win Percentage
  let winRate: number = 0;
  const overallWinRate = document.getElementById("overall-win-percentage");
  if (overallWinRate && gamesCount > 0) {
    winRate = (winCount / gamesCount) * 100;
    overallWinRate.textContent = `${winRate.toFixed(1).toString()}%`;
  } else {
    console.error("Element 'overall-win-percentage not found");
  }

  // Overall Win Bar
  const overallWinBar = document.getElementById("win-rate-progress-bar");
  if (overallWinBar) {
    overallWinBar.style.width = `${winRate.toFixed(1).toString()}%`;
  } else {
    console.error("Element 'win-rate-progress-bar' not found");
  }

  // 1v1 Total Games
  let totalV1Games: number = 0;
  const v1GamesCount = document.getElementById("1v1-games-played");
  if (v1GamesCount) {
    if (playerMatchesResponse?.matches) {
      totalV1Games = playerMatchesResponse?.matches?.reduce((count, match) => {
        return match.tournamentId === "0" ? count + 1 : count;
      }, 0);
      v1GamesCount.textContent = `${totalV1Games.toString()} played`;
    } else {
      v1GamesCount.textContent = "0 played"
    }
  } else {
    console.error("Element '1v1-games-played' not found");
  }


  // 1v1 Total Games Won
  let totalV1GamesWon: number = 0;
  const v1GamesWonCount = document.getElementById("1v1-wins");
  if (v1GamesWonCount) {
    if (playerMatchesResponse?.matches) {
      totalV1GamesWon = playerMatchesResponse?.matches?.reduce((count, match) => {
        return match.winner === playerId && match.tournamentId === "0" ? count + 1 : count;
      }, 0);
      v1GamesWonCount.textContent = `${totalV1GamesWon.toString()} wins`;
    } else {
      v1GamesWonCount.textContent = "0 wins"
    }
  } else {
    console.error("Element '1v1-wins' not found");
  }

  // 1v1 Total Games Lost
  let totalV1GamesLost: number = 0;
  const v1GamesLostCount = document.getElementById("1v1-losses");
  if (v1GamesLostCount) {
    if (playerMatchesResponse?.matches) {
      totalV1GamesLost = totalV1Games - totalV1GamesWon;
      v1GamesLostCount.textContent = `${totalV1GamesLost.toString()} losses`;
    } else {
      v1GamesLostCount.textContent = "0 losses";
    }
  } else {
    console.error("Element '1v1-losses' not found");
  }


  // 1v1 Overall Win Percentage
  let v1WinRate: number = 0;
  const v1OverallWinRate = document.getElementById("1v1-win-rate");
  if (v1OverallWinRate && totalV1Games > 0) {
    v1WinRate = (totalV1GamesWon / totalV1Games) * 100;
    v1OverallWinRate.textContent = `${v1WinRate.toFixed(1).toString()}%`;
  } else {
    console.error("Element '1v1-win-rate' not found");
  }


  // Tournament Total Games
  let totalTournamentGames: number = 0;
  const tournamentGamesCount = document.getElementById("tournament-games-played");
  if (tournamentGamesCount) {
    if (playerMatchesResponse?.matches) {

      // Build a set of tournament Ids (to remove duplicates)
      const uniqueTournamentIds = new Set(
        playerMatchesResponse.matches
          .filter(match => match.tournamentId !== "0")
          .map(match => match.tournamentId)
      );
      totalTournamentGames = uniqueTournamentIds.size;
      tournamentGamesCount.textContent = `${totalTournamentGames.toString()} played`;
    } else {
      tournamentGamesCount.textContent = "0 played"
    }
  } else {
    console.error("Element 'tournament-games-played' not found");
  }

  // Tournament Total Games Won
  let totalTournamentGamesWon: number = 0;
  const tournamentGamesWonCount = document.getElementById("tournament-wins");
  if (tournamentGamesWonCount) {
    if (playerMatchesResponse?.matches) {
      totalTournamentGamesWon = playerMatchesResponse?.matches?.reduce((count, match) => {
        return match.winner === playerId && match.tournamentId !== "0" && match.finalMatch === true ? count + 1 : count;
      }, 0);
      tournamentGamesWonCount.textContent = `${totalTournamentGamesWon.toString()} wins`;
    } else {
      tournamentGamesWonCount.textContent = "0 wins"
    }
  } else {
    console.error("Element 'tournament-wins' not found");
  }

  // Tournament Total Games Lost
  // THERE IS NO ELEMENT TO TOURNAMENT LOSSES ON THE STATS.HTML
  let totalTournamentGamesLost: number = 0;
  const tournamentGamesLostCount = document.getElementById("tournament-loss");
  if (tournamentGamesLostCount) {
    if (playerMatchesResponse?.matches) {
      totalTournamentGamesLost = totalTournamentGames - totalTournamentGamesWon;
      tournamentGamesLostCount.textContent = `${totalTournamentGamesLost.toString()} losses`;
    } else {
      tournamentGamesLostCount.textContent = "0 losses"
    }
  } else {
    console.error("Element 'tournament-loss' not found");
  }


  // Tournament Overall Win Percentage
  let tournamentWinRate: number = 0;
  const tournamentOverallWinRate = document.getElementById("tournament-win-rate");
  if (tournamentOverallWinRate && totalTournamentGames > 0) {
    tournamentWinRate = (totalTournamentGamesWon / totalTournamentGames) * 100;
    tournamentOverallWinRate.textContent = `${tournamentWinRate.toFixed(1).toString()}%`;
  } else {
    console.error("Element 'tournament-win-rate' not found");
  }


  // Building the table with recent matches.
  // Fetching the matches and sorting the new array
  const recentMatches: (Match | null)[] = Array(5).fill(null);
  if (playerMatchesResponse?.matches && playerMatchesResponse.matches.length > 0) {
    const sortedMatches = [...playerMatchesResponse.matches].sort(
      (a, b) => Number(b.startTime) - Number(a.startTime)
    );
    for (let i = 0; i < 5 && i < sortedMatches.length; i++) {
      recentMatches[i] = sortedMatches[i];
    }
  }

  //Updating each table row with recent match data.
  const updateMatchRow = (elementId: string, match: Match | null, playerid: string) => {

    //Selecting the Spans "spaces" from the HTML
    const row = document.getElementById(elementId);
    if (row && match) {
      const dateSpan = row.querySelector(".match-date");
      const opponentSpan = row.querySelector(".match-opponent");
      const scoreSpan = row.querySelector(".match-score");
      const resultSpan = row.querySelector(".match-result");
      
      
      if (dateSpan) {
        const startDate = new Date(Number(match.startTime));
        dateSpan.textContent = startDate.toLocaleString("en-US", {
          timeZone: "Europe/Lisbon",
          month: "short",
          day: "numeric",
        });
      }
      if (opponentSpan) {
        const opponent = match.player1 === playerId ? match.player2 : match.player1;
        opponentSpan.textContent = `vs ${opponent}`;
      }

      if (scoreSpan) {
        const opponentScore = match.player1 === playerId ? match.score2 : match.score1;
        const myScore = match.player1 === playerId ? match.score1 : match.score2;
        scoreSpan.textContent = `${myScore}-${opponentScore}`;
      }

      if (resultSpan) {
        resultSpan.textContent = match.winner === playerId ? "W" : "L";
        resultSpan.classList.remove("text-green-600", "text-red-600"); // Remove existing classes first
        if (match.winner === playerId) {
          resultSpan.classList.add("text-green-600");
        } else {
          resultSpan.classList.add("text-red-600");
        }
      }

    } else if (row) {
      const dateSpan = row.querySelector(".match-date");
      const opponentSpan = row.querySelector(".match-opponent");
      const scoreSpan = row.querySelector(".match-score");
      const resultSpan = row.querySelector(".match-result");
      if (dateSpan) dateSpan.textContent = "No match";
      if (opponentSpan) opponentSpan.textContent = "";
      if (scoreSpan) scoreSpan.textContent = "";
      if (resultSpan) {
        resultSpan.textContent = "";
        resultSpan.classList.remove("text-green-600", "text-red-600");
      }
    }
  };

  for (let i = 0; i < 5; i++) {
    updateMatchRow(`recent-match-${i}`, recentMatches[i], playerId);
  }

}

const container = document.getElementById("user-stats");
renderStats(container);