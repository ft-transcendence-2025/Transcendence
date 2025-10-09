import { routes } from "./routes.js";
import { canAccessRoute } from "../utils/authGuard.js";
import { isAuthenticated } from "../utils/userUtils.js";

export async function router(container: HTMLElement | null) {
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);

  // Check if user can access the current route
  if (!canAccessRoute(currentPath, searchParams)) {
    // Redirect non-logged users to home page
    history.replaceState(null, "", "/");
    const homeRoute = routes.find((r) => r.path === "/");
    if (homeRoute) {
      await homeRoute.action(container);
      updateNavbar();
      return;
    }
  }

  const potentialMatch = routes.map((route) => {
    return {
      route: route,
      isMatch: currentPath === route.path,
    };
  });
  let match = potentialMatch.find((potentialMatch) => potentialMatch.isMatch);

  if (!match) {
    // No route found, show 404
    match = {
      route: routes.find((r) => r.path === "/404")!,
      isMatch: true,
    };
  }

  updateNavbar();
  await match.route.action(container);
}

function updateNavbar() {
  // Show navbar only for authenticated users, except on home page
  const navbar = document.getElementById("navbar");
  if (navbar) {
    const userAuthenticated = isAuthenticated();
    const isHomePage = location.pathname === "/";

    if (userAuthenticated && !isHomePage) {
      // User is logged in and not on home page - show navbar
      navbar.classList.remove("hidden");
    } else {
      // User not logged in or on home page - hide navbar
      navbar.classList.add("hidden");
    }
  }
}

export function navigateTo(path: string, container: HTMLElement | null) {
  history.pushState(null, "", path);
  router(container); // re-run the router to update the view
}
