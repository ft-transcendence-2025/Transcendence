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

export let chatManager: any;

export function getChatManager(): ChatComponent {
  if (!chatManager) {
    console.log("Creating new ChatComponent instance...");
    initializeChatManager();
  } else {
    console.log("Reusing existing ChatComponent instance...");
  }
  return chatManager;
}

export async function initializeChatManager() {
  if (!getCurrentUsername()) {
    console.warn("No current user. ChatManager will not be initialized.");
    return;
  }
  if (!chatManager) {
    console.warn("ChatManager is not initialized. Initializing now...");
    chatManager = new ChatComponent("chat-root", []);
    chatManager.chatService.conn.onmessage = async (e: MessageEvent) => {
      const message: IncomingMessage = JSON.parse(e.data);
      console.log("INCOMING MSG: ", message);
      if (message?.event === "private/message") {
        let temp = chatManager.messages.get(message.senderId) || [];
        temp.push(message);
        chatManager.messages.set(message.senderId, temp);
        chatManager.updateChatMessages(message.senderId);
      } else if (message.event === "notification/new") {
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
          notificationService.updateMessageNotifications(message.senderId, 0, "set");
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
  initializeChatManager();
  router(contentElement); // load home view on initial run
});
