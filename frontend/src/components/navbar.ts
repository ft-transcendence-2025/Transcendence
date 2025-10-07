import { navigateTo } from "../router/router.js";
import { getPendingRequests } from "../services/friendship.service.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getFriendsContent } from "../views/friends.js";
import { getNotificationsContent } from "../views/notifications.js";
import { getProfileModalContent } from "../views/modalProfile.js";
import { closeModal, currentTrigger, openModal } from "./modalManager.js";
import renderSearchBar from "./searchBar.js";
import { getCurrentUserAvatar } from "../utils/userUtils.js";
import { chatManager } from "../app.js";
import { notificationService } from "../services/notifications.service.js";

export async function renderNavbar(container: HTMLElement | null) {
  if (!container) return;
  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/navbar.html");
  await renderSearchBar();

  const friendsIcon = document.getElementById("friends-list");
  const notificationIcon = document.getElementById("notifications");
  const profileIcon = document.getElementById("profile-icon") as HTMLImageElement;

  const friendsBadge = document.createElement("span");
  friendsBadge.id = "friends-badge";
  friendsBadge.className = "absolute top-0 right-0 bg-red-500 w-3 h-3 rounded-full px-1 hidden";
  friendsIcon?.appendChild(friendsBadge);

  const notificationsBadge = document.createElement("span");
  notificationsBadge.id = "notifications-badge";
  notificationsBadge.className = "absolute top-0 right-0 bg-red-500 w-3 h-3 rounded-full px-1 hidden";
  notificationIcon?.appendChild(notificationsBadge);

  friendsIcon?.addEventListener("click", async (e) => {
    e.preventDefault();

    const modal = document.getElementById("app-modal");

    // If the modal is already open and triggered by the same button, close it
    if (modal && currentTrigger === friendsIcon) {
      closeModal();
      return;
    }

    // If the modal is being opened, fetch and render the content
    const friendsContent = await getFriendsContent();
    openModal(friendsContent, friendsIcon);
  });

  notificationIcon?.addEventListener("click", async (e) => {
    e.preventDefault();
    const modal = document.getElementById("app-modal");
    // If the modal is already open and triggered by the same button, close it
    if (modal && currentTrigger === notificationIcon) {
      closeModal();
      return;
    }

    // If the modal is being opened, fetch and render the content
    openModal(await getNotificationsContent(), notificationIcon);
  });

  if (profileIcon) {
    try {
      const avatarUrl = await getCurrentUserAvatar();
      profileIcon.src = avatarUrl;

      // Default to a placeholder avatar on error
      profileIcon.onerror = () => {
        profileIcon.src = "/assets/avatars/panda.png";
      };
    } catch (error) {
      console.warn("Could not load profile avatar:", error);
      profileIcon.src = "/assets/avatars/panda.png";
    }

    profileIcon.addEventListener("click", async (e) => {
      e.preventDefault();
      openModal(await getProfileModalContent(), profileIcon);
    });
  }
  const loginLink = document.getElementById("login-link");
  const dashboardLink = document.getElementById("dashboard-link");
  const logoutLink = document.getElementById("logout-link");
  const userMenu = document.getElementById("user-menu");


  const token = localStorage.getItem("authToken");

  // Show or hide links based on authentication status
  if (token) {
    loginLink?.classList.add("hidden");
    logoutLink?.classList.remove("hidden");
    dashboardLink?.classList.remove("hidden");
    userMenu?.classList.remove("hidden");

    // Set user avatar
    const userAvatar = document.getElementById(
      "user-menu-avatar",
    ) as HTMLImageElement;
    if (userAvatar) {
      try {
        const avatarUrl = await getCurrentUserAvatar();
        userAvatar.src = avatarUrl;
        // Default to panda on error
        userAvatar.onerror = () => {
          userAvatar.src = "/assets/avatars/panda.png";
        };
      } catch (error) {
        console.warn("Could not load user avatar:", error);
        userAvatar.src = "/assets/avatars/panda.png";
      }
    }
  } else {
    loginLink?.classList.remove("hidden");
    logoutLink?.classList.add("hidden");
    dashboardLink?.classList.add("hidden");
    userMenu?.classList.add("hidden");
  }

  // Add event listeners for logout
  logoutLink?.addEventListener("click", async (event) => {
    event.preventDefault();
    localStorage.removeItem("authToken");

    // Close user menu sidebar if it's open
    const sidebar = document.getElementById("user-menu-sidebar");
    if (sidebar) {
      sidebar.remove();
    }

    renderNavbar(container); // Re-render navbar to update links
    navigateTo("/", document.getElementById("content")); // Navigate to home
  });

  // Add event listener for user menu circle
  userMenu?.addEventListener("click", async (event) => {
    event.preventDefault();
    await toggleUserMenuSidebar();
  });

  // Subscribe to notification state changes
  notificationService.subscribe(updateNavbarBadgesFromState);

  // Initial badge update
  updateNavbarBadgesFromState();
}

// Function to toggle user menu sidebar
async function toggleUserMenuSidebar() {
  let sidebar = document.getElementById("user-menu-sidebar");

  if (sidebar) {
    // If sidebar exists, close it
    sidebar.remove();
    return;
  }

  // Create sidebar
  sidebar = document.createElement("div");
  sidebar.id = "user-menu-sidebar";
  sidebar.className =
    "absolute top-full left-0 w-1/5 min-h-screen bg-white shadow-lg z-50";

  // Load userMenu.html content
  try {
    const userMenuHtml = await loadHtml("/html/userMenu.html");
    sidebar.innerHTML = userMenuHtml;
  } catch (error) {
    console.error("Failed to load user menu:", error);
  }

  // Attach sidebar to the navbar
  const navbar =
    document.querySelector("nav") || document.getElementById("navbar");
  if (navbar) {
    navbar.style.position = "relative";
    navbar.appendChild(sidebar);
  } else {
    console.error("Navbar element not found");
  }

}

function updateNavbarBadgesFromState() {
  const friendsBadge = document.getElementById("friends-badge");
  const notificationsBadge = document.getElementById("notifications-badge");

  const state = notificationService.getState();

  // Update the notifications badge (sum of friend requests and game invites)
  const totalNotifications = state.friendRequests.length + state.gameInvites.size;
  if (totalNotifications > 0) {
    notificationsBadge?.classList.remove("hidden");
  } else {
    notificationsBadge?.classList.add("hidden");
  }

  // Update the notifications badge (e.g., for messages or game invites)
  const totalMessageNotifications =
    Array.from(state.messageNotifications.values()).reduce((sum, count) => sum + count, 0);

  if (totalMessageNotifications > 0) {
    friendsBadge?.classList.remove("hidden");
  } else {
    friendsBadge?.classList.add("hidden");
  }
}
