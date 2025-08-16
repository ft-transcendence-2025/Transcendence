import { loadHtml } from "../utils/htmlLoader.js";

// Chat service configuration
const CHAT_SERVICE_URL = `wss://localhost:5000/ws/chat/lobby`;
const GAME_ID = "123"; // Test game ID

// Global variables
let lobbySocket: WebSocket | null = null;
let currentUser: any = null;

export async function renderChat(container: HTMLElement | null) {
  if (!container) return;

  // Hide the navbar on home page
  const navbar = document.getElementById("navbar");
  if (navbar) {
	navbar.classList.add("hidden");
  }

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/chat.html");
  
  // Initialize chat functionality after HTML is loaded
  initializeChatFunctionality();
}

function initializeChatFunctionality() {
  // DOM elements
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput') as HTMLInputElement;
  const sendButton = document.getElementById('sendButton');
  const typingIndicator = document.getElementById('typingIndicator');
  const onlineCount = document.querySelector('.online-count');

  if (!chatMessages || !chatInput || !sendButton || !typingIndicator) {
    console.error('Required chat elements not found');
    return;
  }

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
      addSystemMessage('Connected to chat! 🎉');
    };
    
    lobbySocket.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        handleIncomingMessage(data);
      } catch (error) {
        // Handle plain text messages
        addMessage('System', event.data, false);
      }
    };
    
    lobbySocket.onclose = function(event) {
      console.log('Disconnected from chat server');
      addSystemMessage('Disconnected from chat');
    };
    
    lobbySocket.onerror = function(error) {
      console.error('WebSocket error:', error);
      addSystemMessage('Connection error');
    };
    
    return lobbySocket;
  }

  // Send message via WebSocket
  function sendLobbyMessage(message: string) {
    if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
    //   const messageData = {
    //     type: 'message',
    //     text: message,
    //     username: currentUser.username,
    //     timestamp: new Date().toISOString()
    //   };
    //   lobbySocket.send(JSON.stringify(messageData));
      lobbySocket.send(message.toString());
    } else {
      console.error('WebSocket is not open.');
      addSystemMessage('Not connected to chat server');
    }
  }

  // Handle incoming messages
  function handleIncomingMessage(data: any) {
    switch (data.type) {
      case 'message':
        const isOwnMessage = data.username === currentUser.username;
        addMessage(data.username, data.text, isOwnMessage, formatTime(data.timestamp));
        break;
      case 'user_joined':
        addSystemMessage(`${data.username} joined the chat`);
        updateOnlineCount(data.onlineCount);
        break;
      case 'user_left':
        addSystemMessage(`${data.username} left the chat`);
        updateOnlineCount(data.onlineCount);
        break;
      case 'online_count':
        updateOnlineCount(data.count);
        break;
      default:
        console.log('Unknown message type:', data);
    }
  }

  // Update online user count
  function updateOnlineCount(count: number) {
    if (onlineCount && count) {
      onlineCount.textContent = `${count} online`;
    }
  }

  // Format timestamp
  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Auto-scroll to bottom
  function scrollToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Add new message
  function addMessage(author: string, text: string, isOwn: boolean = false, time: string | null = null) {
    if (!chatMessages) return;
    
    if (!time) {
      const now = new Date();
      time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;

    const avatar = author.charAt(0).toUpperCase();
    
    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-author">${author}</div>
        <div class="message-text">${text}</div>
        <div class="message-time">${time}</div>
      </div>
    `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
  }

  // Add system message
  function addSystemMessage(text: string) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
  }

  // Send message
  function sendMessage() {
    const text = chatInput.value.trim();
    if (text && currentUser) {
      // Send via WebSocket instead of adding directly
      sendLobbyMessage(text);
      chatInput.value = '';
    } else if (!currentUser) {
      addSystemMessage('Please log in to send messages');
    }
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
    addSystemMessage(`Welcome ${currentUser.username}! 👋`);
    
    // Connect to WebSocket
    try {
      connectToLobby(currentUser.username, GAME_ID);
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      addSystemMessage('Failed to connect to chat server');
    }
  }

  // Event listeners
  sendButton.addEventListener('click', sendMessage);
  
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Simulate typing indicator
  let typingTimeout: number;
  chatInput.addEventListener('input', function() {
    clearTimeout(typingTimeout);
    if (chatInput.value.length > 0) {
      typingIndicator.style.display = 'block';
      typingTimeout = setTimeout(() => {
        typingIndicator.style.display = 'none';
      }, 1000) as any;
    } else {
      typingIndicator.style.display = 'none';
    }
  });

  // Clean up WebSocket connection when page unloads
  window.addEventListener('beforeunload', function() {
    if (lobbySocket) {
      lobbySocket.close();
    }
  });

  // Initialize chat functionality
  scrollToBottom();
  initializeChat();
}
