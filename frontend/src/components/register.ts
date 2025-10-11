import { loadHtml } from "../utils/htmlLoader.js";
import { register } from "../services/authService.js";
import { navigateTo } from "../router/router.js";
import { renderHome } from "../views/home.js";
import {
  JUNGLE_AVATARS,
  getJungleAvatarFile,
  saveUserAvatar,
} from "../services/profileService.js";
import { UsernameValidator } from "../utils/usernameValidator.js";

export async function openRegisterModal(container: HTMLElement | null = null) {
  // If container is provided, render home page as backdrop first (without animations)
  if (container) {
    await renderHome(container, true);
  }

  // Inject the modal HTML if it doesn't exist
  if (!document.getElementById("register-modal")) {
    const modalHtml = await loadHtml("/html/register.html");
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }

  const modal = document.getElementById("register-modal")!;
  const form = modal.querySelector("#register-form") as HTMLFormElement;

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

  // Password visibility toggle functionality
  const setupPasswordToggle = (inputId: string, toggleId: string) => {
    const passwordInput = modal.querySelector(
      `#${inputId}`,
    ) as HTMLInputElement;
    const toggleButton = modal.querySelector(
      `#${toggleId}`,
    ) as HTMLButtonElement;

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
  setupPasswordToggle("register-password", "register-toggle-password");
  setupPasswordToggle(
    "register-confirm-password",
    "register-toggle-confirm-password",
  );

  // Add real-time username validation
  const usernameInput = modal.querySelector(
    "#register-username",
  ) as HTMLInputElement;
  const usernameError = modal.querySelector("#username-error") as HTMLElement;

  if (usernameInput && usernameError) {
    usernameInput.addEventListener("input", () => {
      const validation = UsernameValidator.validate(usernameInput.value);
      if (!validation.valid && usernameInput.value.length > 0) {
        usernameError.textContent =
          UsernameValidator.getErrorMessage(validation);
        usernameError.classList.remove("hidden");
        usernameInput.classList.add("border-red-500");
      } else {
        usernameError.classList.add("hidden");
        usernameInput.classList.remove("border-red-500");
      }
    });

    // Also validate on blur
    usernameInput.addEventListener("blur", () => {
      if (usernameInput.value.length > 0) {
        const validation = UsernameValidator.validate(usernameInput.value);
        if (!validation.valid) {
          usernameError.textContent =
            UsernameValidator.getErrorMessage(validation);
          usernameError.classList.remove("hidden");
          usernameInput.classList.add("border-red-500");
        }
      }
    });
  }

  // Show the modal
  modal.style.display = "flex";

  form.onsubmit = async (e) => {
    e.preventDefault();
    hideError(); // Clear any previous errors

    const formData = new FormData(form);
    type RegistrationFormData = {
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
      avatar?: string;
    };
    const data = Object.fromEntries(formData.entries()) as RegistrationFormData;

    // Validate username
    const usernameValidation = UsernameValidator.validate(data.username);
    if (!usernameValidation.valid) {
      showError(UsernameValidator.getErrorMessage(usernameValidation));
      return;
    }

    // Normalize username to lowercase
    // data.username = UsernameValidator.normalize(data.username);

    // Only validate that passwords match on frontend
    if (data.password !== data.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    // Validate password strength (matches backend validation)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/;
    if (!passwordRegex.test(data.password)) {
      showError("Incorrect password format");
      return;
    }

    // Remove confirmPassword from data before sending to server
    const { confirmPassword, ...registrationData } = data;

    // Assign a random avatar from the avatars folder
    const avatarList = [
      "bear.png",
      "cat.png",
      "chicken.png",
      "dog.png",
      "gorilla.png",
      "koala.png",
      "meerkat.png",
      "panda.png",
      "rabbit.png",
      "robot.png",
      "sloth.png",
    ];
    const randomAvatar =
      avatarList[Math.floor(Math.random() * avatarList.length)];
    registrationData.avatar = randomAvatar;

    try {
      await register(registrationData);

      // After successful registration, assign a random avatar
      const randomAvatar =
        JUNGLE_AVATARS[Math.floor(Math.random() * JUNGLE_AVATARS.length)];
      try {
        const avatarFile = await getJungleAvatarFile(randomAvatar);
        await saveUserAvatar(registrationData.username, avatarFile);
      } catch (avatarError) {
        // Optionally handle avatar assignment error silently
      }

      // Close register modal
      modal.style.display = "none";
      form.reset();

      // Show the login modal
      navigateTo("/login", container);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again",
      );
    }
  };
}
