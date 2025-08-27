import { navigateTo } from "../router/router.js";
import { getPendingRequests } from "../services/friendship.service.js";
import { getUsers } from "../services/userService.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getUserAvatar } from "../utils/userUtils.js";
import { getFriendsContent } from "../views/friends.js";
import { getNotificationsContent } from "../views/notifications.js";
import { getProfileModalContent } from "../views/modalProfile.js";
import { openModal } from "./modalManager.js";
import renderSearchBar from "./searchBar.js";

export async function renderNavbar(container: HTMLElement | null) {
  if (!container) return;
  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/navbar.html");
  await renderSearchBar();
  const friendsIcon = document.getElementById("friends-list");
  const notificationIcon = document.getElementById("notifications");
  const profileIcon = document.getElementById("profile");
  const loginLink = document.getElementById("login-link");
  const dashboardLink = document.getElementById("dashboard-link");
  const registerLink = document.getElementById("register-link");
  const logoutLink = document.getElementById("logout-link");
  const userMenu = document.getElementById("user-menu");

  friendsIcon?.addEventListener("click", async (e) => {
    e.preventDefault();
    openModal(await getFriendsContent(), friendsIcon);
  });

  notificationIcon?.addEventListener("click", async (e) => {
    e.preventDefault();
    const requestsRaw = await getPendingRequests() as any[];
    openModal(await getNotificationsContent(), notificationIcon);
  });

  profileIcon?.addEventListener("click", async (e) => {
    e.preventDefault();
    openModal(await getProfileModalContent(), profileIcon);
  });

  const token = localStorage.getItem("authToken");

  // Show or hide links based on authentication status
  if (token) {
    loginLink?.classList.add("hidden");
    registerLink?.classList.add("hidden");
    logoutLink?.classList.remove("hidden");
    dashboardLink?.classList.remove("hidden");
    userMenu?.classList.remove("hidden");

    // Set user avatar
    const userAvatar = document.getElementById(
      "user-menu-avatar",
    ) as HTMLImageElement;
    if (userAvatar) {
      try {
        const avatarUrl = await getUserAvatar();
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
    registerLink?.classList.remove("hidden");
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
