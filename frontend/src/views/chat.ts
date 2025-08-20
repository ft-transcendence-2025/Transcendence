import { loadHtml } from "../utils/htmlLoader.js";

type Friend = {
  id: string;
  name: string;
  status: "online" | "offline";
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
  const friends = [
        { id: "1", name: "Alice", status: "online" },
        { id: "2", name: "Bob", status: "offline" },
        { id: "3", name: "Charlie", status: "online" },
      ];
  container.innerHTML = await loadHtml("/html/chat.component.html");
  new ChatComponent("chat-root", friends);
}

class ChatComponent {
  private container: HTMLElement;
  private friends: Friend[];
  private openChats: Map<string, HTMLElement>;
  private messages: Map<string, Message[]>; // friendId -> messages
  private currentUserId: string = "me";

  constructor(containerId: string, friends: any) {
    this.container = document.getElementById(containerId)!;
    this.friends = friends;
    this.openChats = new Map();
    this.messages = new Map();
    this.initializeMessages();
    this.render();
  }

  private initializeMessages() {
    // Initialize empty message arrays for each friend
    this.friends.forEach(friend => {
      this.messages.set(friend.id, []);
    });

    // Add some sample messages for demonstration
    this.addSampleMessages();
  }

  private addSampleMessages() {
    // Add some sample messages to make the chat feel alive
    this.addMessage("1", "Hey! How are you doing?", false);
    this.addMessage("1", "I'm doing great, thanks for asking!", true);
    this.addMessage("2", "Are we still meeting tomorrow?", false);
    this.addMessage("3", "Just finished that project we discussed!", false);
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
    const messages = this.messages.get(friendId) || [];
    
    messagesContainer.innerHTML = messages.map(message => `
      <div class="mb-2 ${message.isFromMe ? 'text-right' : 'text-left'}">
        <div class="inline-block p-2 rounded-lg max-w-xs ${
          message.isFromMe 
            ? 'bg-blue-500 text-white ml-auto' 
            : 'bg-gray-200 text-gray-800'
        }">
          <div class="text-xs">${message.text}</div>
          <div class="text-xs opacity-70 mt-1">
            ${message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
      </div>
    `).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private sendMessage(friendId: string, text: string) {
    if (!text.trim()) return;
    
    this.addMessage(friendId, text.trim(), true);
    
    // Simulate receiving a response after a short delay
    setTimeout(() => {
      const responses = [
        "That's interesting!",
        "I see what you mean",
        "Thanks for letting me know!",
        "Got it!",
        "Sounds good to me",
        "I'll think about it",
        "Nice!",
        "👍"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]!;
      this.addMessage(friendId, randomResponse, false);
    }, 500 + Math.random() * 2000); // Random delay between 0.5-2.5 seconds
  }

  private render() {
    this.container.innerHTML = `
      <div class="flex flex-col w-64 h-full bg-white border-r shadow-md">
        <div class="px-4 py-2 border-b font-semibold">Friends</div>
        <ul id="friends-list" class="flex-1 overflow-y-auto"></ul>
      </div>
      <div id="chat-windows" class="fixed bottom-0 right-0 flex gap-2 p-2"></div>
    `;

    const list = this.container.querySelector("#friends-list")!;
    this.friends.forEach((friend) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100";
      li.innerHTML = `
        <span>${friend.name}</span>
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
        <span>${friend.name}</span>
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
      if (text) {
        this.sendMessage(friend.id, text);
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
