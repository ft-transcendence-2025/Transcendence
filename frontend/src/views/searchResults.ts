import { navigateTo } from "../router/router.js";
import { getUsers } from "../services/userService.js";
import { getUserAvatar } from "../services/profileService.js";
import { getFriendshipStatus, sendFriendRequest, FriendshipStatus } from "../services/friendship.service.js";
import { getCurrentUsername } from "../utils/userUtils.js";
import { toast } from "../utils/toast.js";

export async function renderSearchResults(container: HTMLElement | null) {
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const query = params.get("query") || "";

  container.innerHTML = `
    <div class="min-h-screen bg-(--color-background) py-8 px-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <button id="back-btn" class="flex items-center gap-2 text-black hover:text-(--color-primary) mb-4 transition-colors font-medium">
            <span class="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </button>
          <h1 class="text-3xl font-bold text-black mb-2">Search Results</h1>
          <p class="text-black/70 text-lg">Results for "<span class="text-(--color-secondary) font-semibold">${query}</span>"</p>
        </div>

        <!-- Loading State -->
        <div id="loading-state" class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin"></div>
            <p class="text-black/70">Searching users...</p>
          </div>
        </div>

        <!-- Results Container -->
        <div id="results-container" class="hidden">
          <div id="results-count" class="mb-6 text-black font-semibold text-lg"></div>
          <ul id="users-list" class="space-y-3"></ul>
        </div>

        <!-- No Results State -->
        <div id="no-results" class="hidden text-center py-12">
          <span class="material-symbols-outlined text-6xl text-white/50 mb-4">search_off</span>
          <p class="text-xl text-white font-semibold mb-2">No users found</p>
          <p class="text-white/70">Try a different search term</p>
        </div>
      </div>
    </div>
  `;

  // Event Listeners
  const backBtn = document.getElementById("back-btn");
  backBtn?.addEventListener("click", () => {
    window.history.back();
  });

  // Fetch and display results
  await loadAndDisplayResults(query);
}

async function loadAndDisplayResults(query: string) {
  const loadingState = document.getElementById("loading-state");
  const resultsContainer = document.getElementById("results-container");
  const noResults = document.getElementById("no-results");
  const usersList = document.getElementById("users-list");
  const resultsCount = document.getElementById("results-count");

  try {
    const allUsers = await getUsers();
    const filteredUsers = allUsers.filter((user: any) =>
      user.username.toLowerCase().includes(query.toLowerCase())
    );

    loadingState?.classList.add("hidden");

    if (filteredUsers.length === 0) {
      noResults?.classList.remove("hidden");
      return;
    }

    resultsContainer?.classList.remove("hidden");
    if (resultsCount) {
      resultsCount.textContent = `Found ${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`;
    }

    // Render user cards
    if (usersList) {
      usersList.innerHTML = "";
      for (const user of filteredUsers) {
        const userCard = await createUserCard(user);
        usersList.appendChild(userCard);
      }
    }
  } catch (error) {
    console.error("Error loading search results:", error);
    loadingState?.classList.add("hidden");
    if (noResults) {
      noResults.classList.remove("hidden");
      noResults.innerHTML = `
        <span class="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
        <p class="text-xl text-white font-semibold mb-2">Error loading results</p>
        <p class="text-white/70">Please try again later</p>
      `;
    }
  }
}

async function createUserCard(user: any): Promise<HTMLLIElement> {
  const li = document.createElement("li");
  li.className = "bg-(--color-primary-darker) rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 border border-(--color-primary-dark)";

  const currentUser = getCurrentUsername();
  const isCurrentUser = user.username === currentUser;

  // Fetch avatar and friendship status
  let avatarUrl = "/assets/avatars/panda.png";
  let friendshipStatus: any = null;

  try {
    [avatarUrl, friendshipStatus] = await Promise.all([
      getUserAvatar(user.username),
      isCurrentUser ? null : getFriendshipStatus(user.username)
    ]);
  } catch (error) {
    console.error(`Error fetching data for ${user.username}:`, error);
  }

  // Determine button state
  let actionButton = "";
  if (!isCurrentUser) {
    if (friendshipStatus?.status === FriendshipStatus.ACCEPTED) {
      actionButton = `
        <button disabled class="px-4 py-2 rounded-lg bg-gray-500 text-white cursor-not-allowed flex items-center gap-2">
          <span class="material-symbols-outlined">check</span>
          <span>Friends</span>
        </button>
      `;
    } else if (friendshipStatus?.status === FriendshipStatus.PENDING) {
      actionButton = `
        <button disabled class="px-4 py-2 rounded-lg bg-gray-500 text-white cursor-not-allowed flex items-center gap-2">
          <span class="material-symbols-outlined">schedule</span>
          <span>Pending</span>
        </button>
      `;
    } else if (friendshipStatus?.status === FriendshipStatus.BLOCKED) {
      actionButton = `
        <button disabled class="px-4 py-2 rounded-lg bg-red-500 text-white cursor-not-allowed flex items-center gap-2">
          <span class="material-symbols-outlined">block</span>
          <span>Blocked</span>
        </button>
      `;
    } else {
      actionButton = `
        <button data-action="add-friend" data-username="${user.username}" 
        class="px-4 py-2 rounded-lg bg-(--color-primary) hover:bg-(--color-primary-dark) text-white font-semibold transition-colors flex items-center gap-2">
          <span class="material-symbols-outlined">person_add</span>
          <span>Add Friend</span>
        </button>
      `;
    }
  }

  li.innerHTML = `
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4 flex-1 cursor-pointer hover:opacity-80 transition-opacity" data-username="${user.username}">
        <img src="${avatarUrl}" alt="${user.username}'s avatar"
        class="w-16 h-16 rounded-full border-3 border-(--color-secondary) object-cover"
        onerror="this.onerror=null;this.src='/assets/avatars/panda.png';" />
        <div class="flex-1">
          <h3 class="text-lg font-bold text-white">${user.username}</h3>
          <p class="text-sm text-(--color-secondary-light)">Click to view profile</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        ${actionButton}
        <button data-action="view-profile" data-username="${user.username}" 
        class="px-4 py-2 rounded-lg bg-(--color-secondary) hover:bg-(--color-secondary-dark) text-white font-semibold transition-colors flex items-center gap-2">
          <span class="material-symbols-outlined">person</span>
          <span>Profile</span>
        </button>
      </div>
    </div>
  `;

  // Add event listeners
  const profileClickArea = li.querySelector(`[data-username="${user.username}"]`);
  profileClickArea?.addEventListener("click", () => {
    navigateTo(`/friend-profile?username=${user.username}`, document.getElementById("content"));
  });

  const viewProfileBtn = li.querySelector(`[data-action="view-profile"]`);
  viewProfileBtn?.addEventListener("click", () => {
    navigateTo(`/friend-profile?username=${user.username}`, document.getElementById("content"));
  });

  const addFriendBtn = li.querySelector(`[data-action="add-friend"]`);
  if (addFriendBtn) {
    addFriendBtn.addEventListener("click", async () => {
      const username = addFriendBtn.getAttribute("data-username");
      if (username) {
        try {
          await sendFriendRequest(username);
          toast.success(`Friend request sent to ${username}!`);
          
          // Update button to pending state
          addFriendBtn.setAttribute("disabled", "true");
          addFriendBtn.classList.remove("bg-(--color-primary)", "hover:bg-(--color-primary-dark)");
          addFriendBtn.classList.add("bg-gray-500", "cursor-not-allowed");
          addFriendBtn.innerHTML = `
            <span class="material-symbols-outlined">schedule</span>
            <span>Pending</span>
          `;
        } catch (error: any) {
          toast.error(error.message || "Failed to send friend request");
        }
      }
    });
  }

  return li;
}
