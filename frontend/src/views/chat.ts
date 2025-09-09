import {
  NotificationMessage,
  PrivateSendMessage,
  UserBlockMessageResponse,
} from "../interfaces/message.interfaces.js";
import { navigateTo } from "../router/router.js";
import chatService from "../services/chat.service.js";
import { getUserFriends } from "../services/friendship.service.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUsername } from "../utils/userUtils.js";
import { getUserAvatar } from "../services/profileService.js";

export type Friend = {
  id: string;
  username: string;
  status?: "ONLINE" | "OFFLINE";
};

export async function renderChat(container: HTMLElement | null) {
  if (!container) return;
  container.innerHTML = await loadHtml("/html/chat.component.html");
}

class ChatComponent {
  container: HTMLElement;
  friends: Friend[];
  openChats: Map<string, HTMLElement>;
  messages: Map<string, any[]>;
  notifications: Map<string, any[]>;
  currentUserId: string = getCurrentUsername() as string;
  public chatService: chatService = new chatService();

  constructor(containerId: string, friends: any) {
    this.container = document.getElementById(containerId)!;
    this.friends = friends;
    this.openChats = new Map();
    this.messages = new Map();
    this.notifications = new Map([
      ["messages", []],
      ["friendRequests", []],
      ["gameInvites", []],
      ["tournamentTurns", []],
    ]);
  }

    storeNotifications(notifications: any[]) {
    notifications.forEach((notification) => {
      switch (notification.type) {
        case "NEW_MESSAGE":
          this.notifications.get("messages")!.push(notification);
          break;

        case "FRIEND_REQUEST":
          this.notifications.get("friendRequests")!.push(notification);
          break;

        case "GAME_INVITE":
          this.notifications.get("gameInvites")!.push(notification);
          break;

        case "TOURNAMENT_TURN":
          this.notifications.get("tournamentTurns")!.push(notification);
          break;

        default:
          console.warn("Unknown notification type:", notification.type);
      }
    });

    // this.updateNotificationBadges();
  }

    async markNotificationsAsRead(type: string, senderId?: string) {
    try {
      // Call the backend to mark notifications as read
      await this.chatService.markNotificationsAsRead(type, senderId);
  
      // Remove notifications from the array
      if (senderId) {
        // Remove notifications of the given type and senderId
        const filteredNotifications = this.notifications.get(type)!.filter(
          (notification) => notification.senderId !== senderId
        );
        this.notifications.set(type, filteredNotifications);
      } else {
        // Remove all notifications of the given type
        this.notifications.set(type, []);
      }
  
      // Update the UI (e.g., hide badges)
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }

  reset() {
    // Close all open chats
    this.openChats.forEach((chat, friendId) => {
      chat.remove();
    });
    this.openChats.clear();

    // Clear messages
    this.messages.clear();

    // Disconnect the chat service
    if (this.chatService.conn) {
      this.chatService.conn.close();
      this.chatService.conn = null;
    }

    console.log("Chat service reset: All chats closed and connection terminated.");
  }

  async updateChatMessages(friendId: string) {
    const chatWindow = this.openChats.get(friendId);
    if (!chatWindow) return;
    const messagesContainer = chatWindow.querySelector("#messages") as HTMLElement;

    const messages = this.messages.get(friendId);

    if (messages) {
      messagesContainer.innerHTML = messages
        .map(
          (message) => `
        <div class="mb-2 ${message.recipientId || message.senderId == this.currentUserId ? "text-right" : "text-left"}">
          <div class="inline-block p-2 rounded-lg max-w-xs ${message.recipientId || message.senderId == this.currentUserId
              ? "bg-[var(--color-primary)] text-[var(--color-background)] ml-auto"
              : "bg-[var(--color-secondary-light)] text-[var(--color-text-primary)]"
            }">
            <div class="text-xs">${message.content}</div>
            <div class="text-xs opacity-70 mt-1">
              ${new Date(message.ts || message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            </div>
          </div>
        </div>
      `
        )
        .join("");

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  async updateChatHistory(friendId: string) {
    const chatWindow = this.openChats.get(friendId);
    if (!chatWindow) return;
    const messagesContainer = chatWindow.querySelector("#messages") as HTMLElement;

    const messages: [any] = await this.chatService.getConversation(friendId);
    this.messages.set(friendId, messages);

    if (messages) {
      messagesContainer.innerHTML = messages
        .map(
          (message) => `
        <div class="mb-2 ${message.senderId == this.currentUserId ? "text-right" : "text-left"}">
          <div class="inline-block p-2 rounded-lg max-w-xs ${message.senderId == this.currentUserId
              ? "bg-[var(--color-primary)] text-[var(--color-background)] ml-auto"
              : "bg-[var(--color-secondary-light)] text-[var(--color-text-primary)]"
            }">
            <div class="text-xs">${message.content}</div>
            <div class="text-xs opacity-70 mt-1">
              ${new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            </div>
          </div>
        </div>
      `
        )
        .join("");

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  async sendMessage(friendId: string, message: PrivateSendMessage | UserBlockMessageResponse | NotificationMessage) {
    

    if ("content" in message && (!message.content || !message.content.trim())) return;
    this.chatService.sendPrivateMessage(message);
    if (message.kind === "private/send") {
      let temp = this.messages.get(friendId);
      if (temp) {
        temp.push(message);
        this.messages.set(friendId, temp);
      } else {
        this.messages.set(friendId, [message]);
      }
      await this.updateChatMessages(friendId);
    }
  }

  async openChat(friend: Friend) {
    let friendAvatar = document.createElement("img");
    friendAvatar.src = await getUserAvatar(friend.username);

    if (this.openChats.has(friend.username)) {
      const existingChat = this.openChats.get(friend.username)!;
      const messagesSection = existingChat.querySelector("#messages")!.parentElement!;
      const inputSection = existingChat.querySelector("#message-input")!.parentElement!;

      if (messagesSection.classList.contains("hidden")) {
        messagesSection.classList.remove("hidden");
        inputSection.classList.remove("hidden");
        existingChat.classList.remove("h-auto");
        existingChat.classList.add("h-80");

        const messageInput = existingChat.querySelector("#message-input") as HTMLInputElement;
        messageInput.focus();
      }
      return;
    }

    const chatContainer = document.createElement("div");
    chatContainer.className =
      "w-74 h-90 bg-[var(--color-background)] shadow-lg border rounded-lg flex flex-col";
    chatContainer.innerHTML = `
      <div class="flex justify-between items-center p-2 bg-[var(--color-primary-dark)] text-[var(--color-background)] rounded-t-lg">
      <span>
        <span class="inline-block w-8 h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden align-middle">
        <img id="friend-avatar" src="${friendAvatar.src}" class="w-8 h-8 object-cover cursor-pointer" onerror="this.onerror=null;this.src='assets/avatars/panda.png';"/>
        </span>
      </span>
      <span>${friend.username}</span>
      <div class="flex gap-2">
        <button class="close px-1 hover:bg-[var(--color-primary-darker)] rounded">x</button>
      </div>
      </div>
      <div class="flex-1 p-2 overflow-y-auto text-sm bg-[var(--color-background)]" id="messages">
      </div>
      <div class="p-2 border-t bg-[var(--color-background)]">
      <div class="flex gap-1">
        <input type="text" class="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--color-primary)] min-w-0"
        placeholder="Type a message..." id="message-input"/>
        <button class="bg-[var(--color-primary)] text-[var(--color-background)] px-2 py-1 rounded text-sm hover:bg-[var(--color-primary-dark)] focus:outline-none flex-shrink-0"
        id="send-button">Send</button>
      </div>
      </div>
    `;

    // Example: Add event listener to the username span
    const friendAvatarImg = chatContainer.querySelector("#friend-avatar");
    if (friendAvatarImg) {
      friendAvatarImg.addEventListener("click", () => {
        navigateTo(`/friend-profile?username=${friend.username}`, document.getElementById("content"));
      });
    }

    const messageInput = chatContainer.querySelector("#message-input") as HTMLInputElement;
    const sendButton = chatContainer.querySelector("#send-button") as HTMLButtonElement;

    const sendMessageHandler = () => {
      const text = messageInput.value.trim();
      const message: PrivateSendMessage = {
        kind: "private/send",
        type: "TEXT",
        recipientId: friend.username,
        content: text,
        ts: Date.now(),
      };
      if (message) {
        this.sendMessage(friend.username, message);
        messageInput.value = "";
      }
    };

    sendButton.addEventListener("click", sendMessageHandler);

    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessageHandler();
      }
    });

    chatContainer.querySelector(".close")!.addEventListener("click", () => this.closeChat(friend.username));

    this.container.querySelector("#chat-windows")!.appendChild(chatContainer);
    this.openChats.set(friend.username, chatContainer);

    this.updateChatHistory(friend.username);

    messageInput.focus();
  }

  closeChat(friendId: string) {
    const chat = this.openChats.get(friendId);
    if (chat) {
      chat.remove();
      this.openChats.delete(friendId);
    }
  }
}
export { ChatComponent };
