import { renderNavbar } from "./components/navbar.js";
import { router, navigateTo } from "./router/router.js";

// set initial app layout
const navbarElement = document.getElementById('navbar');
const contentElement = document.getElementById('content');

// listen for browser back / forward navigation
window.addEventListener('popstate', () => {
  router(contentElement); 
});

// listen for dom to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {

  await renderNavbar(navbarElement); // render the navbar component
  // global click listener for navigation links (data-links)
  document.body.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.matches('[data-link]')) {
      event.preventDefault(); // prevent default link behavior (full page reload)
      const path = target.getAttribute('href');
      if (path) {
        navigateTo(path, contentElement);
      }
    }
  });

  router(contentElement); // load home view on initial run
});