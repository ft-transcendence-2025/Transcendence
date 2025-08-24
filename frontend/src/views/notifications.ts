import { chatManager } from "../app";
import { getPendingRequests, getUserFriends } from "../services/friendship.service";
import { getUserAvatar } from "../utils/userUtils";
import { Friend } from "./chat";



// Returns the content for the notifications modal with tabs
export async function getNotificationsContent(requests: any[]): Promise<HTMLElement> {
  // Create the main container for the notifications modal
  const container = document.createElement("div");
  container.className = "notifications-modal w-full h-full flex flex-col";

  // Create the tabs navigation
  const tabs = document.createElement("div");
  tabs.className = "tabs flex rounded-t-lg overflow-hidden";

  const tabButtons = ["Friend Requests", "Game Invites"];
  const tabContents: HTMLElement[] = [];

  tabButtons.forEach((tabName, index) => {
    const tabButton = document.createElement("button");
    tabButton.className = `tab-button flex-1 py-2 font-bold text-(--color-text-primary) transition-colors cursor-pointer ${index === 0 ? "border-b-2 border-(--color-primary) text-(--color-primary-dark)" : ""
      }`;
    tabButton.innerHTML = tabName;

    tabButton.addEventListener("click", () => {
      // Switch tab content visibility
      tabContents.forEach((content, i) => {
        content.style.display = i === index ? "block" : "none";
      });

      tabs.querySelectorAll(".tab-button").forEach((btn, i) => {
        btn.classList.toggle("border-b-2", i === index);
        btn.classList.toggle("border-(--color-primary)", i === index);
        btn.classList.toggle("text-(--color-primary-dark)", i === index);
        btn.classList.toggle("text-(--color-text-primary)", i !== index);
      });
    });

    tabs.appendChild(tabButton);

    const tabContent = document.createElement("div");
    tabContent.className = "tab-content flex-1 p-4";
    tabContent.style.display = index === 0 ? "block" : "none";
    tabContents.push(tabContent);
  });

  // Add the tabs to the container
  container.appendChild(tabs);

  // Add the content containers below the tabs
  tabContents.forEach((tabContent) => {
    container.appendChild(tabContent);
  });

  // Add placeholder content for each tab
  tabContents[0].innerHTML = "<ul></ul>";
  try {
    const ul = tabContents[0].querySelector("ul");
    if (ul) {
      for (const request of requests) {
        const li = document.createElement("li");
        li.className =
          "flex items-center px-4 py-2 cursor-pointer hover:bg-(--color-primary)/30 rounded-xl";
        li.innerHTML = `
            <img src="${request.avatar}" class="w-8 h-8 object-cover" onerror="this.onerror=null;this.src='assets/avatars/panda.png';"/>
            <span class="ml-5">${request.requesterUsername}</span>
            <div class="ml-3 flex gap-2">
              <button class="accept-btn px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">Accept</button>
              <button class="reject-btn px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Reject</button>
            </div>
        `;
        ul.appendChild(li);
      }
    }
  } catch (error) {
    console.error("Failed to fetch friends:", error);
    container.innerHTML = "<p>Error loading friends list.</p>";
  }

  tabContents[1].innerHTML = "<p>Game Invites content goes here.</p>";

  return container;
}