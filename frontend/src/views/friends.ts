import { loadHtml } from "../utils/htmlLoader.js";
import { getUsers } from "../services/userService.js";

export async function renderFriends(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/friends.html");

  // Fetch users from the API
  try {
    const userList = await getUsers();

    // Populate the user list in the container
    const userListContainer = container.querySelector(
      "#user-list",
    ) as HTMLElement;
    userListContainer.innerHTML = userList
      .map(
        (user) => `
			<div id="user-list" class="bg-gray-100 shadow-md rounded-lg p-4 mb-4 w-2xl">
                    
			
				<tr>
                        <td class="border px-4 py-2 text-left">${user.username}</td>
                        <td class="border px-4 py-2 text-left">${user.email ?? ""}</td>
                        <td class="border px-4 py-2 text-left">${
                          user.active ? "Yes" : "No"
                        }</td>
                        <td class="border px-4 py-2 text-left">${new Date(
                          user.createdAt,
                        ).toLocaleString()}</td>
                    </tr>
			</div>
		`,
      )
      .join("");
  } catch (error) {
    console.error("Failed to fetch users:", error);
    container.innerHTML = "<p>Error loading user list.</p>";
  }
}
