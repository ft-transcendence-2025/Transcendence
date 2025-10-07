import { renderNavbar } from "./components/navbar.js";
import { IncomingMessage, PrivateMessageResponse } from "./interfaces/message.interfaces.js";
import { router, navigateTo } from "./router/router.js";
import chatService from "./services/chat.service.js";
import { FriendshipStatus } from "./services/friendship.service.js";
import { notificationService } from "./services/notifications.service.js";
import { getUserAvatar } from "./services/profileService.js";
import { refreshAccessToken } from "./utils/api.js";
import { getCurrentUsername, getUserNickname } from "./utils/userUtils.js";
import { ChatComponent } from "./views/chat.js";
import { handleIncomingMessage, handleNotificationMessage, handlePrivateMessage } from "./views/notificationsHandler.js";
import { updateFriendshipStatusCache } from "./views/profile.js";

export let chatManager: any | undefined;

export function getChatManager(): ChatComponent {
  if (!chatManager || !chatManager.chatService.conn ) {
    initializeChatManager();
  }
  return chatManager;
}

export async function initializeChatManager() {
  const username = getCurrentUsername();
  if (!username) {
    console.warn("No current user. ChatManager will not be initialized.");
    return;
  }
  if (!chatManager || chatManager.chatService === null || chatManager.currentUserId != username) {
    chatManager = new ChatComponent("chat-root", []);
    chatManager.chatService.conn.onmessage = async (e: MessageEvent) => {
      handleIncomingMessage(e);
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
