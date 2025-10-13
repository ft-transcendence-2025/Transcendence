// src/views/modalProfile.ts
import { getChatManager } from "../app.js";
import { closeModal } from "../components/modalManager.js";
import { navigateTo } from "../router/router.js";
import { logout } from "../services/authService.js";
import { notificationService } from "../services/notifications.service.js";
import { getProfileByUsername, getUserAvatar } from "../services/profileService.js";
import { getPlayerMatches, Match } from "../services/blockchainService.js";
import { getUserFriends } from "../services/friendship.service.js";
import { ChatComponent } from "./chat.js";
import { getCurrentUsername } from "../utils/userUtils.js";

interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  tournamentCount: number;
  recentMatches: Match[];
}

// Cache for blockchain stats
interface CachedStats {
  data: PlayerStats;
  timestamp: number;
  username: string;
}

let statsCache: CachedStats | null = null;
const CACHE_TTL = 120000; // 2 minutes in milliseconds

/**
 * Invalidate the stats cache (call this after completing a game)
 */
export function invalidateStatsCache(): void {
  statsCache = null;
}

async function getPlayerStats(username: string, useCache: boolean = true): Promise<PlayerStats> {
  // Check cache first
  if (useCache && statsCache && 
      statsCache.username === username && 
      Date.now() - statsCache.timestamp < CACHE_TTL) {
    return statsCache.data;
  }

  try {
    const matchData = await getPlayerMatches(username);
    const matches = matchData?.matches || [];
    
    const totalGames = matches.length;
    const wins = matches.filter(m => m.winner === username).length;
    const losses = totalGames - wins;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    
    // Count unique tournaments
    const tournamentIds = new Set(
      matches
        .filter(m => m.tournamentId !== "0")
        .map(m => m.tournamentId)
    );
    const tournamentCount = tournamentIds.size;
    
    // Get 3 most recent matches
    const recentMatches = matches
      .sort((a, b) => parseInt(b.endTime) - parseInt(a.endTime))
      .slice(0, 3);
    
    const stats = { totalGames, wins, losses, winRate, tournamentCount, recentMatches };
    
    // Update cache
    statsCache = {
      data: stats,
      timestamp: Date.now(),
      username: username
    };
    
    return stats;
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return { totalGames: 0, wins: 0, losses: 0, winRate: 0, tournamentCount: 0, recentMatches: [] };
  }
}

export async function getProfileModalContent(username?: string): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.className = "w-full h-full flex text-white rounded-[25px]";

  // Get current username
  if (!username) {
    username = getCurrentUsername() || "unknown";
  }

  // Ensure username is defined
  const finalUsername = username || "unknown";
  let profile: any = null;
  let avatarUrl = "/assets/avatars/panda.png";
  let friendsCount = 0;
  
  // Start with loading state for stats
  let stats: PlayerStats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    tournamentCount: 0,
    recentMatches: []
  };

  try {
    // Fetch profile and avatar first (fast)
    [profile, avatarUrl] = await Promise.all([
      getProfileByUsername(finalUsername),
      getUserAvatar(finalUsername)
    ]);

    // Get friends count
    try {
      const friendsResponse = await getUserFriends();
      friendsCount = Array.isArray(friendsResponse) ? friendsResponse.length : 0;
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  } catch (error) {
    console.error("Error loading profile data:", error);
  }

  // Calculate member duration
  let memberDuration = "New player";
  if (profile?.createdAt) {
    const createdDate = new Date(profile.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      memberDuration = "1 day";
    } else if (diffDays < 30) {
      memberDuration = `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      memberDuration = months === 1 ? "1 month" : `${months} months`;
    } else {
      const years = Math.floor(diffDays / 365);
      memberDuration = years === 1 ? "1 year" : `${years} years`;
    }
  }

  // Get unread message count
  const unreadMessages = notificationService.getState().messageNotifications;
  const totalUnreadMessages = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);

  // Get user status
  const statusColors = {
    ONLINE: "bg-green-500",
    OFFLINE: "bg-gray-500",
    IN_GAME: "bg-yellow-500"
  };
  const statusColor = statusColors[profile?.status as keyof typeof statusColors] || statusColors.OFFLINE;

  container.innerHTML = `
    <style>
      /* Custom Scrollbar Styling */
      .profile-modal-content::-webkit-scrollbar {
        width: 8px;
      }
      
      .profile-modal-content::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
        margin: 8px 0;
      }
      
      .profile-modal-content::-webkit-scrollbar-thumb {
        background: var(--color-secondary);
        border-radius: 10px;
        transition: background 0.3s ease;
      }
      
      .profile-modal-content::-webkit-scrollbar-thumb:hover {
        background: var(--color-secondary-light);
      }
      
      /* Firefox scrollbar styling */
      .profile-modal-content {
        scrollbar-width: thin;
        scrollbar-color: var(--color-secondary) rgba(0, 0, 0, 0.2);
      }
    </style>
    <aside class="profile-modal-content flex w-full flex-col gap-6 p-6 h-full justify-between overflow-y-auto">
      <!-- Avatar and User Info -->
      <div>
        <div class="flex flex-col items-center text-center">
          <div class="relative">
            <img
              id="user-avatar"
              src="${avatarUrl}"
              alt="Avatar"
              class="mb-4 h-44 w-44 rounded-full border-4 border-(--color-secondary) object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onerror="this.onerror=null;this.src='/assets/avatars/panda.png';"
            />
            <!-- Status Indicator -->
            <div class="absolute bottom-6 right-2 ${statusColor} w-6 h-6 rounded-full border-4 border-white"></div>
          </div>
          <h2 id="display-username" class="text-2xl font-bold text-white">${profile?.userUsername || finalUsername}</h2>
          <p id="user-nickname" class="text-sm text-(--color-secondary-light)">
            ${profile?.nickName || 'No nickname set'}
          </p>
          <span class="mt-2 text-xs px-3 py-1 rounded-full bg-(--color-primary-dark) text-(--color-secondary-light)">
            Member for ${memberDuration}
          </span>
        </div>

        <!-- Quick Stats Cards -->
        <div class="grid grid-cols-2 gap-3 mt-6">
          <div class="bg-(--color-primary-dark)/50 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-(--color-secondary)" data-stat="totalGames">
              <span class="inline-block animate-pulse">...</span>
            </p>
            <p class="text-xs text-white/70">Total Games</p>
          </div>
          <div class="bg-(--color-primary-dark)/50 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-green-500" data-stat="wins">
              <span class="inline-block animate-pulse">...</span>
            </p>
            <p class="text-xs text-white/70">Victories</p>
          </div>
          <div class="bg-(--color-primary-dark)/50 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-(--color-secondary)" data-stat="winRate">
              <span class="inline-block animate-pulse">...</span>
            </p>
            <p class="text-xs text-white/70">Win Rate</p>
          </div>
          <div class="bg-(--color-primary-dark)/50 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-(--color-secondary)">${friendsCount}</p>
            <p class="text-xs text-white/70">Friends</p>
          </div>
        </div>

        <!-- Performance Stats -->
        <div class="space-y-3 mt-6">
          <h3 class="border-b border-(--color-secondary-dark) pb-2 text-sm font-bold text-white uppercase flex items-center gap-2">
            <span class="material-symbols-outlined text-yellow-500">trophy</span>
            Performance
          </h3>
          <ul class="space-y-2 text-sm text-white">
            <li class="flex items-center justify-between bg-(--color-primary-dark)/30 rounded-lg px-3 py-2">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-green-400 text-lg">check_circle</span> Wins
              </span>
              <span class="font-semibold text-green-400" data-stat="wins">
                <span class="inline-block animate-pulse">...</span>
              </span>
            </li>
            <li class="flex items-center justify-between bg-(--color-primary-dark)/30 rounded-lg px-3 py-2">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-red-400 text-lg">cancel</span> Losses
              </span>
              <span class="font-semibold text-red-400" data-stat="losses">
                <span class="inline-block animate-pulse">...</span>
              </span>
            </li>
            <li class="flex items-center justify-between bg-(--color-primary-dark)/30 rounded-lg px-3 py-2">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-yellow-400 text-lg">emoji_events</span> Tournaments
              </span>
              <span class="font-semibold text-yellow-400" data-stat="tournaments">
                <span class="inline-block animate-pulse">...</span>
              </span>
            </li>
            ${totalUnreadMessages > 0 ? `
            <li class="flex items-center justify-between bg-red-500/20 rounded-lg px-3 py-2 border border-red-500/50">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-red-400 text-lg">mail</span> Unread Messages
              </span>
              <span class="font-semibold text-red-400">${totalUnreadMessages}</span>
            </li>
            ` : ''}
          </ul>
        </div>

        <!-- Recent Matches -->
        <div class="space-y-3 mt-6" data-section="recent-matches">
          <h3 class="border-b border-(--color-secondary-dark) pb-2 text-sm font-bold text-white uppercase flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-400">history</span>
            Recent Matches
          </h3>
          <p class="text-center text-sm text-white/50 py-4">
            <span class="inline-block animate-pulse">Loading matches...</span>
          </p>
        </div>
      </div>

      <!-- Logout Button -->
      <div class="flex flex-col items-center mt-4 border-t border-(--color-secondary-dark) pt-4">
        <button
          id="logout-btn"
          class="flex items-center gap-2 rounded-lg bg-red-600 px-10 py-2 cursor-pointer text-base font-semibold text-white hover:bg-red-700 transition-colors duration-150 shadow hover:scale-105"
        >
          <span class="material-symbols-outlined">logout</span>
          <span>Log out</span>
        </button>
      </div>
    </aside>
  `;

  // Add event listener for logout button
  const logoutBtn = container.querySelector("#logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      localStorage.clear();
      sessionStorage.clear();
      notificationService.clear();
      let chatManager: ChatComponent | null = getChatManager();
      if (chatManager) {
        chatManager.reset();
      }
      chatManager = null;
      closeModal();
      await logout();
      navigateTo("/login", document.getElementById("content"));
    });
  }

  // Add event listener for avatar click to navigate to profile
  const avatarImg = container.querySelector("#user-avatar");
  if (avatarImg) {
    avatarImg.addEventListener("click", () => {
      closeModal();
      navigateTo(`/friend-profile?username=${finalUsername}`, document.getElementById("content"));
    });
  }

  // Progressively load blockchain stats in the background
  setTimeout(async () => {
    try {
      const blockchainStats = await getPlayerStats(finalUsername, true);
      
      // Update stats in the UI
      const totalGamesEl = container.querySelector('[data-stat="totalGames"]');
      const winsEl = container.querySelectorAll('[data-stat="wins"]');
      const lossesEl = container.querySelector('[data-stat="losses"]');
      const winRateEl = container.querySelector('[data-stat="winRate"]');
      const tournamentsEl = container.querySelector('[data-stat="tournaments"]');
      
      if (totalGamesEl) totalGamesEl.textContent = blockchainStats.totalGames.toString();
      // Update both wins elements (in quick stats and performance)
      winsEl.forEach(el => el.textContent = blockchainStats.wins.toString());
      if (lossesEl) lossesEl.textContent = blockchainStats.losses.toString();
      if (winRateEl) winRateEl.textContent = `${blockchainStats.winRate}%`;
      if (tournamentsEl) tournamentsEl.textContent = blockchainStats.tournamentCount.toString();
      
      // Update recent matches section if there are matches
      const recentMatchesContainer = container.querySelector('[data-section="recent-matches"]');
      if (recentMatchesContainer && blockchainStats.recentMatches.length > 0) {
        const matchesHtml = blockchainStats.recentMatches.map(match => {
          const isWinner = match.winner === finalUsername;
          const opponent = match.player1 === finalUsername ? match.player2 : match.player1;
          const score = match.player1 === finalUsername 
            ? `${match.score1} - ${match.score2}` 
            : `${match.score2} - ${match.score1}`;
          return `
          <li class="flex items-center justify-between bg-(--color-primary-dark)/30 rounded-lg px-3 py-2">
            <div class="flex flex-col">
              <span class="font-semibold ${isWinner ? 'text-green-400' : 'text-red-400'} flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">${isWinner ? 'check_circle' : 'cancel'}</span>
                ${isWinner ? 'Victory' : 'Defeat'}
              </span>
              <span class="text-white/60">vs ${opponent}</span>
            </div>
            <span class="font-bold text-white">${score}</span>
          </li>
          `;
        }).join('');
        
        recentMatchesContainer.innerHTML = `
          <h3 class="border-b border-(--color-secondary-dark) pb-2 text-sm font-bold text-white uppercase flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-400">history</span>
            Recent Matches
          </h3>
          <ul class="space-y-2 text-xs">
            ${matchesHtml}
          </ul>
        `;
      }
    } catch (error) {
      console.error("Error loading blockchain stats:", error);
    }
  }, 0);

  return container;
}
