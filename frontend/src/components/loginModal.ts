import { loadHtml } from "../utils/htmlLoader.js";
import { login } from "../services/userService.js";
import { navigateTo } from "../router/router.js";

// This function will find the modal on the page and open it.
export async function openLoginModal() {
  // Inject the modal HTML if it doesn't exist
  if (!document.getElementById("login-modal")) {
    const modalHtml = await loadHtml("/html/loginModal.html");
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }

  const modal = document.getElementById("login-modal")!;
  const form = modal.querySelector("form")!;
  const closeButton = modal.querySelector(
    ".close-button"
  )! as HTMLButtonElement;

  // Add event listener for the form submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await login(data);
      localStorage.setItem("authToken", response.token);
      alert("Login Successful!");
      closeModal();

      const container = document.getElementById("content");
      navigateTo("/dashboard", container);
    } catch (error) {
      alert("Login failed!");
    }
  };

  // Add event listener to close the modal
  closeButton.onclick = () => closeModal();

  // Show the modal
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("login-modal");
  if (modal) modal.style.display = "none";
}
