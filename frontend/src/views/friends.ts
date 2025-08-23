import { loadHtml } from "../utils/htmlLoader.js";
import { getUsers } from "../services/userService.js";
import { getUserFriends } from "../services/friendshipService.js";
import { getCurrentUsername, getUserAvatar } from "../utils/userUtils.js";
import { ChatComponent, Friend } from "./chat.js";
import { PrivateMessageResponse } from "../interfaces/message.interfaces.js";

export async function renderFriends(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/friends.html");

  // Fetch users from the API
  try {
    const c = new ChatComponent("chat-root", []);

    if (c.chatService.conn) {
      c.chatService.conn.onmessage = (e: MessageEvent) => {
        const message: PrivateMessageResponse = JSON.parse(e.data);
        if (message.senderId != c.currentUserId) {
          let temp = c.messages.get(message.senderId);
          if (temp) {
            temp.push(message);
            c.messages.set(message.senderId, temp);
          } else {
            c.messages.set(message.senderId, [message]);
          }
          c.updateChatMessages(message.senderId);
        }
      };
    }

    const currentUsername = getCurrentUsername();
    const friends: Friend[] = (await getUserFriends()) as Friend[];
    const list = container.querySelector("#friends-list")!;
    friends.forEach(async (friend) => {
      let friendAvatar = document.createElement("img");
      friendAvatar.src = await getUserAvatar(friend.username);

      const li = document.createElement("li");
      li.className =
        "flex items-center px-4 py-2 cursor-pointer hover:bg-(--color-primary-light)";
      li.innerHTML = `
          <span class="relative inline-block w-8 h-8 rounded-full border-2 ${friend.status === "ONLINE" ? "border-green-400 shadow-[0_0_4px_1px_rgba(34,197,94,0.25)]" : "border-gray-400 shadow-[0_0_4px_1px_rgba(156,163,175,0.18)]"} bg-gray-300 overflow-hidden align-middle">
            <img src="${friendAvatar.src}" class="w-8 h-8 object-cover" onerror="this.onerror=null;this.src='assets/avatars/panda.png';"/>
            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${friend.status === "ONLINE" ? "bg-green-400 shadow-[0_0_3px_1px_rgba(34,197,94,0.35)]" : "bg-gray-400 shadow-[0_0_3px_1px_rgba(156,163,175,0.22)]"} border-2 border-white"></span>
          </span>
          <span class="ml-5">${friend.username}</span>
          `;
      li.addEventListener("click", () => c.openChat(friend));
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    container.innerHTML = "<p>Error loading user list.</p>";
  }
}
