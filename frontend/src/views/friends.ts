// src/views/friends.ts
import { getUserFriends } from "../services/friendship.service.js";
import { getUserAvatar } from "../utils/userUtils.js";
import { ChatComponent, Friend } from "./chat.js";
import { PrivateMessageResponse } from "../interfaces/message.interfaces.js";
import { chatManager } from "../app.js";
import { closeModal } from "../components/modalManager.js";

// Renders the friends list inside a provided container
export async function renderFriends(container: HTMLElement | null) {
  if (!container) return;
  container.innerHTML = "";

  try {
    const friends: Friend[] = (await getUserFriends()) as Friend[];
    friends.forEach(async (friend) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center px-4 py-2 cursor-pointer hover:bg-(--color-primary)/30 rounded-xl";
      li.innerHTML = `
        <span class="relative inline-block w-8 h-8 rounded-full border-2 ${
          friend.status === "ONLINE"
            ? "border-green-400 shadow-[0_0_4px_1px_rgba(34,197,94,0.25)]"
            : "border-gray-400 shadow-[0_0_4px_1px_rgba(156,163,175,0.18)]"
        } bg-gray-300 overflow-hidden align-middle">
          <img src="${await getUserAvatar(friend.username)}" class="w-8 h-8 object-cover" onerror="this.onerror=null;this.src='assets/avatars/panda.png';"/>
          <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${
            friend.status === "ONLINE"
              ? "bg-green-400 shadow-[0_0_3px_1px_rgba(34,197,94,0.35)]"
              : "bg-gray-400 shadow-[0_0_3px_1px_rgba(156,163,175,0.22)]"
          } border-2 border-white"></span>
        </span>
        <span class="ml-5">${friend.username}</span>
      `;
      li.addEventListener("click", () => {
        chatManager.openChat(friend)
        closeModal();
      });
      container.appendChild(li);
    });
  } catch (error) {
    console.error("Failed to fetch friends:", error);
    container.innerHTML = "<p>Error loading friends list.</p>";
  }
}

// Returns the content for the friends modal
export async function getFriendsContent(): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.className = "w-full";

  const title = document.createElement("h2");
  title.className = "text-lg font-semibold mb-4";
  title.textContent = "Friends";
  container.appendChild(title);

  const list = document.createElement("ul");
  list.className = "overflow-y-auto max-h-96";
  container.appendChild(list);

  await renderFriends(list);

  return container;
}
