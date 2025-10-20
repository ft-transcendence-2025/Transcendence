// Utility to refresh current page and navbar without full page reload
import { renderNavbar } from "../components/navbar.js";
import { routes } from "../router/routes.js";

/**
 * Refreshes the navbar and current page content
 * This maintains SPA behavior while updating data after profile changes
 */
export async function refreshCurrentPage(): Promise<void> {
  try {
    // Refresh navbar (will update avatar, username, etc.)
    const navbarElement = document.getElementById("navbar");
    if (navbarElement) {
      await renderNavbar(navbarElement);
    }

    // Refresh current page content by directly calling the current route's action
    const contentElement = document.getElementById("content");
    if (contentElement) {
      const currentPath = location.pathname;
      const currentRoute = routes.find((route) => route.path === currentPath);
      
      if (currentRoute) {
        await currentRoute.action(contentElement);
      }
    }
  } catch (error) {
    console.error("Error refreshing page:", error);
  }
}

/**
 * Refreshes only the navbar
 * Useful when only navbar needs to update (e.g., avatar change)
 */
export async function refreshNavbar(): Promise<void> {
  try {
    const navbarElement = document.getElementById("navbar");
    if (navbarElement) {
      await renderNavbar(navbarElement);
    }
  } catch (error) {
    console.error("Error refreshing navbar:", error);
  }
}
