import { loadHtml } from "../utils/htmlLoader.js";
import { register } from "../services/authService.js";
import { navigateTo } from "../router/router.js";
import { renderHome } from "../views/home.js";
export async function openRegisterModal(container = null) {
    // If container is provided, render home page as backdrop first
    if (container) {
        await renderHome(container);
    }
    // Inject the modal HTML if it doesn't exist
    if (!document.getElementById("register-modal")) {
        const modalHtml = await loadHtml("/html/registerModal.html");
        document.body.insertAdjacentHTML("beforeend", modalHtml);
    }
    const modal = document.getElementById("register-modal");
    const form = modal.querySelector("#register-form");
    // Helper function to show error messages
    const showError = (message) => {
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
    const setupPasswordToggle = (inputId, toggleId) => {
        const passwordInput = document.getElementById(inputId);
        const toggleButton = document.getElementById(toggleId);
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
    // Show the modal
    modal.style.display = "flex";
    form.onsubmit = async (e) => {
        e.preventDefault();
        hideError(); // Clear any previous errors
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
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
            // Close register modal
            modal.style.display = "none";
            form.reset();
            //hideError(); // Hide error message if it exists ???
            // Show the login modal
            navigateTo("/login", container);
        }
        catch (error) {
            console.error("Registration failed:", error);
            showError(error instanceof Error
                ? error.message
                : "Registration failed. Please try again");
        }
    };
}
