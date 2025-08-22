import { IncomingMessage, OutgoingMessage, PrivateMessageResponse, PrivateSendMessage } from "../interfaces/message.interfaces.js";
import chatService from "../services/chat.service.js";
import { getUserFriends } from "../services/friendshipService.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUsername, getUserAvatar } from "../utils/userUtils.js";

type Friend = {
  id: string;
  username: string;
  status?: "online" | "offline";
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  ts: Date;
  isFromMe: boolean;
};

export async function renderChat(container: HTMLElement | null) {
  if (!container) return;
  const friends = await getUserFriends();
  container.innerHTML = await loadHtml("/html/chat.component.html");

  const c = new ChatComponent("chat-root", friends);


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

    c.chatService.conn.addEventListener('close', () => {
      console.log("connection lost!");
      c.chatService.connect();
      console.log("reconnected!");
    });
  }
}

class ChatComponent {
  container: HTMLElement;
  friends: Friend[];
  openChats: Map<string, HTMLElement>;
  messages: Map<string, any[]>;
  currentUserId: string = getCurrentUsername() as string;
  public chatService: chatService = new chatService();

  constructor(containerId: string, friends: any) {
    this.container = document.getElementById(containerId)!;
    this.friends = friends;
    this.openChats = new Map();
    this.messages = new Map();

    this.render();
  }

  async updateChatMessages(friendId: string) {
    const chatWindow = this.openChats.get(friendId);
    if (!chatWindow) return;
    const messagesContainer = chatWindow.querySelector("#messages") as HTMLElement;

    const messages = this.messages.get(friendId);

    if (messages) {
      messagesContainer.innerHTML = messages.map(message => `
        <div class="mb-2 ${(message.recipientId || message.senderId == this.currentUserId) ? 'text-right' : 'text-left'}">
          <div class="inline-block p-2 rounded-lg max-w-xs ${(message.recipientId || message.senderId == this.currentUserId)
          ? 'bg-green-600 text-white ml-auto'
          : 'bg-gray-200 text-gray-800'
        }">
            <div class="text-xs">${message.content}</div>
            <div class="text-xs opacity-70 mt-1">
              ${new Date(message.ts || message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      `).join('');

      // Scroll to bottom
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
      messagesContainer.innerHTML = messages.map(message => `
        <div class="mb-2 ${(message.senderId == this.currentUserId) ? 'text-right' : 'text-left'}">
          <div class="inline-block p-2 rounded-lg max-w-xs ${(message.senderId == this.currentUserId)
          ? 'bg-green-600 text-white ml-auto'
          : 'bg-gray-200 text-gray-800'
        }">
            <div class="text-xs">${message.content}</div>
            <div class="text-xs opacity-70 mt-1">
              ${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      `).join('');

      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  async sendMessage(friendId: string, message: PrivateSendMessage) {
    if (!message.content.trim()) return;
    this.chatService.sendPrivateMessage(message);
    let temp = this.messages.get(friendId);
    if (temp) {
      temp.push(message);
      this.messages.set(friendId, temp);
    } else {
      this.messages.set(friendId, [message]);
    }
    await this.updateChatMessages(friendId);
  }

  render() {
    const list = this.container.querySelector("#friends-list")!;
    this.friends.forEach((friend) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100";
      li.innerHTML = `
        <span>${friend.username}</span>
        <span class="w-3 h-3 rounded-full ${friend.status === "online" ? "bg-green-500" : "bg-gray-400"
        }"></span>
      `;
      li.addEventListener("click", () => this.openChat(friend));
      list.appendChild(li);
    });
  }

  async openChat(friend: Friend) {

    let friendAvatar = document.createElement("img");
    friendAvatar.src = await getUserAvatar(friend.username);

    if (this.openChats.has(friend.username)) {
      const existingChat = this.openChats.get(friend.username)!;
      const messagesSection = existingChat.querySelector("#messages")!.parentElement!;
      const inputSection = existingChat.querySelector("#message-input")!.parentElement!;

      // If it's minimized, restore it
      if (messagesSection.classList.contains("hidden")) {
        messagesSection.classList.remove("hidden");
        inputSection.classList.remove("hidden");
        existingChat.classList.remove("h-auto");
        existingChat.classList.add("h-80");


        // Focus on input
        const messageInput = existingChat.querySelector("#message-input") as HTMLInputElement;
        messageInput.focus();
      }
      return;
    }

    const chatContainer = document.createElement("div");
    chatContainer.className =
      "w-74 h-90 bg-white shadow-lg border rounded-lg flex flex-col";
    chatContainer.innerHTML = `
      <div class="flex justify-between items-center p-2 bg-green-700 text-white rounded-t-lg">
      <span>
        <span class="inline-block w-8 h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden align-middle">
        <img src="${friendAvatar.src}" class="w-8 h-8 object-cover" onerror="this.onerror=null;this.src='assets/avatars/panda.png';"/>
        </span>
      </span>
      <span>${friend.username}</span>
      <div class="flex gap-2">
        <button class="close px-1 hover:bg-green-800 rounded">x</button>
      </div>
      </div>
      <div class="flex-1 p-2 overflow-y-auto text-sm bg-radial-[at_50%_75%] from-white to-green-10 to-75%" id="messages">
      </div>
      <div class="p-2 border-t bg-white">
      <div class="flex gap-1">
        <input type="text" class="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:border-green-600 min-w-0" 
        placeholder="Type a message..." id="message-input"/>
        <button class="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700 focus:outline-none flex-shrink-0" 
        id="send-button">Send</button>
      </div>
      </div>
    `;

    // Add event listeners
    const messageInput = chatContainer.querySelector("#message-input") as HTMLInputElement;
    const sendButton = chatContainer.querySelector("#send-button") as HTMLButtonElement;


    const sendMessageHandler = () => {
      const text = messageInput.value.trim();
      const message: PrivateSendMessage = {
        kind: 'private/send',
        type: 'TEXT',
        recipientId: friend.username,
        content: text,
        ts: Date.now()
      }
      if (message) {
        this.sendMessage(friend.username, message);
        messageInput.value = '';
      }
    };

    // Send message on button click
    sendButton.addEventListener("click", sendMessageHandler);

    // Send message on Enter key press
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessageHandler();
      }
    });

    // Close chat
    chatContainer
      .querySelector(".close")!
      .addEventListener("click", () => this.closeChat(friend.username));


    this.container.querySelector("#chat-windows")!.appendChild(chatContainer);
    this.openChats.set(friend.username, chatContainer);

    // Load existing messages
    this.updateChatHistory(friend.username);

    // Focus on input
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
