import { renderNavbar } from "./components/navbar.js";
import { IncomingMessage, PrivateMessageResponse } from "./interfaces/message.interfaces.js";
import { router, navigateTo } from "./router/router.js";
import chatService from "./services/chat.service.js";
import { refreshAccessToken } from "./utils/api.js";
import { ChatComponent } from "./views/chat.js";

export let chatManager = new ChatComponent("chat-root", []);

export function reloadChatManager() {
  chatManager = new ChatComponent("chat-root", []);
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
    if (!token || !await refreshAccessToken()) {
      alert("You are not authenticated. Please log in to continue.");
      navigateTo("/login", document.getElementById("content"));
      return;
    }
  }

  const notifications = await chatManager.chatService.fetchUnreadNotifications() as any[];
  chatManager.storeNotifications(notifications);

  if (chatManager.chatService.conn) {
    chatManager.chatService.conn.onmessage = (e: MessageEvent) => {
      const message: IncomingMessage = JSON.parse(e.data);
      console.log("Received message:", message);
      if (message.event === "private/message") {
        let temp = chatManager.messages.get(message.senderId) || [];
        temp.push(message);
        chatManager.messages.set(message.senderId, temp);
        chatManager.updateChatMessages(message.senderId);
      } else if (message.event === "notification/new") {
        chatManager.storeNotifications([message]);
      }
    };
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

  router(contentElement); // load home view on initial run
});
