import { getUserAvatar } from "../services/profileService.js";
import { navigateTo } from "../router/router.js";
import { getUsers } from "../services/userService.js";

// Cache configuration
const CACHE_DURATION = 30000; // 30 seconds
let usersCache: {
    data: any[];
    timestamp: number;
} | null = null;
let isLoadingUsers = false;

export default async function renderSearchBar() {
    const searchInput = document.getElementById("user-search") as HTMLInputElement;
    const searchResults = document.getElementById("search-results");
    let allUsers: any[] = [];
    const avatarCache = new Map<string, string>();

    // Function to check if cache is stale
    function isCacheStale(): boolean {
        if (!usersCache) return true;
        return Date.now() - usersCache.timestamp > CACHE_DURATION;
    }

    // Function to fetch users with caching
    async function fetchUsers(forceRefresh = false): Promise<any[]> {
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && usersCache && !isCacheStale()) {
            return usersCache.data;
        }

        // Prevent multiple simultaneous API calls
        if (isLoadingUsers) {
            // Wait for existing call to complete
            while (isLoadingUsers) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return usersCache?.data || [];
        }

        try {
            isLoadingUsers = true;
            const users = await getUsers();
            usersCache = {
                data: users,
                timestamp: Date.now()
            };
            return users;
        } catch (error) {
            console.error("Error fetching users:", error);
            // Return cached data if available, even if stale
            return usersCache?.data || [];
        } finally {
            isLoadingUsers = false;
        }
    }

    // Initial load
    try {
        allUsers = await fetchUsers();
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
        );
        
        const displayLimit = 8;
        const displayedUsers = filteredUsers.slice(0, displayLimit);
        const hasMoreResults = filteredUsers.length > displayLimit;

        if (searchResults) {
            // Only update DOM if results changed
            const prev = searchResults.getAttribute("data-last-query");
            if (prev === query) return;
            searchResults.setAttribute("data-last-query", query);

            const userItems = displayedUsers.map((user: any) => {
                const avatarUrl = avatarCache.get(user.username) || "/assets/avatars/panda.png";
                return `
                <li class="group flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-(--color-primary)/20 rounded-lg transition-all duration-200 border-b border-(--color-primary-dark)/10"
                data-username="${user.username}">
                    <div class="flex items-center gap-3 flex-1">
                        <img data-username="${user.username}" src="${avatarUrl}" alt="${user.username}'s avatar"
                        class="w-10 h-10 rounded-full border-2 border-(--color-secondary) object-cover group-hover:border-(--color-primary) transition-colors"
                        onerror="this.onerror=null;this.src='/assets/avatars/panda.png';" />
                        <span class="text-sm font-medium text-(--color-text-primary) group-hover:text-(--color-primary)">${user.username}</span>
                    </div>
                    <span class="material-symbols-outlined text-(--color-secondary-light) group-hover:text-(--color-primary) text-xl">
                        arrow_forward
                    </span>
                </li>
                `;
            }).join("");

            const viewAllButton = hasMoreResults ? `
                <li class="px-4 py-3 text-center border-t-2 border-(--color-primary)/30">
                    <button id="view-all-results-btn" 
                    class="w-full py-2 rounded-lg bg-(--color-primary) hover:bg-(--color-primary-dark) text-white font-semibold transition-colors duration-200 flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined">search</span>
                        <span>View All ${filteredUsers.length} Results</span>
                    </button>
                </li>
            ` : '';

            searchResults.innerHTML = userItems + viewAllButton;
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

            // Add click event to "View All Results" button
            const viewAllBtn = document.getElementById("view-all-results-btn");
            if (viewAllBtn) {
                viewAllBtn.addEventListener("click", () => {
                    navigateTo(`/search-results?query=${encodeURIComponent(query)}`, document.getElementById("content"));
                    searchResults.classList.add("hidden");
                    if (searchInput) searchInput.value = "";
                });
            }

            // Lazy load avatars for visible results
            displayedUsers.forEach((user: any) => {
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

    // Refresh user list when search input is focused (if cache is stale)
    searchInput?.addEventListener("focus", async () => {
        if (isCacheStale()) {
            try {
                allUsers = await fetchUsers(true);
                // Re-render results if there's a query
                const query = searchInput.value.trim().toLowerCase();
                if (query) {
                    renderResults(query);
                }
            } catch (error) {
                console.error("Error refreshing users on focus:", error);
            }
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