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
    match = {
      // mby 404 and return?
      route: routes[0], // default to the first route (home) if no match found
      isMatch: true,
    };
  }

  // Clear the container before rendering new content
  /* container.innerHTML = '';
	if (!match.route.view) {
		console.error(`No view found for route: ${match.route.path}`);
		return;
	}error
	container.innerHTML = match.route.view();
	 */
  await match.route.action(container);
}

export function navigateTo(path: string, container: HTMLElement | null) {
  history.pushState(null, "", path);
  router(container); // re-run the router to update the view
}
