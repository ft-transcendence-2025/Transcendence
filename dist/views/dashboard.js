import { loadHtml } from "../utils/htmlLoader.js";
export async function renderDashboard(container) {
    if (!container)
        return;
    // Fetch the component's HTML template
    container.innerHTML = await loadHtml("/html/dashboard.html");
}
