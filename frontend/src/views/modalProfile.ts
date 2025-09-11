// src/views/modalProfile.ts
import { closeModal } from "../components/modalManager.js";
import { navigateTo } from "../router/router.js";
import { getProfileByUsername, getUserAvatar } from "../services/profileService.js";

export async function getProfileModalContent(username?: string): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.className = "w-full h-full flex text-white rounded-[25px]";

  // If no username provided, try to get current user's profile
  if (!username) {
    // You might need to implement getCurrentUsername() or get it from localStorage/token
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        // Decode token to get username or implement a getCurrentUser service
        const payload = JSON.parse(atob(token.split('.')[1]));
        username = payload.username || payload.sub || "unknown";
      } catch (error) {
        console.error("Could not decode token for username:", error);
        username = "unknown";
      }
    } else {
      username = "unknown";
    }
  }

  // Ensure username is defined
  const finalUsername = username || "unknown";
  let profile: any = null;
  let avatarUrl = "/assets/avatars/bear.png";

  try {
    profile = await getProfileByUsername(finalUsername);
    avatarUrl = await getUserAvatar(finalUsername);
  } catch (error) {
    console.error("Error loading profile for modal:", error);
  }

  // Calculate member duration
  let memberDuration = "Unknown";
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

  container.innerHTML = `
    <aside class="flex w-full flex-col gap-8 p-6">
    <!-- Avatar and User Info -->
    <div class="flex flex-col items-center text-center">
      <img
        id="user-avatar"
        src="${avatarUrl}"
        alt="Avatar"
        class="mb-4 h-44 w-44 rounded-full border-4 border-(--color-secondary) object-cover"
        onerror="this.onerror=null;this.src='/assets/avatars/panda.png';"
      />
      <h2 id="display-username" class="text-xl font-bold text-white">${profile?.userUsername || finalUsername}</h2>
      <p id="user-nickname" class="text-sm text-(--color-secondary-light)">
        ${profile?.nickName || 'Nickname not set'}
      </p>
      <button
        id="edit-profile-btn"
        class="mt-3 rounded-lg cursor-pointer bg-(--color-secondary) px-4 py-2 text-sm font-semibold text-(--color-text-primary) hover:bg-(--color-secondary-dark)"
      >
        Edit my profile
      </button>
    </div>

    <!-- Stats -->
    <div class="space-y-4">
      <h3
        class="border-b border-(--color-secondary-dark) pb-1 text-lg font-bold text-white"
      >
        Statistics
      </h3>
      <ul class="space-y-2 text-sm text-white">
        <li class="flex items-center justify-between">
          <span>Games played</span>
          <span class="font-semibold">${profile?.gamesPlayed || 0}</span>
        </li>
        <li class="flex items-center justify-between">
          <span>Member for</span>
          <span id="display-createdAt" class="font-semibold">${memberDuration}</span>
        </li>
        <li class="flex items-center justify-between">
          <span>Liked games</span>
          <span class="font-semibold">${profile?.likedGames || 0}</span>
        </li>
        <li class="flex items-center justify-between">
          <span>Playstreak</span>
          <span class="font-semibold">${profile?.playstreak || 0} day${(profile?.playstreak || 0) !== 1 ? 's' : ''}</span>
        </li>
      </ul>
    </div>

    <!-- Logout Button -->
    <div class="flex flex-col items-center mt-4">
      <button
        id="logout-btn"
        class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark cursor-pointer"
      >
        Log out
      </button>
    </div>
    </aside>
  `;

  // Add event listener for logout button
  const logoutBtn = container.querySelector("#logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("authToken");
      closeModal();
      navigateTo("/login", document.getElementById("content"));
    });
  }

  // Add event listener for edit profile button
  const editBtn = container.querySelector("#edit-profile-btn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      closeModal();
      navigateTo(`/profile?username=${finalUsername}&edit=true`, document.getElementById("content"));
    });
  }

  return container;
}
