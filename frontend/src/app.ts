import { renderNavbar } from "./components/navbar.js";
import { IncomingMessage, PrivateMessageResponse } from "./interfaces/message.interfaces.js";
import { router, navigateTo } from "./router/router.js";
import chatService from "./services/chat.service.js";
import { FriendshipStatus } from "./services/friendship.service.js";
import { notificationService } from "./services/notifications.service.js";
import { getUserAvatar } from "./services/profileService.js";
import { refreshAccessToken } from "./utils/api.js";
import { getCurrentUsername } from "./utils/userUtils.js";
import { ChatComponent } from "./views/chat.js";
import { updateFriendshipStatusCache } from "./views/profile.js";

export let chatManager: any | undefined;

export function getChatManager(): ChatComponent {
  console.log("getChatManager called. Current chatManager:", chatManager);
  if (!chatManager || !chatManager.chatService.conn) {
    console.log("Creating new ChatComponent instance...");
    initializeChatManager();
  } else {
    console.log("Reusing existing ChatComponent instance...");
  }
  return chatManager;
}

export async function initializeChatManager() {
  const username = getCurrentUsername();
  if (!username) {
    console.warn("No current user. ChatManager will not be initialized.");
    return;
  }
  console.log("Chat manager: ", chatManager);
  if (!chatManager || chatManager === null || chatManager.chatService === null || chatManager.currentUserId != username) {
    console.log("Initializing ChatManager...", chatManager);
    chatManager = new ChatComponent("chat-root", []);
    chatManager.chatService.conn.onmessage = async (e: MessageEvent) => {
      const message: IncomingMessage = JSON.parse(e.data);
      console.log("INCOMING MSG: ", message);
      if (message?.event === "private/message") {
        // Check if the message is from the current user
        if (message.senderId === chatManager.currentUserId) {
          console.log("message from myself");
          // Only update the chat if it is open
          console.log("open chats: ", chatManager.openChats);
          console.log("Recipient id: ", message.recipientId);
          if (chatManager.openChats.has(message.recipientId)) {
            console.log(`Chat from ${message.recipientId} open`);
            let temp = chatManager.messages.get(message.recipientId) || [];
            temp.push(message);
            chatManager.messages.set(message.recipientId, temp);
            chatManager.updateChatMessages(message.recipientId);
          }
        } else {
          // For messages from others, update the chat and create notifications
          let temp = chatManager.messages.get(message.senderId) || [];
          temp.push(message);
          chatManager.messages.set(message.senderId, temp);
          chatManager.updateChatMessages(message.senderId);
        }
      } else if (message.event === "notification/new") {
        if (message.senderId === username) {
          console.log("Handling notification for myself:", message);

          // Update the friendshipStatusCache for the current user
          if (message?.type === "FRIEND_REQUEST") {
            updateFriendshipStatusCache(message.recipientId, FriendshipStatus.PENDING, undefined);
          } else if (message?.type === "FRIEND_REQUEST_ACCEPTED") {
            notificationService.removeFriendRequest(message.recipientId);
            updateFriendshipStatusCache(message.recipientId, FriendshipStatus.ACCEPTED, undefined);
          } else if (message?.type === "FRIEND_REQUEST_DECLINED") {
            notificationService.removeFriendRequest(message.recipientId);
            updateFriendshipStatusCache(message.recipientId, FriendshipStatus.DECLINED, undefined);
          } else if (message?.type === "FRIEND_BLOCKED") {
            notificationService.removeFriendRequest(message.senderId);
            const chatManager = getChatManager();
            chatManager.closeChat(username);
            notificationService.removeFriendRequest(username);
            notificationService.updateMessageNotifications(username, 0, "set");
            updateFriendshipStatusCache(message.recipientId, FriendshipStatus.BLOCKED, username);
          } else if (message?.type === "FRIEND_UNBLOCKED") {
            updateFriendshipStatusCache(message.recipientId, FriendshipStatus.DECLINED, undefined);
          }

          // Trigger UI updates for the current user
          notificationService.triggerUpdate();
          return; // Exit early since this is for the current user
        }
        if (message?.type === "FRIEND_REQUEST") {
          const avatar = await getUserAvatar(message.senderId);
          updateFriendshipStatusCache(message.senderId, FriendshipStatus.PENDING, undefined);
          notificationService.addFriendRequest({ requesterUsername: message.senderId, avatar, id: message.friendshipId });
        } else if (message?.type === "FRIEND_REQUEST_ACCEPTED") {
          updateFriendshipStatusCache(message.senderId, FriendshipStatus.ACCEPTED, undefined);
          notificationService.triggerUpdate();
        } else if (message?.type === "FRIEND_REQUEST_DECLINED") {
          updateFriendshipStatusCache(message.senderId, FriendshipStatus.DECLINED, undefined);
          notificationService.triggerUpdate();
        } else if (message?.type === "FRIEND_BLOCKED") {
          updateFriendshipStatusCache(message.senderId, FriendshipStatus.BLOCKED, message.senderId);
          chatManager.closeChat(message.senderId);
          chatManager.chatService.markConversationAsRead(message.senderId);
          notificationService.removeFriendRequest(message.senderId);
          notificationService.triggerUpdate();
        } else if (message?.type === "FRIEND_UNBLOCKED") {
          updateFriendshipStatusCache(message.senderId, FriendshipStatus.DECLINED, undefined);
          notificationService.triggerUpdate();
        }
      }
    }
  } else {
    console.warn("ChatManager is already initialized.");
  }
}

// Function to close all open modals
function closeAllModals() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    const modalElement = modal as HTMLElement;
    modalElement.style.display = "none";
  });
}

// set initial app layout
const navbarElement = document.getElementById("navbar");
const contentElement = document.getElementById("content");

// listen for browser back / forward navigation
window.addEventListener("popstate", () => {
  // Close any open modals before routing
  closeAllModals();
  router(contentElement);
});

window.addEventListener("storage", async (event) => {
  if (event.key === 'friendshipUpdate' && event.newValue) {
    const message = JSON.parse(event.newValue);
    console.log("Message from friendshipUpdate: ", message);
    if (message?.type === "FRIEND_REQUEST") {
      const avatar = await getUserAvatar(message.senderId);
      updateFriendshipStatusCache(message.senderId, FriendshipStatus.PENDING, undefined);
      notificationService.addFriendRequest({ requesterUsername: message.senderId, avatar, id: message.friendshipId });
    } else if (message?.type === "FRIEND_REQUEST_ACCEPTED") {
      updateFriendshipStatusCache(message.senderId, FriendshipStatus.ACCEPTED, undefined);
    } else if (message?.type === "FRIEND_REQUEST_DECLINED") {
      updateFriendshipStatusCache(message.senderId, FriendshipStatus.DECLINED, undefined);
    } else if (message?.type === "FRIEND_BLOCKED") {
      updateFriendshipStatusCache(message.senderId, FriendshipStatus.BLOCKED, message.senderId);
      chatManager.closeChat(message.senderId);
      chatManager.chatService.markConversationAsRead(message.senderId);
      notificationService.removeFriendRequest(message.senderId);
    } else if (message?.type === "FRIEND_UNBLOCKED") {
      updateFriendshipStatusCache(message.senderId, FriendshipStatus.DECLINED, undefined);
    }
    notificationService.triggerUpdate();
  }
  localStorage.removeItem("friendshipUpdate");
});

// listen for dom to be fully loaded
document.addEventListener("DOMContentLoaded", async () => {

  const currentPath = window.location.pathname;
  if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
    const token = window.localStorage.getItem("authToken");
    if (!token /* || !await refreshAccessToken() */) {
      alert("You are not authenticated. Please log in to continue.");
      navigateTo("/login", document.getElementById("content"));
      return;
    }
  }

  await renderNavbar(navbarElement); // render the navbar component
  initializeChatManager();
  // global click listener for navigation links (data-links)
  document.body.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const linkElement = target.closest("[data-link]") as HTMLElement;
    if (linkElement) {
      event.preventDefault(); // prevent default link behavior (full page reload)
      //event.stopPropagation(); // stop event bubbling

      // Close any open modals before navigating
      closeAllModals();

      const path = linkElement.getAttribute("href");
      if (path) {
        navigateTo(path, contentElement);
      }
    }
  });
  router(contentElement); // load home view on initial run
});
