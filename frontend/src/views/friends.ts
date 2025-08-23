import { loadHtml } from "../utils/htmlLoader.js";
import { getUsers } from "../services/userService.js";
import { getUserFriends } from "../services/friendshipService.js";
import { getCurrentUsername, getUserAvatar } from "../utils/userUtils.js";
import { ChatComponent, Friend } from "./chat.js";
import { PrivateMessageResponse } from "../interfaces/message.interfaces.js";

export async function renderFriends(container: HTMLElement | null) {
  if (!container) return;

  // Limpar o container antes de renderizar
  container.innerHTML = "";

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

    const friends: Friend[] = (await getUserFriends()) as Friend[];
    friends.forEach(async (friend) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center px-4 py-2 cursor-pointer hover:bg-(--color-primary-light)";
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
      li.addEventListener("click", () => c.openChat(friend));
      container.appendChild(li);
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    container.innerHTML = "<p>Error loading user list.</p>";
  }
}
export async function renderFriendsDialog() {
  // Verificar se o dialog já existe
  let dialog = document.getElementById("friends-dialog");
  if (dialog) {
    dialog.remove(); // Remover dialog existente para evitar duplicatas
    return;
  }

  // Criar o container do dialog
  dialog = document.createElement("div");
  dialog.id = "friends-dialog";
  dialog.className =
    "fixed top-16 right-0 w-120 z-50 flex items-start";

  // Criar o conteúdo do dialog
  const dialogContent = document.createElement("div");
  dialogContent.className =
    "bg-white/30 backdrop-blur-sm w-3/4 max-w-lg rounded-lg shadow-lg p-6 relative absolute";

  // Botão de fechar
  const closeButton = document.createElement("button");
  closeButton.className =
    "absolute top-2 right-2 text-gray-500 hover:text-gray-700";
  closeButton.innerHTML = "&times;";
  closeButton.addEventListener("click", () => dialog?.remove());
  dialogContent.appendChild(closeButton);

  // Container da lista de amigos
  const friendsContainer = document.createElement("ul");
  friendsContainer.id = "friends-dialog-list";
  friendsContainer.className = "overflow-y-auto max-h-96";
  dialogContent.appendChild(friendsContainer);

  // Adicionar o conteúdo ao dialog
  dialog.appendChild(dialogContent);

  // Adicionar o dialog ao body
  document.body.appendChild(dialog);

  // Renderizar a lista de amigos dentro do dialog
  await renderFriends(friendsContainer);
}
