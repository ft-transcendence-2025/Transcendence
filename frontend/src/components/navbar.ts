import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";

export async function renderNavbar(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/navbar.html");

  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutLink = document.getElementById("logout-link");

  const token = localStorage.getItem("authToken");

  // Show or hide links based on authentication status
  if (token) {
    loginLink?.classList.add("hidden");
    registerLink?.classList.add("hidden");
    logoutLink?.classList.remove("hidden");
  } else {
    loginLink?.classList.remove("hidden");
    registerLink?.classList.remove("hidden");
    logoutLink?.classList.add("hidden");
  }

  // Add event listeners for logout
  logoutLink?.addEventListener("click", async (event) => {
    event.preventDefault();
    localStorage.removeItem("authToken");
    renderNavbar(container); // Re-render navbar to update links
    navigateTo("/", document.getElementById("content")); // Navigate to home
  });
}
