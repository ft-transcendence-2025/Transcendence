import { loadHtml } from "../utils/htmlLoader.js";

// Chat service configuration
const CHAT_SERVICE_URL = `wss://localhost:5000/ws/chat`;
const GAME_ID = "123"; // Test game ID

// Global variables
let lobbySocket: WebSocket | null = null;
let currentUser: any = null;

// Bottom chat class
class BottomChat {
  private isOpen: boolean = false;
  private isMinimized: boolean = false;
  private unreadCount: number = 0;
  private chatWindow: HTMLElement | null = null;
  private chatToggle: HTMLElement | null = null;
  private chatMessages: HTMLElement | null = null;
  private chatInput: HTMLInputElement | null = null;
  private sendButton: HTMLElement | null = null;
  private closeChat: HTMLElement | null = null;
  private minimizeChat: HTMLElement | null = null;
  private typingIndicator: HTMLElement | null = null;
  private chatBadge: HTMLElement | null = null;
  private unreadCountEl: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  init() {
    this.chatWindow = document.getElementById('chatWindow');
    this.chatToggle = document.getElementById('chatToggle');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput') as HTMLInputElement;
    this.sendButton = document.getElementById('sendButton');
    this.closeChat = document.getElementById('closeChat');
    this.minimizeChat = document.getElementById('minimizeChat');
    this.typingIndicator = document.getElementById('typingIndicator');
    this.chatBadge = document.getElementById('chatBadge');
    this.unreadCountEl = document.getElementById('unreadCount');

    this.bindEvents();
    this.clearSystemMessage();
  }

  bindEvents() {
    this.chatToggle?.addEventListener('click', () => this.toggleChat());
    this.closeChat?.addEventListener('click', () => this.hideChat());
    this.minimizeChat?.addEventListener('click', () => this.hideChat());
    this.sendButton?.addEventListener('click', () => this.sendMessage());
    
    this.chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Simulate typing indicator
    let typingTimeout: number;
    this.chatInput?.addEventListener('input', () => {
      clearTimeout(typingTimeout);
      if (this.chatInput && this.chatInput.value.length > 0) {
        this.showTypingIndicator('You');
        typingTimeout = setTimeout(() => {
          this.hideTypingIndicator();
        }, 1000) as any;
      } else {
        this.hideTypingIndicator();
      }
    });

    // Close chat when clicking outside (optional)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (this.chatWindow && this.chatToggle && 
          !this.chatWindow.contains(target) && 
          !this.chatToggle.contains(target) && 
          this.isOpen) {
        // Uncomment next line if you want to close on outside click
        // this.hideChat();
      }
    });
  }

  toggleChat() {
    if (this.isOpen) {
      this.hideChat();
    } else {
      this.showChat();
    }
  }

  showChat() {
    this.isOpen = true;
    this.chatWindow?.classList.remove('translate-y-full');
    this.chatWindow?.classList.add('translate-y-0');
    this.chatInput?.focus();
    this.clearUnreadCount();
  }

  hideChat() {
    this.isOpen = false;
    this.chatWindow?.classList.remove('translate-y-0');
    this.chatWindow?.classList.add('translate-y-full');
  }

  clearSystemMessage() {
    setTimeout(() => {
      const systemMessage = this.chatMessages?.querySelector('.text-center');
      if (systemMessage) {
        systemMessage.remove();
      }
    }, 3000);
  }

  sendMessage() {
    if (!this.chatInput) return;
    
    const message = this.chatInput.value.trim();
    if (!message) return;

    // Use the existing WebSocket functionality
    if (currentUser) {
      sendLobbyMessage(message);
      this.chatInput.value = '';
      this.scrollToBottom();
    } else {
      this.addSystemMessage('Please log in to send messages');
    }
  }

    // ...existing code...
  
  addMessage(author: string, text: string, isOwn: boolean = false, time?: string) {
    if (!this.chatMessages) return;
  
    if (!time) {
      time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
  
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex items-start gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`;
  
    const avatar = document.createElement('div');
    avatar.className = `w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 ${
      isOwn 
        ? 'bg-gradient-to-r from-indigo-500 to-purple-600' 
        : 'bg-gradient-to-r from-gray-500 to-gray-600'
    }`;
    avatar.textContent = author.charAt(0).toUpperCase();
  
    const content = document.createElement('div');
    content.className = `max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`;
  
    // Username label (only show for other users, or show "You" for own messages)
    const usernameDiv = document.createElement('div');
    usernameDiv.className = `text-xs font-medium mb-1 px-1 ${
      isOwn 
        ? 'text-indigo-600 text-right' 
        : 'text-gray-600 text-left'
    }`;
    usernameDiv.textContent = isOwn ? 'You' : author;
  
    const bubble = document.createElement('div');
    bubble.className = `px-4 py-2 rounded-2xl text-sm shadow-sm ${
      isOwn 
        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md' 
        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
    }`;
    bubble.textContent = text;
  
    const timeDiv = document.createElement('div');
    timeDiv.className = `text-xs text-gray-500 mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`;
    timeDiv.textContent = time;
  
    content.appendChild(usernameDiv);
    content.appendChild(bubble);
    content.appendChild(timeDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
  
    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
  
    // If chat is closed and message is from someone else, increment unread count
    if (!this.isOpen && !isOwn) {
      this.incrementUnreadCount();
    }
  }
  
  // ...existing code...

  addSystemMessage(text: string) {
    if (!this.chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'text-center text-gray-500 text-sm py-2 italic';
    messageDiv.textContent = text;
    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.chatMessages) {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
  }

  showTypingIndicator(user: string) {
    if (this.typingIndicator) {
      this.typingIndicator.textContent = `${user} is typing...`;
      this.typingIndicator.classList.remove('hidden');
    }
  }

  hideTypingIndicator() {
    this.typingIndicator?.classList.add('hidden');
  }

  incrementUnreadCount() {
    this.unreadCount++;
    this.updateUnreadBadge();
  }

  clearUnreadCount() {
    this.unreadCount = 0;
    this.updateUnreadBadge();
  }

  updateUnreadBadge() {
    if (this.unreadCount > 0) {
      this.chatBadge?.classList.remove('hidden');
      if (this.unreadCountEl) {
        this.unreadCountEl.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
      }
    } else {
      this.chatBadge?.classList.add('hidden');
    }
  }

  updateOnlineCount(count: number) {
    const onlineCountEl = document.getElementById('onlineCount');
    if (onlineCountEl) {
      onlineCountEl.textContent = count.toString();
    }
  }
}

// Global chat instance
let bottomChatInstance: BottomChat | null = null;

export async function renderChat(container: HTMLElement | null) {
  if (!container) return;

  // Hide the navbar on home page
  // const navbar = document.getElementById("navbar");
  // if (navbar) {
  //   navbar.classList.add("hidden");
  // }

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/chat.html");
  
  // Initialize chat functionality after HTML is loaded
  initializeChatFunctionality();
}

function initializeChatFunctionality() {
  // Initialize the bottom chat UI
  bottomChatInstance = new BottomChat();

  // Get user info from token
  function getUserFromToken() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log(payload);
        return {
          id: payload.id || payload.userId || payload.sub,
          username: payload.username || payload.name || 'User',
          email: payload.email
        };
      } catch (error) {
        console.error('Error parsing token:', error);
        return null;
      }
    }
    return null;
  }

  // Connect to WebSocket
  function connectToLobby(userId: string, gameId: string): WebSocket {
    const url = CHAT_SERVICE_URL + `?userId=${userId}&gameId=${gameId}`;
    lobbySocket = new WebSocket(url);
    
    lobbySocket.onopen = function(event) {
      console.log('Connected to chat server');
      bottomChatInstance?.addSystemMessage('Connected to chat! 🎉');
    };
    
    lobbySocket.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        handleIncomingMessage(data);
      } catch (error) {
        // Handle plain text messages
        bottomChatInstance?.addMessage('System', event.data, false);
      }
    };
    
    lobbySocket.onclose = function(event) {
      console.log('Disconnected from chat server');
      bottomChatInstance?.addSystemMessage('Disconnected from chat');
    };
    
    lobbySocket.onerror = function(error) {
      console.error('WebSocket error:', error);
      bottomChatInstance?.addSystemMessage('Connection error');
    };
    
    return lobbySocket;
  }

  // Handle incoming messages
  function handleIncomingMessage(data: any) {
    switch (data.type) {
      case 'message':
        const isOwnMessage = data.username === currentUser?.username;
        bottomChatInstance?.addMessage(data.username, data.text, isOwnMessage, formatTime(data.timestamp));
        break;
      case 'user_joined':
        bottomChatInstance?.addSystemMessage(`${data.username} joined the chat`);
        bottomChatInstance?.updateOnlineCount(data.onlineCount);
        break;
      case 'user_left':
        bottomChatInstance?.addSystemMessage(`${data.username} left the chat`);
        bottomChatInstance?.updateOnlineCount(data.onlineCount);
        break;
      case 'online_count':
        bottomChatInstance?.updateOnlineCount(data.count);
        break;
      default:
        console.log('Unknown message type:', data);
    }
  }

  // Format timestamp
  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Initialize chat
  function initializeChat() {
    // Get user from token
    currentUser = getUserFromToken();
    
    if (!currentUser) {
      // For testing, use hardcoded user
      currentUser = { id: "bene", username: "ebeezer" };
    }

    // Update UI with user info
    bottomChatInstance?.addSystemMessage(`Welcome ${currentUser.username}! 👋`);
    
    // Connect to WebSocket
    try {
      connectToLobby(currentUser.username, GAME_ID);
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      bottomChatInstance?.addSystemMessage('Failed to connect to chat server');
    }
  }

  // Clean up WebSocket connection when page unloads
  window.addEventListener('beforeunload', function() {
    if (lobbySocket) {
      lobbySocket.close();
    }
  });

  // Initialize chat functionality
  initializeChat();
}

// Send message via WebSocket (moved outside class to maintain existing functionality)
function sendLobbyMessage(message: string) {
  if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
       const messageData = {
        type: 'message',
        channel: 'lobby',
        gameId: '123',
        content: message,
        username: currentUser.username,
        timestamp: new Date().toISOString()
      };
      lobbySocket.send(JSON.stringify(messageData));
  } else {
    console.error('WebSocket is not open.');
    bottomChatInstance?.addSystemMessage('Not connected to chat server');
  }
}

// Export functions that might be needed elsewhere
export function getChatInstance() {
  return bottomChatInstance;
}

export function addChatMessage(author: string, text: string, isOwn: boolean = false, time?: string) {
  bottomChatInstance?.addMessage(author, text, isOwn, time);
}

export function addSystemMessage(text: string) {
  bottomChatInstance?.addSystemMessage(text);
}