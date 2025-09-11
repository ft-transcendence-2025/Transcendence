import { getUserAvatar } from "../services/profileService.js";
import { navigateTo } from "../router/router.js";
import { getUsers } from "../services/userService.js";

export default async function renderSearchBar() {
    const searchInput = document.getElementById("user-search") as HTMLInputElement;
    const searchResults = document.getElementById("search-results");
    let allUsers: any[] = [];
    const avatarCache = new Map<string, string>();

    try {
        allUsers = await getUsers();
    } catch (error) {
        console.error("Error fetching users:", error);
        return;
    }

    // Debounce utility
    function debounce(fn: Function, delay: number) {
        let timer: any;
        return (...args: any[]) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    function renderResults(query: string) {
        if (!query) {
            searchResults?.classList.add("hidden");
            if (searchResults) searchResults.innerHTML = "";
            return;
        }
        const filteredUsers = allUsers.filter((user: any) =>
            user.username.toLowerCase().includes(query)
        ).slice(0, 10); // Show only top 10 results

        if (searchResults) {
            // Only update DOM if results changed
            const prev = searchResults.getAttribute("data-last-query");
            if (prev === query) return;
            searchResults.setAttribute("data-last-query", query);

            searchResults.innerHTML = filteredUsers.map((user: any) => {
                const avatarUrl = avatarCache.get(user.username) || "/assets/avatars/panda.png";
                return `
                <li class="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 rounded-lg"
                data-username="${user.username}" style="height: 2.5rem;">
                <img data-username="${user.username}" src="${avatarUrl}" alt="${user.username}'s avatar"
                class="w-8 h-8 rounded-full border-2 border-gray-300 object-cover mr-3"
                onerror="this.onerror=null;this.src='/assets/avatars/panda.png';" />
                <span class="text-sm">${user.username}</span>
                </li>
                `;
            }).join("");

            searchResults.classList.remove("hidden");

            // Add click event to each list item
            const items = searchResults.querySelectorAll("li[data-username]");
            items.forEach((item) => {
                item.addEventListener("click", () => {
                    const username = item.getAttribute("data-username");
                    if (username) {
                        navigateTo(`/friend-profile?username=${username}`, document.getElementById("content"));
                    }
                    searchResults.classList.add("hidden");
                    if (searchInput) searchInput.value = "";
                });
            });

            // Lazy load avatars for visible results
            filteredUsers.forEach((user: any) => {
                if (!avatarCache.has(user.username)) {
                    // Use requestIdleCallback if available, else fallback to setTimeout
                    const loadAvatar = async () => {
                        try {
                            const url = await getUserAvatar(user.username);
                            avatarCache.set(user.username, url);
                            // Update only the relevant img src if still visible
                            const img = searchResults.querySelector(`img[data-username='${user.username}']`);
                            if (img) img.setAttribute("src", url);
                        } catch {
                            avatarCache.set(user.username, "/assets/avatars/panda.png");
                        }
                    };
                    if (window.requestIdleCallback) {
                        window.requestIdleCallback(loadAvatar);
                    } else {
                        setTimeout(loadAvatar, 0);
                    }
                }
            });
        }
    }

    const debouncedSearch = debounce(() => {
        const query = searchInput.value.trim().toLowerCase();
        renderResults(query);
    }, 200);

    searchInput?.addEventListener("input", debouncedSearch);

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