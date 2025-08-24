import { navigateTo } from "../router/router.js";
import { getPendingRequests } from "../services/friendship.service.js";
import { getUsers } from "../services/userService.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getUserAvatar } from "../utils/userUtils.js";
import { getFriendsContent } from "../views/friends.js";
import { getNotificationsContent } from "../views/notifications.js";
import { openModal } from "./modalManager.js";

export async function renderNavbar(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/navbar.html");

  const searchInput = document.getElementById("user-search") as HTMLInputElement;
  const searchResults = document.getElementById("search-results");

  searchInput?.addEventListener("input", async () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      searchResults?.classList.add("hidden");
      searchResults!.innerHTML = "";
      return;
    }

    try {
      // Fetch all users using the getUsers method
      const users = await getUsers();

      // Filter users based on the search query
      const filteredUsers = users.filter((user) =>
        user.username.toLowerCase().includes(query)
      );

      // Populate the search results
      searchResults!.innerHTML = await Promise.all(
        filteredUsers.map(async (user) => {
          const avatarUrl = await getUserAvatar(user.username);
          return `
          <li class="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 rounded-lg" data-username="${user.username}" style="height: 2.5rem;">
            <img src="${avatarUrl}" alt="${user.username}'s avatar" class="w-8 h-8 rounded-full border-2 border-gray-300 object-cover mr-3" onerror="this.onerror=null;this.src='/assets/avatars/panda.png';" />
            <span class="text-sm">${user.username}</span>
          </li>
        `;
        
        })
      ).then((results) => results.join(""));

      searchResults?.classList.remove("hidden");
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !searchInput.contains(event.target as Node) &&
      !searchResults?.contains(event.target as Node)
    ) {
      searchResults?.classList.add("hidden");
    }
  });

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
    // JUST PLACEHOLDERS:
    // const notificationContent = document.createElement("div");
    // notificationContent.className = "p-4";
    // notificationContent.textContent = "No notifications yet.";
    // const notificationContent = await getNotificationsContent();
    const requestsRaw = await getPendingRequests() as any[];
    const requests = await Promise.all(
      requestsRaw.map(async req => ({
      requesterUsername: req.requesterUsername,
      avatar: await getUserAvatar(req.requesterUsername)
      }))
    );
    openModal(await getNotificationsContent(requests), notificationIcon);
  });

  profileIcon?.addEventListener("click", async (e) => {
    e.preventDefault();
    // JUST PLACEHOLDERS:
    const profileContent = document.createElement("div");
    profileContent.className = "p-4";
    profileContent.textContent = "User Profile";
    openModal(profileContent, profileIcon);
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
