// src/views/notifications.ts
import { FriendshipStatus, respondRequest } from "../services/friendship.service.js";
import { navigateTo } from "../router/router.js";
import { notificationService } from "../services/notifications.service.js";

export async function getNotificationsContent(): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.className = "notifications-modal w-full h-full flex flex-col";

  // Tabs
  const tabs = document.createElement("div");
  tabs.className = "tabs flex rounded-t-lg overflow-hidden";
  container.appendChild(tabs);

  const tabContents: HTMLElement[] = [];
  const tabLabels = ["Friend Requests", "Game Invites"];
  const tabCounts = [notificationService.getState().friendRequests.length, 0];

  tabLabels.forEach((label, index) => {
    const btn = document.createElement("button");
    btn.className = `tab-button flex-1 py-2 font-bold cursor-pointer ${index === 0
      ? "border-b-2 border-(--color-primary) text-(--color-secondary-light)"
      : "text-(--color-text-primary)"
      }`;
    btn.textContent = label;

    const badgeId = index === 0 ? "badge-FRIEND_REQUEST" : "badge-GAME_INVITE";
    if (tabCounts[index] > 0) {
      const badge = document.createElement("span");
      badge.textContent = tabCounts[index].toString();
      badge.className =
        "inline-flex items-center justify-center ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white";
      badge.id = badgeId;
      btn.appendChild(badge);
    }
    tabs.appendChild(btn);

    const content = document.createElement("div");
    content.className = "tab-content flex-1 p-4";
    content.style.display = index === 0 ? "block" : "none";
    tabContents.push(content);
    container.appendChild(content);

    btn.addEventListener("click", () => {
      tabContents.forEach((tab, i) => {
        tab.style.display = i === index ? "block" : "none";
      });
      tabs.querySelectorAll(".tab-button").forEach((b, i) => {
        b.classList.toggle("border-b-2", i === index);
        b.classList.toggle("border-(--color-primary)", i === index);
        b.classList.toggle("text-(--color-secondary-light)", i === index);
        b.classList.toggle("text-(--color-text-primary)", i !== index);
      });
    });
  });

  // Fill the first tab (friend requests)
  const ul = document.createElement("ul");
  tabContents[0].appendChild(ul);

  // Subscribe to notification updates
  notificationService.subscribe(() => {
    updateFriendRequestsUI(ul);
    updateTabBadge(0, notificationService.getState().friendRequests.length);
  });

  // Initial rendering of friend requests
  updateFriendRequestsUI(ul);

  // Fill the second tab (game invites)
  tabContents[1].innerHTML = `
    <div class="flex flex-col items-center my-30 justify-center py-8">
      <img src="/assets/icons/noGameInvite.gif" alt="No requests" class="w-20 h-20 mb-4 " />
      <span style="
        font-family: var(--font-poppins), monospace;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-primary-dark);
        margin-bottom: 0.5rem;
        letter-spacing: 1px;
        background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary-light) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 2px 8px rgba(0,0,0,0.08);
      ">
        No Game Invites
      </span>
    </div>
  `;
  return container;
}

function updateFriendRequestsUI(ul: HTMLElement) {
  const requests = notificationService.getState().friendRequests;

  ul.innerHTML = ""; // Clear existing content
  if (requests.length > 0) {
    requests.forEach((req) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center px-4 py-2 cursor-pointer hover:bg-(--color-primary)/30 rounded-xl";
      li.innerHTML = `
        <img src="${req.avatar}" class="w-8 h-8 object-cover rounded-full"
          onerror="this.onerror=null;this.src='assets/avatars/panda.png';"/>
        <span class="ml-5 text-(--color-secondary-light)">${req.requesterUsername}</span>
        <div class="flex gap-4 ml-auto justify-end">
          <button title="Accept" class="accept-btn material-symbols-outlined text-3xl text-(--color-secondary-light) hover:text-(--color-primary) cursor-pointer">check_circle</button>
          <button title="Reject" class="reject-btn material-symbols-outlined text-3xl text-(--color-secondary-light) hover:text-(--color-accent) cursor-pointer">cancel</button>
        </div>
      `;
      ul.appendChild(li);

      const acceptBtn = li.querySelector(".accept-btn") as HTMLButtonElement;
      const rejectBtn = li.querySelector(".reject-btn") as HTMLButtonElement;
      acceptBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await respondRequest(req.id, FriendshipStatus.ACCEPTED, req.requesterUsername);
        notificationService.updateFriendRequests(
          requests.filter((r) => r.id !== req.id)
        );
      });

      rejectBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await respondRequest(req.id, FriendshipStatus.DECLINED, req.requesterUsername);
        notificationService.updateFriendRequests(
          requests.filter((r) => r.id !== req.id)
        );
      });

      // Redirect to user profile on li click (excluding button clicks)
      li.addEventListener("click", (e) => {
        if (
          (e.target as HTMLElement).closest(".accept-btn") ||
          (e.target as HTMLElement).closest(".reject-btn")
        ) {
          return;
        }
        navigateTo(`/friend-profile?username=${encodeURIComponent(req.requesterUsername)}`, document.getElementById("content"));
      });
    });
  } else {
    ul.innerHTML = `
      <div class="flex flex-col my-30 items-center justify-center py-8">
        <img src="/assets/icons/noFriendRequest.gif" alt="No requests" class="w-20 h-20 mb-4 " />
        <span style="
          font-family: var(--font-poppins), monospace;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-primary-dark);
          margin-bottom: 0.5rem;
          letter-spacing: 1px;
          background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 8px rgba(0,0,0,0.08);
        ">
          No friend requests
        </span>
      </div>
    `;
  }
}

function updateTabBadge(tabIndex: number, count: number) {
  const badgeId = tabIndex === 0 ? "badge-FRIEND_REQUEST" : "badge-GAME_INVITE";
  const badge = document.getElementById(badgeId);
  if (badge) {
    badge.textContent = count > 0 ? count.toString() : "";
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }
}