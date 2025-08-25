import { getUserAvatar } from "../services/profileService.js";
import { navigateTo } from "../router/router.js";
import { getUsers } from "../services/userService.js";


export default async function renderSearchBar() {
	const searchInput = document.getElementById("user-search") as HTMLInputElement;
	const searchResults = document.getElementById("search-results");


	searchInput?.addEventListener("input", async () => {
		const query = searchInput.value.trim().toLowerCase();
		if (!query) {
			searchResults?.classList.add("hidden");
			if (searchResults) searchResults.innerHTML = "";
			return;
		}


		try {
			const users = await getUsers();
			const filteredUsers = users.filter((user: any) =>
				user.username.toLowerCase().includes(query)
			);


			if (searchResults) {
				searchResults.innerHTML = (await Promise.all(
					filteredUsers.map(async (user: any) => {
						const avatarUrl = await getUserAvatar(user.username);
						return `
						<li class="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 rounded-lg"
						data-username="${user.username}" style="height: 2.5rem;">
						<img src="${avatarUrl}" alt="${user.username}'s avatar"
						class="w-8 h-8 rounded-full border-2 border-gray-300 object-cover mr-3"
						onerror="this.onerror=null;this.src='/assets/avatars/panda.png';" />
						<span class="text-sm">${user.username}</span>
						</li>
						`;
					})
				)).join("");


				searchResults.classList.remove("hidden");


				// Add click event to each list item
				const items = searchResults.querySelectorAll("li[data-username]");
				items.forEach((item) => {
					item.addEventListener("click", () => {
						const username = item.getAttribute("data-username");
						if (username) {
							navigateTo("/friend-profile", document.getElementById("content"), { username });
						}
						searchResults.classList.add("hidden");
						if (searchInput) searchInput.value = "";
					});
				});
			}
		} catch (error) {
			console.error("Error fetching users:", error);
		}
	});


	// Hide results when clicking outside
	document.addEventListener("click", (event) => {
		if (
			searchResults &&
			!searchResults.contains(event.target as Node) &&
			event.target !== searchInput
		) {
			searchResults.classList.add("hidden");
		}
	});
}