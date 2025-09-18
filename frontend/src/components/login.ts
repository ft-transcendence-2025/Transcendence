import { loadHtml } from "../utils/htmlLoader.js";
import { login, loginWith2FA } from "../services/authService.js";
import { navigateTo } from "../router/router.js";
import { renderNavbar } from "./navbar.js";
import { renderHome } from "../views/home.js";
import { reloadChatManager } from "../app.js";

// This function will find the modal on the page and open it.
export async function openLoginModal(container: HTMLElement | null = null) {
  // If container is provided, render home page as backdrop first (without animations)
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

  // Handle simple login without 2FA
  const handleSimpleLogin = async (response: any) => {
    localStorage.setItem("authToken", response.accessToken);
    closeModal();

    const navbarContainer = document.getElementById("navbar");
    if (navbarContainer) {
      await renderNavbar(navbarContainer);
    }

    const container = document.getElementById("content");
    reloadChatManager();
    navigateTo("/dashboard", container);
  };

  // Show the 2FA modal
  function show2FAModal(loginData: any) {
    const twoFAModal = document.getElementById("login-2fa-modal");
    if (twoFAModal) {
      twoFAModal.classList.remove("hidden");
      // Clean up any existing event listeners before setting up new ones
      cleanup2FAEventListeners();
      setup2FAEventListeners(loginData);
    }
  }

  // Close the 2FA modal
  function close2FAModal() {
    const modal = document.getElementById("login-2fa-modal");
    const tokenInput = document.getElementById(
      "login-2fa-token",
    ) as HTMLInputElement;

    if (modal && tokenInput) {
      modal.classList.add("hidden");
      tokenInput.value = "";

      // Clean up event listeners
      cleanup2FAEventListeners();
    }
  }

  // Handle login that requires 2FA
  async function handleLoginWith2FA(loginData: any) {
    const tokenInput = document.getElementById(
      "login-2fa-token",
    ) as HTMLInputElement;

    if (!tokenInput) {
      console.error("2FA token input not found");
      return;
    }

    try {
      const token = tokenInput.value.trim();
      if (!/^\d{6}$/.test(token)) {
        alert("Please enter a valid 6-digit code.");
        return;
      }

      const response = await loginWith2FA(loginData, token);

      // Handle successful 2FA login
      localStorage.setItem("authToken", response.accessToken);
      close2FAModal();
      closeModal();

      const navbarContainer = document.getElementById("navbar");
      if (navbarContainer) {
        await renderNavbar(navbarContainer);
      }

      const container = document.getElementById("content");
      reloadChatManager();
      navigateTo("/dashboard", container);
    } catch (error: any) {
      console.error("Error handling 2FA login:", error);
      alert(`2FA Login failed: ${error.message}`);
    }
  }

  // Setup 2FA event listeners
  function setup2FAEventListeners(loginData: any) {
    // Cancel button
    const cancelBtn = document.getElementById("login-2fa-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", close2FAModal);
    }

    // Login button
    const loginBtn = document.getElementById("login-2fa-btn");
    if (loginBtn) {
      loginBtn.addEventListener("click", () => handleLoginWith2FA(loginData));
    }

    // Submit 2FA on Enter key
    const tokenInput = document.getElementById(
      "login-2fa-token",
    ) as HTMLInputElement;
    if (tokenInput) {
      tokenInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleLoginWith2FA(loginData);
        }
      });
    }

    // Close modal when clicking outside
    const modal = document.getElementById("login-2fa-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          close2FAModal();
        }
      });
    }
  }

  // Cleanup 2FA event listeners to avoid duplicate alerts
  function cleanup2FAEventListeners() {
    // Cancel button
    const cancelBtn = document.getElementById("login-2fa-cancel-btn");
    if (cancelBtn) {
      cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    }

    // Login button
    const loginBtn = document.getElementById("login-2fa-btn");
    if (loginBtn) {
      loginBtn.replaceWith(loginBtn.cloneNode(true));
    }

    // Token input on Enter key
    const tokenInput = document.getElementById(
      "login-2fa-token",
    ) as HTMLInputElement;
    if (tokenInput) {
      tokenInput.replaceWith(tokenInput.cloneNode(true));
    }

    // Modal (for outside click events)
    const modal = document.getElementById("login-2fa-modal");
    if (modal) {
      modal.replaceWith(modal.cloneNode(true));
    }
  }

  // Add event listener for the form submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    hideError(); // Clear any previous errors

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await login(data);
      // Handle successful login with no 2FA
      handleSimpleLogin(response);
    } catch (error: any) {
      if (error.message === "2FA token required.") {
        // Handle login with 2FA
        show2FAModal(data);
      } else {
        console.error("Login failed:", error);
        showError(
          error instanceof Error
            ? error.message
            : "Login failed. Please check your credentials.",
        );
      }
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
