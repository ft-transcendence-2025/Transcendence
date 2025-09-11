// src/views/notifications.ts
import { FriendshipStatus, getPendingRequests, respondRequest } from "../services/friendship.service.js";
import { getUserAvatar } from "../services/profileService.js";
import { navigateTo } from "../router/router.js";

export async function getNotificationsContent(): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.className = "notifications-modal w-full h-full flex flex-col";

  // Fetch all requests first
  let requests: { requesterUsername: string; avatar: string , id: string }[] = [];
  try {
    const raw = (await getPendingRequests()) as any[];
    requests = await Promise.all(
      raw.map(async (req) => ({
        requesterUsername: req.requesterUsername,
        avatar: await getUserAvatar(req.requesterUsername),
        id: req.id
      }))
    );
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
  }

  // Tabs
  const tabs = document.createElement("div");
  tabs.className = "tabs flex rounded-t-lg overflow-hidden";
  container.appendChild(tabs);

  const tabContents: HTMLElement[] = [];
  const tabLabels = ["Friend Requests", "Game Invites"];
  const tabCounts = [requests.length, 0]; // Example counts for badges

  tabLabels.forEach((label, index) => {
    const btn = document.createElement("button");
    btn.className = `tab-button flex-1 py-2 font-bold cursor-pointer ${index === 0
        ? "border-b-2 border-(--color-primary) text-(--color-secondary-light)"
        : "text-(--color-text-primary)"
      }`;
    btn.textContent = label; // Set label text
    // Add badge for count if > 0
    let badgeId = index === 0 ? "badge-FRIEND_REQUEST" : "badge-GAME_INVITE";
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

  // Fill first tab (friend requests)
  const ul = document.createElement("ul");
  if (requests.length > 0) {
    requests.forEach((req) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center px-4 py-2 cursor-pointer hover:bg-(--color-primary)/30 rounded-xl";
      li.innerHTML = `
      <img src="${req.avatar}" class="w-8 h-8 object-cover" 
        onerror="this.onerror=null;this.src='assets/avatars/panda.png';"/>
      <span class="ml-5 text-(--color-secondary-light)">${req.requesterUsername}</span>
      <div class="flex gap-4 ml-auto justify-end">
        <button title="Accept" class="accept-btn material-symbols-outlined text-3xl text-(--color-secondary-light) hover:text-(--color-primary)">check_circle</button>
        <button title="Reject" class="reject-btn material-symbols-outlined text-3xl text-(--color-secondary-light) hover:text-(--color-accent)">cancel</button>
      </div>
      `;
      ul.appendChild(li);

      const acceptBtn = li.querySelector(".accept-btn") as HTMLButtonElement;
      const rejectBtn = li.querySelector(".reject-btn") as HTMLButtonElement;
      acceptBtn.style.cursor = "pointer";
      rejectBtn.style.cursor = "pointer";
      acceptBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await respondRequest(req.id, FriendshipStatus.ACCEPTED);
        li.remove();

        requests = requests.filter((r) => r.id !== req.id);
        updateTabBadge(0, requests.length);
      });

      rejectBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await respondRequest(req.id, FriendshipStatus.DECLINED);
        li.remove();

        requests = requests.filter((r) => r.id !== req.id);
        updateTabBadge(0, requests.length);
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
      <div class="flex flex-col items-center justify-center py-8">
        <img src="/assets/icons/noFriendRequest.gif" alt="No requests" class="w-20 h-20 mb-4 opacity-90" />
        <span style="
          font-family: var(--font-poppins), monospace;
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--color-primary);
          text-shadow: 0 2px 2px var(--color-primary-light), 0 1px 0 var(--color-secondary-light);
          margin-bottom: 0.5rem;
          letter-spacing: 1px;
          -webkit-text-stroke: 1px var(--color-primary-dark);
        ">
          No friend requests
        </span>
        <span style="
          font-family: var(--font-poppins), sans-serif;
          font-size: 1rem;
          color: var(--color-secondary);
          margin-top: 0.25rem;
        ">
          You're all caught up! <span style="color: var(--color-accent);">✨</span>
        </span>
      </div>
    `;
  }
  tabContents[0].appendChild(ul);

  // Fill second tab
  tabContents[1].innerHTML = `
      <div class="flex flex-col items-center justify-center py-8">
        <img src="/assets/icons/noGameInvite.gif" alt="No requests" class="w-20 h-20 mb-4 opacity-90" />
        <span style="
          font-family: var(--font-poppins), monospace;
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--color-primary);
          text-shadow: 0 2px 2px var(--color-primary-light), 0 1px 0 var(--color-secondary-light);
          margin-bottom: 0.5rem;
          letter-spacing: 1px;
          -webkit-text-stroke: 1px var(--color-primary-dark);
        ">
          No Game Invites
        </span>
        <span style="
          font-family: var(--font-poppins), sans-serif;
          font-size: 1rem;
          color: var(--color-secondary);
          margin-top: 0.25rem;
        ">
          You're all caught up! <span style="color: var(--color-accent);">✨</span>
        </span>
      </div>
    `;

  return container;
}

function updateTabBadge(tabIndex: number, count: number) {
  const badge = document.getElementById(`tab-badge-${tabIndex}`);
  if (badge) {
    if (count > 0) {
      badge.textContent = count.toString();
      badge.style.display = "inline-flex"; // Ensure the badge is visible
      badge.classList.remove("hidden");
    } else {
      badge.textContent = ""; // Clear the badge text
      badge.style.display = "none"; // Hide the badge
      badge.classList.add("hidden");
    }
  }
}