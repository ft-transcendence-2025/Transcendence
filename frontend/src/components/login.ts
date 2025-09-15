import { loadHtml } from "../utils/htmlLoader.js";
import { login } from "../services/authService.js";
import { navigateTo } from "../router/router.js";
import { renderNavbar } from "./navbar.js";
import { renderHome } from "../views/home.js";
import { reloadChatManager } from "../app.js";

// This function will find the modal on the page and open it.
export async function openLoginModal(container: HTMLElement | null = null) {
  // If container is provided, render home page as backdrop first (without animations)
  if (localStorage.getItem("authToken")) {
    // If already logged in, redirect to dashboard
    const dashboardContainer = document.getElementById("content");
    navigateTo("/dashboard", dashboardContainer);
    return;
  }

  if (container) {
    await renderHome(container, true);
  }

  // Inject the modal HTML if it doesn't exist
  if (!document.getElementById("login-modal")) {
    const modalHtml = await loadHtml("/html/login.html");
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }

  const modal = document.getElementById("login-modal")!;
  const form = modal.querySelector("form")!;
  const closeButton = modal.querySelector(
    ".close-button",
  )! as HTMLButtonElement;

  // Helper function to show error messages
  const showError = (message: string) => {
    const errorContainer = modal.querySelector(".error-message") as HTMLElement;
    const errorText = modal.querySelector(".error-text") as HTMLElement;
    if (errorContainer && errorText) {
      errorText.textContent = message;
      errorContainer.classList.remove("hidden");
    }
  };

  // Helper function to hide error messages
  const hideError = () => {
    const errorContainer = modal.querySelector(".error-message") as HTMLElement;
    if (errorContainer) {
      errorContainer.classList.add("hidden");
    }
  };

  // Add event listener for the form submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    hideError(); // Clear any previous errors

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await login(data);
      localStorage.setItem("authToken", response.accessToken);
      closeModal();

      const navbarContainer = document.getElementById("navbar");
      if (navbarContainer) {
        await reloadChatManager();
        await renderNavbar(navbarContainer);
      }

      const container = document.getElementById("content");
      navigateTo("/dashboard", container);
    } catch (error) {
      console.error("Login failed:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.",
      );
    }
  };

  // Add event listener to close the modal
  closeButton.onclick = () => closeModal();

  // Show the modal
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("login-modal");
  if (modal) {
    modal.style.display = "none";

    // Clear any error messages when closing (scoped to modal)
    const errorContainer = modal.querySelector(".error-message") as HTMLElement;
    if (errorContainer) {
      errorContainer.classList.add("hidden");
    }

    // Reset the form
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
    }
  }

  const container = document.getElementById("content");
  navigateTo("/", container);
}
