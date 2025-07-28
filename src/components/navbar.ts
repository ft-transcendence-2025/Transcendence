import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";

export async function renderNavbar(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/navbar.html");

  const loginLink = document.getElementById("login-link");
  const dashboardLink = document.getElementById("dashboard-link");
  const registerLink = document.getElementById("register-link");
  const logoutLink = document.getElementById("logout-link");
  const userMenu = document.getElementById("user-menu");

  const token = localStorage.getItem("authToken");

  // Show or hide links based on authentication status
  if (token) {
    loginLink?.classList.add("hidden");
    registerLink?.classList.add("hidden");
    logoutLink?.classList.remove("hidden");
    dashboardLink?.classList.remove("hidden");
    userMenu?.classList.remove("hidden");
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
    "fixed top-16 left-0 w-1/5 h-full bg-white shadow-lg z-50";
  // Load userMenu.html content
  try {
    const userMenuHtml = await loadHtml("/html/userMenu.html");
    sidebar.innerHTML = userMenuHtml;
  } catch (error) {
    console.error("Failed to load user menu:", error);
  }
  // Add to document
  document.body.appendChild(sidebar);
}
