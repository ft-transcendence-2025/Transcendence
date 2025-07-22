import { navigateTo } from "../router/router.js";
import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUsername } from "../utils/jwtUtils.js";

export async function renderTournament(container: HTMLElement | null) {
  if (!container) return;

  // Fetch the component's HTML template
  container.innerHTML = await loadHtml("/html/tournament.html");

  // Get the current username and set it for player 1
  const currentUsername = getCurrentUsername();
  const player1Name = document.getElementById("player1-slot-name");

  if (player1Name) {
    player1Name.textContent = currentUsername || "GrizzlyCatch";
  }

  // Initialize avatar navigation
  initializeAvatars();
}

// Available avatars array
const avatars = [
  "bear.png",
  "cat.png",
  "chicken.png",
  "dog.png",
  "gorilla.png",
  "koala.png",
  "meerkat.png",
  "panda.png",
  "rabbit.png",
  "sloth.png",
];

const currentAvatarIndex: { [key: number]: number } = {};

function updateAvatar(slot: number, index: number): void {
  const img = document.getElementById(
    `avatar-preview-${slot}`,
  ) as HTMLImageElement;
  if (!img) return;

  currentAvatarIndex[slot] = index;
  img.src = `assets/avatars/${avatars[index]}`;
}

function previousAvatar(slot: number): void {
  let index = currentAvatarIndex[slot] ?? 0;
  index = (index - 1 + avatars.length) % avatars.length;
  updateAvatar(slot, index);
}

function nextAvatar(slot: number): void {
  let index = currentAvatarIndex[slot] ?? 0;
  index = (index + 1) % avatars.length;
  updateAvatar(slot, index);
}

// Optional: Initialize all slots to default avatar index
function initializeAvatars() {
  const slots = [1, 2, 3, 4, 5, 6, 7, 8];
  slots.forEach((slot) => updateAvatar(slot, slot - 1)); // Each slot gets sequential avatar

  // Add event listeners for navigation buttons (only for slots 2-8, slot 1 is static)
  for (let slot = 2; slot <= 8; slot++) {
    const avatarContainer = document.getElementById(
      `avatar-preview-${slot}`,
    )?.parentElement;
    if (avatarContainer) {
      const buttons = avatarContainer.querySelectorAll("button");
      const prevBtn = buttons[0]; // First button is previous
      const nextBtn = buttons[1]; // Second button is next

      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          previousAvatar(slot);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          nextAvatar(slot);
        });
      }
    }
  }
}
