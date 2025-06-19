import { loadHtml } from "../utils/htmlLoader.js";
import { register } from "../services/userService.js";

export async function renderRegister(container: HTMLElement | null) {
    if (!container) return;

    container.innerHTML = await loadHtml("/html/registerForm.html");
	
}
