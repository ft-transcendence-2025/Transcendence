import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUsername } from "../utils/jwtUtils.js";

export async function renderPong(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/pong.html");

  // Update the username from the logged-in user's token
  updateUserUsername();
}

/**
 * Update the user username display from the JWT token
 */
function updateUserUsername() {
  const username = getCurrentUsername();
  const userUsernameElement = document.getElementById("user-username");

  if (userUsernameElement && username) {
    userUsernameElement.textContent = username;
  } else if (userUsernameElement) {
    // Fallback to "Guest" if no username found
    userUsernameElement.textContent = "Guest";
  }
}
