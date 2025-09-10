let currentTrigger: HTMLElement | null = null;

export function openModal(content: HTMLElement, trigger: HTMLElement) {
  const modal = document.getElementById("app-modal");

  // If the modal is already open and the same button is clicked, close it
  if (modal && currentTrigger === trigger) {
    closeModal();
    currentTrigger = null;
    return;
  }

  // If the modal is already open but a different button is clicked, update the content
  if (modal) {
    const modalContent = modal.querySelector("div.modal-content");
    if (modalContent) {
      modalContent.innerHTML = ""; // Clear existing content
      // const closeButton = createCloseButton();
      // modalContent.appendChild(closeButton);
      modalContent.appendChild(content);
    }
    currentTrigger = trigger;
    return;
  }

  // Otherwise, create a new modal
  closeModal(); // Close any existing modal

  const newModal = document.createElement("div");
  newModal.id = "app-modal";
  newModal.className =
    "absolute inset-0 w-full bg-black/50 z-40 flex justify-end items-end"; // Full-screen background, align to right and top
  const nav = document.querySelector("nav");
  if (nav) {
    const navHeight = nav.offsetHeight;
    newModal.style.top = `${navHeight}px`; // Position modal below the navbar
  }

  // Close modal when clicking outside the content
  newModal.addEventListener("click", (event) => {
    if (event.target === newModal) {
      closeModal();
    }
  });

  const modalContent = document.createElement("div");
  modalContent.className =
    "modal-content bg-[var(--color-primary-darker)]/45 backdrop-blur-sm rounded-lg shadow-lg p-6 relative w-full max-w-sm h-full"; // Full height, constrained width

  // const closeButton = createCloseButton();
  // modalContent.appendChild(closeButton);
  modalContent.appendChild(content);
  newModal.appendChild(modalContent);
  document.body.appendChild(newModal);

  currentTrigger = trigger;
}

export function closeModal() {
  const modal = document.getElementById("app-modal");
  if (modal) modal.remove();
  currentTrigger = null;
}

// function createCloseButton(): HTMLElement {
//   const closeButton = document.createElement("button");
//   closeButton.className =
//     "absolute top-2 right-2 text-gray-500 hover:text-gray-700";
//   closeButton.innerHTML = "&times;";
//   closeButton.addEventListener("click", closeModal);
//   return closeButton;
// }