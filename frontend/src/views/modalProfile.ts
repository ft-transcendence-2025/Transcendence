// src/views/modalProfile.ts
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
    avatarUrl = getUserAvatar(finalUsername);
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
      <p id="user-location" class="text-sm text-(--color-secondary-light)">
        ${profile?.location || 'Location not set'}
      </p>
      <button
        id="edit-profile-btn"
        class="mt-3 rounded-lg bg-(--color-secondary) px-4 py-2 text-sm font-semibold text-(--color-text-primary) hover:bg-(--color-secondary-dark)"
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

    <!-- Activity -->
    <div>
      <h3
        class="mb-2 border-b border-(--color-secondary-dark) pb-1 text-lg font-bold text-white"
      >
        Activity
      </h3>
      <div class="flex items-center space-x-3">
        <img
          src="/assets/games/pieceofcake.jpg"
          alt="Piece of Cake"
          class="h-14 w-14 rounded object-cover"
        />
        <span class="text-sm text-white">Most played</span>
      </div>
    </div>
    </aside>
  `;

  // Add event listener for edit profile button
  const editBtn = container.querySelector("#edit-profile-btn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      // Navigate to profile edit page or open edit modal
      // You can implement this based on your routing system
      window.location.href = `/profile?username=${finalUsername}&edit=true`;
    });
  }

  return container;
}
