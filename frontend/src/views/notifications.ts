// src/views/notifications.ts
import { FriendshipStatus, getPendingRequests, respondRequest } from "../services/friendship.service.js";
import { getUserAvatar } from "../utils/userUtils.js";

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
  ["Friend Requests", "Game Invites"].forEach((label, index) => {
    const btn = document.createElement("button");
    btn.className = `tab-button flex-1 py-2 font-bold ${index === 0
        ? "border-b-2 border-(--color-primary) text-(--color-primary-dark)"
        : "text-(--color-text-primary)"
      }`;
    btn.textContent = label;
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
        b.classList.toggle("text-(--color-primary-dark)", i === index);
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
      <span class="ml-5">${req.requesterUsername}</span>
      <div class="ml-3 flex gap-4 ml-auto justify-end">
        <button title="Accept" class="accept-btn material-symbols-outlined text-3xl hover:text-(--color-primary)">check_circle</button>
        <button title="Reject" class="reject-btn material-symbols-outlined text-3xl hover:text-(--color-accent)">cancel</button>
      </div>
      `;
      ul.appendChild(li);

      const acceptBtn = li.querySelector(".accept-btn") as HTMLButtonElement;
      const rejectBtn = li.querySelector(".reject-btn") as HTMLButtonElement;

      acceptBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await respondRequest(req.id, FriendshipStatus.ACCEPTED);
        li.remove();
      });

      rejectBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await respondRequest(req.id, FriendshipStatus.DECLINED);
        li.remove();
      });
    });
  } else {
    ul.innerHTML = "<p>No friend requests.</p>";
  }
  tabContents[0].appendChild(ul);

  // Fill second tab
  tabContents[1].innerHTML = "<p>Lika eh a melhor!</p>";

  return container;
}
