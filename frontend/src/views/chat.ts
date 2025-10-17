import {
  NotificationMessage,
  PrivateSendMessage,
  UserBlockMessageResponse,
} from "../interfaces/message.interfaces.js";
import { navigateTo } from "../router/router.js";
import chatService from "../services/chat.service.js";
import { getPendingRequests, getUserFriends } from "../services/friendship.service.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUsername, getUserNickname } from "../utils/userUtils.js";
import { getUserAvatar } from "../services/profileService.js";
import { notificationService } from "../services/notifications.service.js";
import { chatManager } from "../app.js";
import { getHeaders, request } from "../utils/api.js";
import { BASE_URL } from "../config/config.js";
import { RemoteGame } from "./game/RemoteGame.js";
import { toast } from "../utils/toast.js";

export interface GameInviteResponse {
  state: string;
  gameMode: string;
  id: string;
}

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
  currentUserId: string = getCurrentUsername() as string;
  public chatService: chatService = new chatService();
  private sentGameInvites: Set<string> = new Set(); // Track sent invites to prevent duplicates

  constructor(containerId: string, friends: any) {
    this.container = document.getElementById(containerId)!;
    this.friends = friends;
    this.openChats = new Map();
    this.messages = new Map();
  }

  reset() {
    // Close all open chats
    this.openChats.forEach((chat, friendId) => {
      chat.remove();
    });
    this.openChats.clear();

    // Clear messages
    this.messages.clear();

    // Disconnect the WebSocket connection
    if (this.chatService.conn) {
      this.chatService.conn.close(1000, "Client logged out");
      this.chatService.conn = null;
    }

    // Clear other state
    this.friends = [];
    this.currentUserId = "";
    this.sentGameInvites.clear();
    this.container = null as any;
    this.chatService = null as any;
  }

  // Method to clear a sent game invite (called when accepted/declined)
  clearSentGameInvite(username: string) {
    this.sentGameInvites.delete(username);
  }

  // Method to clear all sent game invites (called when leaving a game)
  clearAllSentGameInvites() {
    this.sentGameInvites.clear();
  }

  async updateChatMessages(friendId: string) {
    const chatWindow = this.openChats.get(friendId);
    if (!chatWindow) {
      // If the chat is not open, increment message notifications
      notificationService.updateMessageNotifications(friendId, 1, "add");
      return;
    }
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
    chatManager.chatService.markConversationAsRead(friendId);
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
    await this.chatService.markConversationAsRead(friendId);
  }

  async sendMessage(friendId: string, message: PrivateSendMessage | UserBlockMessageResponse | NotificationMessage | any) {
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
        <span class="inline-block w-8 h-8 rounded-full bg-gray-300 border-2 border-[var(--color-background-darker)] overflow-hidden align-middle">
        <img id="friend-avatar" src="${friendAvatar.src}" class="w-8 h-8 object-cover cursor-pointer" onerror="this.onerror=null;this.src='assets/avatars/panda.png';"/>
        </span>
      </span>
      <span class=" font-bold  ">${friend.username}</span>
      <div class="flex gap-2 items-center relative">
        <button class="menu-button px-2 py-1 hover:bg-[var(--color-primary-darker)] rounded text-lg" title="Menu">⋮</button>
        <button class="close px-1 hover:bg-[var(--color-primary-darker)] rounded">x</button>
        <div class="chat-menu hidden absolute right-0 top-8 bg-[var(--color-background)] border border-[var(--color-primary)] rounded-lg shadow-lg z-50 min-w-48">
          <ul class="py-1">
            <li>
              <button class="menu-view-profile w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                View Profile
              </button>
            </li>
            <li>
              <button class="menu-send-game-invite w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                Send Game Invite
              </button>
            </li>
          </ul>
        </div>
      </div>
      </div>
      <div class="flex-1 p-2 overflow-y-auto text-sm bg-[var(--color-background)]" id="messages">
      </div>
      <div class="p-2 border-t bg-[var(--color-background)]">
      <div class="flex gap-1">
        <input type="text" class="flex-1 border rounded px-2 py-1 text-sm focus:outline-none bg-[var(--color-background-darker)] focus:border-[var(--color-primary)] min-w-0"
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

    // Menu button and dropdown functionality
    const menuButton = chatContainer.querySelector(".menu-button") as HTMLButtonElement;
    const chatMenu = chatContainer.querySelector(".chat-menu") as HTMLElement;

    // Toggle menu on button click
    menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      chatMenu.classList.toggle("hidden");
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!chatContainer.contains(target) || (!menuButton.contains(target) && !chatMenu.contains(target))) {
        chatMenu.classList.add("hidden");
      }
    });

    // Menu action handlers
    const viewProfileBtn = chatContainer.querySelector(".menu-view-profile") as HTMLButtonElement;
    viewProfileBtn.addEventListener("click", () => {
      chatMenu.classList.add("hidden");
      navigateTo(`/friend-profile?username=${friend.username}`, document.getElementById("content"));
    });

    const sendGameInviteBtn = chatContainer.querySelector(".menu-send-game-invite") as HTMLButtonElement;
    sendGameInviteBtn.addEventListener("click", async () => {
      try {
        // Check if we've already received an invite from this user
        const pendingInvites = notificationService.getState().gameInvites;
        const alreadyHaveInvite = pendingInvites.some(invite => invite.senderUsername === friend.username);

        if (alreadyHaveInvite) {
          chatMenu.classList.add("hidden");
          toast.warning(`You already have a pending game invite from ${friend.username}!`);
          return;
        }

        // Check if we've already sent an invite to this user
        if (this.sentGameInvites.has(friend.username)) {
          chatMenu.classList.add("hidden");
          toast.warning(`You already sent a game invite to ${friend.username}!`);
          return;
        }

        const response = await request(`${BASE_URL}/getgame/custom`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            player1: this.currentUserId,
            player2: friend.username,
            player1Display : await getUserNickname() || this.currentUserId
          }),
        }) as GameInviteResponse;

        chatMenu.classList.add("hidden");
        // Send game invite through notification service
        const message: NotificationMessage = {
          kind: "notification/new",
          type: "GAME_INVITE",
          recipientId: friend.username,
          senderId: this.currentUserId,
          content: `${response.id}`,
          ts: Date.now(),
        };
        await this.sendMessage(friend.username, message);

        // Track that we sent an invite to this user
        this.sentGameInvites.add(friend.username);

        toast.success(`Game invite sent to ${friend.username}!`);
        navigateTo(`/pong?mode=custom&gameId=${response.id}&side=left&opponent=${encodeURIComponent(friend.username)}`,
          document.getElementById("content"));
      } catch (err) {
        console.log(err);
        toast.error("Could not create game room.");
        return;
      }
    });

    // const clearChatBtn = chatContainer.querySelector(".menu-clear-chat") as HTMLButtonElement;
    // clearChatBtn.addEventListener("click", () => {
    //   chatMenu.classList.add("hidden");
    //   if (confirm(`Are you sure you want to clear chat history with ${friend.username}?`)) {
    //     this.messages.set(friend.username, []);
    //     this.updateChatMessages(friend.username);
    //   }
    // });

    // const blockUserBtn = chatContainer.querySelector(".menu-block-user") as HTMLButtonElement;
    // blockUserBtn.addEventListener("click", async () => {
    //   chatMenu.classList.add("hidden");
    //   if (confirm(`Are you sure you want to block ${friend.username}?`)) {
    //     const blockMessage: UserBlockMessageResponse = {
    //       kind: "user/block",
    //       recipientId: friend.username,
    //     };
    //     await this.sendMessage(friend.username, blockMessage);
    //     this.closeChat(friend.username);
    //     toast.info(`${friend.username} has been blocked.`);
    //   }
    // });

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