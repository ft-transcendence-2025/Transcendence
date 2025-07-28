import { renderNavbar } from "./components/navbar.js";
import { router, navigateTo } from "./router/router.js";
// Function to close all open modals
function closeAllModals() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
        const modalElement = modal;
        modalElement.style.display = "none";
    });
}
// set initial app layout
const navbarElement = document.getElementById("navbar");
const contentElement = document.getElementById("content");
// listen for browser back / forward navigation
window.addEventListener("popstate", () => {
    // Close any open modals before routing
    closeAllModals();
    router(contentElement);
});
// listen for dom to be fully loaded
document.addEventListener("DOMContentLoaded", async () => {
    await renderNavbar(navbarElement); // render the navbar component
    // global click listener for navigation links (data-links)
    document.body.addEventListener("click", (event) => {
        const target = event.target;
        const linkElement = target.closest("[data-link]");
        if (linkElement) {
            event.preventDefault(); // prevent default link behavior (full page reload)
            //event.stopPropagation(); // stop event bubbling
            // Close any open modals before navigating
            closeAllModals();
            const path = linkElement.getAttribute("href");
            if (path) {
                navigateTo(path, contentElement);
            }
        }
    });
    router(contentElement); // load home view on initial run
});
