import { loadHtml } from "../utils/htmlLoader.js";
import { register } from "../services/authService.js";
import { navigateTo } from "../router/router.js";

export async function renderRegister(container: HTMLElement | null) {
  if (!container) return;

  container.innerHTML = await loadHtml("/html/registerForm.html");

  const form = document.getElementById("register-form") as HTMLFormElement;
  if (!form) {
    console.error("Register form not found in the container.");
    return;
  }

  // Helper function to show error messages
  const showError = (message: string) => {
    const errorContainer = document.getElementById("error-message");
    const errorText = document.getElementById("error-text");
    if (errorContainer && errorText) {
      errorText.textContent = message;
      errorContainer.classList.remove("hidden");
    }
  };

  // Helper function to hide error messages
  const hideError = () => {
    const errorContainer = document.getElementById("error-message");
    if (errorContainer) {
      errorContainer.classList.add("hidden");
    }
  };

  // Password visibility toggle functionality
  const setupPasswordToggle = (inputId: string, toggleId: string) => {
    const passwordInput = document.getElementById(inputId) as HTMLInputElement;
    const toggleButton = document.getElementById(toggleId) as HTMLButtonElement;

    if (passwordInput && toggleButton) {
      // Show password while mouse is pressed down
      toggleButton.addEventListener("mousedown", () => {
        passwordInput.type = "text";
      });

      // Hide password when mouse is released
      toggleButton.addEventListener("mouseup", () => {
        passwordInput.type = "password";
      });

      // Hide password when mouse leaves the button 
      toggleButton.addEventListener("mouseleave", () => {
        passwordInput.type = "password";
      });

      // Prevent the button from submitting the form
      toggleButton.addEventListener("click", (e) => {
        e.preventDefault();
      });
    }
  };

  // Setup password toggles
  setupPasswordToggle("password", "toggle-password");
  setupPasswordToggle("confirmPassword", "toggle-confirm-password");

  form.onsubmit = async (e) => {
    e.preventDefault();
    hideError(); // Clear any previous errors

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries()) as {
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
    };

    // Only validate that passwords match on frontend
    if (data.password !== data.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    // Remove confirmPassword from data before sending to server
    const { confirmPassword, ...registrationData } = data;
    console.log(registrationData); // debug

    try {
      await register(registrationData);
      // alert("Registration Successful!"); // debug

      // redirect to login
      form.reset();
      hideError();
      const registerContainer = document
        .getElementById("register-form")
        ?.closest("div");
      if (registerContainer) registerContainer.classList.add("hidden");

      // Show the login modal
      navigateTo("/login", container);
    } catch (error) {
      console.error("Registration failed:", error);
      showError(error instanceof Error ? error.message : "Registration failed. Please try again");
    }
  };
}
