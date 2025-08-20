import { OutgoingMessage, PrivateSendMessage } from "../interfaces/message.interfaces.js";
import chatService from "../services/chat.service.js";
import { getUserFriends } from "../services/friendshipService.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUsername } from "../utils/userUtils.js";

type Friend = {
  id: string;
  username: string;
  status?: "online" | "offline";
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
};

export async function renderChat(container: HTMLElement | null) {
  if (!container) return;
  const friends = await getUserFriends();
  container.innerHTML = await loadHtml("/html/chat.component.html");
  const c = new ChatComponent("chat-root", friends);
  

  if (c.chatService.conn) {
    c.chatService.conn.addEventListener('message', (e) => console.log('Message bene que disse:', e.data));
    c.chatService.conn.addEventListener('close', () => {
        console.log('Disconnected from chat-service.');
    });
  }
}

class ChatComponent {
  private container: HTMLElement;
  private friends: Friend[];
  private openChats: Map<string, HTMLElement>;
  private messages: Map<string, Message[]>; // friendId -> messages
  private currentUserId: string = getCurrentUsername() as string;
  public chatService: chatService = new chatService();

  constructor(containerId: string, friends: any) {
    this.container = document.getElementById(containerId)!;
    this.friends = friends;
    this.openChats = new Map();
    this.messages = new Map();
    // this.initializeMessages();
    this.render();
  }


  private addMessage(friendId: string, text: string, isFromMe: boolean) {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      senderId: isFromMe ? this.currentUserId : friendId,
      receiverId: isFromMe ? friendId : this.currentUserId,
      text: text,
      timestamp: new Date(),
      isFromMe: isFromMe
    };

    if (!this.messages.has(friendId)) {
      this.messages.set(friendId, []);
    }
    
    this.messages.get(friendId)!.push(message);
    
    // Update the chat window if it's open
    this.updateChatMessages(friendId);
  }

  private updateChatMessages(friendId: string) {
    const chatWindow = this.openChats.get(friendId);
    if (!chatWindow) return;

    const messagesContainer = chatWindow.querySelector("#messages") as HTMLElement;
    // const messages = this.messages.get(friendId) || [];
    const messages : any[] = this.chatService.getConversation(friendId);
    
    messagesContainer.innerHTML = messages.map(message => `
      <div class="mb-2 ${message.senderId == this.currentUserId ? 'text-right' : 'text-left'}">
        <div class="inline-block p-2 rounded-lg max-w-xs ${
          message.senderId == this.currentUserId 
            ? 'bg-blue-500 text-white ml-auto' 
            : 'bg-gray-200 text-gray-800'
        }">
          <div class="text-xs">${message.content}</div>
          <div class="text-xs opacity-70 mt-1">
            ${message.ts.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
      </div>
    `).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private sendMessage(friendId: string, message: PrivateSendMessage) {
    if (!message.content.trim()) return;
    
    this.addMessage(friendId, message.content.trim(), true);
    this.chatService.sendPrivateMessage(message);
  }

  private render() {
    const list = this.container.querySelector("#friends-list")!;
    this.friends.forEach((friend) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100";
      li.innerHTML = `
        <span>${friend.username}</span>
        <span class="w-3 h-3 rounded-full ${
          friend.status === "online" ? "bg-green-500" : "bg-gray-400"
        }"></span>
      `;
      li.addEventListener("click", () => this.openChat(friend));
      list.appendChild(li);
    });
  }

  private openChat(friend: Friend) {
    // If chat exists but is minimized, restore it instead of creating a new one
    if (this.openChats.has(friend.id)) {
      const existingChat = this.openChats.get(friend.id)!;
      const messagesSection = existingChat.querySelector("#messages")!.parentElement!;
      const inputSection = existingChat.querySelector("#message-input")!.parentElement!;
      
      // If it's minimized, restore it
      if (messagesSection.classList.contains("hidden")) {
        messagesSection.classList.remove("hidden");
        inputSection.classList.remove("hidden");
        existingChat.classList.remove("h-auto");
        existingChat.classList.add("h-80");
        
        // Update minimize button
        const minimizeBtn = existingChat.querySelector(".minimize") as HTMLButtonElement;
        minimizeBtn.textContent = "_";
        
        // Focus on input
        const messageInput = existingChat.querySelector("#message-input") as HTMLInputElement;
        messageInput.focus();
      }
      return;
    }

    const chatContainer = document.createElement("div");
    chatContainer.className =
      "w-64 h-80 bg-white shadow-lg border rounded-lg flex flex-col";
    chatContainer.innerHTML = `
      <div class="flex justify-between items-center p-2 bg-blue-600 text-white rounded-t-lg">
        <span>${friend.username}</span>
        <div class="flex gap-2">
          <button class="minimize px-1 hover:bg-blue-700 rounded">_</button>
          <button class="close px-1 hover:bg-blue-700 rounded">×</button>
        </div>
      </div>
      <div class="flex-1 p-2 overflow-y-auto text-sm bg-gray-50" id="messages"></div>
      <div class="p-2 border-t bg-white">
        <div class="flex gap-1">
          <input type="text" class="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 min-w-0" 
                 placeholder="Type a message..." id="message-input"/>
          <button class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 focus:outline-none flex-shrink-0" 
                  id="send-button">Send</button>
        </div>
      </div>
    `;

    // Add event listeners
    const messageInput = chatContainer.querySelector("#message-input") as HTMLInputElement;
    const sendButton = chatContainer.querySelector("#send-button") as HTMLButtonElement;


    const sendMessageHandler = () => {
      const text = messageInput.value.trim();
      const message : PrivateSendMessage =  {
        kind : 'private/send',
        type : 'TEXT',
        recipientId : friend.username,
        content : text,
        ts : Date.now()
      }
      if (message) {
        this.sendMessage(friend.id, message);
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
      .addEventListener("click", () => this.closeChat(friend.id));

    // Minimize/expand chat
    chatContainer
      .querySelector(".minimize")!
      .addEventListener("click", () => {
        const messagesSection = chatContainer.querySelector("#messages")!.parentElement!;
        const inputSection = chatContainer.querySelector("#message-input")!.parentElement!;
        const isMinimized = messagesSection.classList.contains("hidden");
        
        if (isMinimized) {
          // Restore the chat
          messagesSection.classList.remove("hidden");
          inputSection.classList.remove("hidden");
          chatContainer.classList.remove("h-auto");
          chatContainer.classList.add("h-80");
        } else {
          // Minimize the chat
          messagesSection.classList.add("hidden");
          inputSection.classList.add("hidden");
          chatContainer.classList.remove("h-80");
          chatContainer.classList.add("h-auto");
        }
        
        // Change minimize button text
        const minimizeBtn = chatContainer.querySelector(".minimize") as HTMLButtonElement;
        minimizeBtn.textContent = isMinimized ? "_" : "□";
      });

    this.container.querySelector("#chat-windows")!.appendChild(chatContainer);
    this.openChats.set(friend.id, chatContainer);
    
    // Load existing messages
    this.updateChatMessages(friend.id);
    
    // Focus on input
    messageInput.focus();
  }

  private closeChat(friendId: string) {
    const chat = this.openChats.get(friendId);
    if (chat) {
      chat.remove();
      this.openChats.delete(friendId);
    }
  }
  
}
export { ChatComponent };
