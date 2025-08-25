import { routes } from "./routes.js";

export async function router(container: HTMLElement | null, params = {}) {
    const potentialMatch = routes.map((route) => {
        return {
            route: route,
            isMatch: location.pathname === route.path,
        };
    });
    let match = potentialMatch.find((potentialMatch) => potentialMatch.isMatch);
    
    if (!match) {
        // No route found, show 404
        match = {
            route: routes.find(r => r.path === "/404")!,
            isMatch: true
        };
    }

    // Show navbar by default for all routes
    const navbar = document.getElementById("navbar");
    if (navbar) {
        navbar.classList.remove("hidden");
    }

    // Clear the container before rendering new content
    /* container.innerHTML = '';
    if (!match.route.view) {
        console.error(`No view found for route: ${match.route.path}`);
        return;
    }
    container.innerHTML = match.route.view();
     */
    await match.route.action(container, params);
}

export function navigateTo(path: string, container: HTMLElement | null, params = {}) {
    history.pushState(null, "", path);
    router(container, params); // re-run the router to update the view
}
