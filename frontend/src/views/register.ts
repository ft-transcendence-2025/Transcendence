import { loadHtml } from "../utils/htmlLoader.js";
import { register } from "../services/userService.js";
import { navigateTo } from "../router/router.js";

export async function renderRegister(container: HTMLElement | null) {
  if (!container) return;

  container.innerHTML = await loadHtml("/html/registerForm.html");

  const form = container.querySelector("#register-form") as HTMLFormElement;
  if (!form) {
    console.error("Register form not found in the container.");
    return;
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      await register(data);
      alert("Registration Successful!");
      // redirect to login
      const content = document.getElementById("content");
      navigateTo("/login", content);
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed! Please try again.");
    }
  };
}
