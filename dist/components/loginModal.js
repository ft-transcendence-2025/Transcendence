import { loadHtml } from "../utils/htmlLoader.js";
import { login } from "../services/authService.js";
import { navigateTo } from "../router/router.js";
import { renderNavbar } from "./navbar.js";
import { renderHome } from "../views/home.js";
// This function will find the modal on the page and open it.
export async function openLoginModal(container = null) {
    // If container is provided, render home page as backdrop first
    if (container) {
        await renderHome(container);
    }
    // Inject the modal HTML if it doesn't exist
    if (!document.getElementById("login-modal")) {
        const modalHtml = await loadHtml("/html/loginModal.html");
        document.body.insertAdjacentHTML("beforeend", modalHtml);
    }
    const modal = document.getElementById("login-modal");
    const form = modal.querySelector("form");
    const closeButton = modal.querySelector(".close-button");
    // Add event listener for the form submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        // Hide error message if it exists
        const errorDiv = document.getElementById("login-error");
        if (errorDiv) {
            errorDiv.classList.add("hidden");
            errorDiv.textContent = "";
        }
        try {
            const response = await login(data);
            localStorage.setItem("authToken", response.token);
            // alert("Login Successful!"); //debug
            closeModal();
            // render navbar to update links
            const navbarContainer = document.getElementById("navbar");
            if (navbarContainer) {
                renderNavbar(navbarContainer);
            }
            const container = document.getElementById("content");
            navigateTo("/dashboard", container);
        }
        catch (error) {
            if (errorDiv) {
                errorDiv.classList.remove("hidden");
                errorDiv.textContent = "Login failed. Please check your credentials.";
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
    if (modal)
        modal.style.display = "none";
    const container = document.getElementById("content");
    navigateTo("/", container);
}
