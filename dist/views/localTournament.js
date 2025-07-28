import { loadHtml } from "../utils/htmlLoader.js";
// import { getCurrentUsername } from "../utils/jwtUtils.js";
export async function renderTournament(container) {
    if (!container)
        return;
    // Fetch the component's HTML template
    container.innerHTML = await loadHtml("/html/tournament.html");
    // Get the current username and set it for player 1
    /*  const currentUsername = getCurrentUsername();
    const player1Name = document.getElementById("player1-slot-name");
  
    if (player1Name) {
      player1Name.textContent = currentUsername || "GrizzlyCatch";
    } */
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
const currentAvatarIndex = {};
function updateAvatar(slot, index) {
    const img = document.getElementById(`avatar-preview-${slot}`);
    if (!img)
        return;
    currentAvatarIndex[slot] = index;
    img.src = `assets/avatars/${avatars[index]}`;
}
function previousAvatar(slot) {
    let index = currentAvatarIndex[slot] ?? 0;
    index = (index - 1 + avatars.length) % avatars.length;
    updateAvatar(slot, index);
}
function nextAvatar(slot) {
    let index = currentAvatarIndex[slot] ?? 0;
    index = (index + 1) % avatars.length;
    updateAvatar(slot, index);
}
// Optional: Initialize all slots to default avatar index
function initializeAvatars() {
    const slots = [1, 2, 3, 4];
    // Each slot gets fixed sequential avatar
    slots.forEach((slot) => updateAvatar(slot, slot - 1));
    // Add event listeners for navigation buttons
    for (let slot = 1; slot <= 4; slot++) {
        const avatarContainer = document.getElementById(`avatar-preview-${slot}`)?.parentElement;
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
