// Simple authentication guard
import { isAuthenticated } from "./userUtils.js";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/404"];

export function canAccessRoute(
  path: string,
  searchParams?: URLSearchParams,
): boolean {
  // Allow public routes
  if (publicRoutes.includes(path)) {
    return true;
  }

  // Allow tournament with type=local for non-logged users
  if (path === "/tournament" && searchParams?.get("type") === "local") {
    return true;
  }

  // All other routes require authentication
  return isAuthenticated();
}
