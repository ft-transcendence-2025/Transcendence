// src/views/friends.ts
import { getUserFriends } from "../services/friendship.service.js";
import { getUserAvatar } from "../services/profileService.js";
import { Friend } from "./chat.js";
import { getChatManager } from "../app.js";
import { closeModal } from "../components/modalManager.js";
import { getCurrentUsername } from "../utils/userUtils.js";
import chatService from "../services/chat.service.js";
import { notificationService } from "../services/notifications.service.js";

// Renders the friends list inside a provided container
export async function renderFriends(container: HTMLElement | null) {
  if (!container) return;
  container.innerHTML = "";

  try {
    const friendsResult = await getUserFriends();
    const friends: Friend[] = Array.isArray(friendsResult) ? friendsResult : [];
    // Sort friends: ONLINE first, then others
    friends.sort((a, b) => {
      if (a.status === "ONLINE" && b.status !== "ONLINE") return -1;
      if (a.status !== "ONLINE" && b.status === "ONLINE") return 1;
      return 0;
    });
    console.log("Fetched friends:", friends);

    if (friends.length === 0) {
      container.innerHTML = "<p>No friends found. Add some friends to start chatting!</p>";
      return;
    }
    for (const friend of friends) {
      const li = createFriendElement(friend);
      container.appendChild(li);

      setTimeout(() => updateUnreadBadge(friend.username), 0);
      console.log(`Set up eventlistener for ${friend.username}`);
      li.addEventListener("click", async () => {
        const chatManager = getChatManager();
        chatManager.openChat(friend);
        await chatManager.chatService.markConversationAsRead(friend.username);
        closeModal();
      });
      notificationService.subscribe(() => {
        updateUnreadBadge(friend.username);
      });
    }
  } catch (error) {
    console.error("Failed to fetch friends:", error);
    container.innerHTML = "<p>Error loading friends list.</p>";
  }
}


function createFriendElement(friend: Friend): HTMLElement {
  const li = document.createElement("li");
  li.className =
    "flex items-center px-4 py-2 mt-1 cursor-pointer hover:bg-(--color-primary-light)/15 rounded-xl";
  li.innerHTML = `
  <span class="relative inline-block w-9 h-9 rounded-full border-2 ${friend.status === "ONLINE"
      ? "border-green-500 shadow-[0_0_10px_3px_rgba(34,197,94,0.45)] animate-pulse"
      : "border-gray-400 shadow-[0_0_6px_2px_rgba(156,163,175,0.25)] opacity-70 grayscale"
    } bg-gray-300 overflow-hidden align-middle transition-all duration-300">
    <img src="${getUserAvatar(friend.username)}" class="w-9 h-9 object-cover" onerror="this.onerror=null;this.src='assets/avatars/panda.png';"/>
    <span class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ${friend.status === "ONLINE"
      ? "bg-green-400 border-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.45)] animate-pulse"
      : "bg-gray-400 border-gray-400 shadow-[0_0_4px_1px_rgba(156,163,175,0.22)]"
    } border-2"></span>
  </span>
  <span class="ml-5 text-(--color-primary-light) font-semibold ${friend.status === "ONLINE" ? "text-green-500" : "text-gray-400"
    }">${friend.username}</span>
  <span id="badge-${friend.username}" class="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full hidden"></span>
  `;
  return li;
}


function updateUnreadBadge(username: string) {
  console.log(`Updating unread badge for ${username}`);
  const badge = document.getElementById(`badge-${username}`);
  if (!badge) {
    console.warn(`Badge element not found for username: ${username}`);
    return;
  } else {
    console.log("Badge Element for Friend:", badge);
  }
  const unreadCount = notificationService.getState().messageNotifications.get(username) || 0;
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount.toString();
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
}

// Returns the content for the friends modal
export async function getFriendsContent(): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.className = "w-full";

  const title = document.createElement("h2");
  title.className = "text-lg font-semibold mb-4 text-center text-(--color-secondary-light)";
  title.textContent = "Friends";
  container.appendChild(title);

  const list = document.createElement("ul");
  list.className = "overflow-y-auto max-h-96";
  container.appendChild(list);

  await renderFriends(list);

  return container;
}
