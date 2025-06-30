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
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log(data); // debug

    try {
      await register(data);
      alert("Registration Successful!"); // debug

      // redirect to login
      // Hide the register form
      form.reset();
      const registerContainer = document
        .getElementById("register-form")
        ?.closest("div");
      if (registerContainer) registerContainer.classList.add("hidden");

      // Show the login modal
      const loginModal = document.getElementById("login-modal");
      if (loginModal) {
        loginModal.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed! Please try again."); // debug
    }
  };
}
