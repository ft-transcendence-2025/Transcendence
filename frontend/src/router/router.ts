import { routes } from "./routes.js";

export async function router(container: HTMLElement | null) {
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

    // Show navbar only for authenticated users, except on home page
    const navbar = document.getElementById("navbar");
    if (navbar) {
        const token = localStorage.getItem("authToken");
        const isHomePage = location.pathname === "/";
        
        if (token && !isHomePage) {
            // User is logged in and not on home page - show navbar
            navbar.classList.remove("hidden");
        } else {
            // User not logged in or on home page - hide navbar
            navbar.classList.add("hidden");
        }
    }
    
    await match.route.action(container);
}

export function navigateTo(path: string, container: HTMLElement | null) {
    history.pushState(null, "", path);
    router(container); // re-run the router to update the view
}
