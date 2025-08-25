import { getUsers } from "../services/userService.js";
import { getUserAvatar } from "../utils/userUtils.js";

export default async function renderSearchBar() {
	const searchInput = document.getElementById("user-search") as HTMLInputElement;
	const searchResults = document.getElementById("search-results");

	searchInput?.addEventListener("input", async () => {
		const query = searchInput.value.trim().toLowerCase();
		if (!query) {
			searchResults?.classList.add("hidden");
			searchResults!.innerHTML = "";
			return;
		}

		try {
			// Fetch all users using the getUsers method
			const users = await getUsers();

			// Filter users based on the search query
			const filteredUsers = users.filter((user) =>
				user.username.toLowerCase().includes(query)
			);

			// Populate the search results
			searchResults!.innerHTML = await Promise.all(
				filteredUsers.map(async (user) => {
					const avatarUrl = await getUserAvatar(user.username);
					return `
          <li class="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 rounded-lg" data-username="${user.username}" style="height: 2.5rem;">
            <img src="${avatarUrl}" alt="${user.username}'s avatar" class="w-8 h-8 rounded-full border-2 border-gray-300 object-cover mr-3" onerror="this.onerror=null;this.src='/assets/avatars/panda.png';" />
            <span class="text-sm">${user.username}</span>
          </li>
        `;

				})
			).then((results) => results.join(""));

			searchResults?.classList.remove("hidden");
		} catch (error) {
			console.error("Error fetching users:", error);
		}
	});

	document.addEventListener("click", (event) => {
		if (
			!searchInput.contains(event.target as Node) &&
			!searchResults?.contains(event.target as Node)
		) {
			searchResults?.classList.add("hidden");
		}
	});
}