import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUsername } from "../utils/jwtUtils.js";
import {
  getProfileByUsername,
  createProfile,
  getUserAvatar,
  CreateProfileRequest,
} from "../services/profileService.js";

export async function renderUserProfile(container: HTMLElement | null) {
  if (!container) return;

  // Get current user
  const username = getCurrentUsername();
  if (!username) {
    container.innerHTML = "<p>Please log in to view your profile.</p>";
    return;
  }

  // Load the HTML template
  container.innerHTML = await loadHtml("/html/userProfile.html");

  try {
    // Try to get existing profile
    const profile = await getProfileByUsername(username);
    populateProfileForm(profile);
    showProfileView();
  } catch (error: any) {
    if (
      error.message.includes("404") ||
      error.message.includes("Profile not found")
    ) {
      // Profile doesn't exist, show create form so user can create it
      showCreateForm();
    } else {
      console.error("Error loading profile:", error);
      container.innerHTML = `<p>Error loading profile: ${error.message}</p>`;
    }
  }

  // Set up event listeners
  setupEventListeners(username);
}

function showCreateForm() {
  const createForm = document.getElementById("create-profile-container");
  const profileView = document.getElementById("profile-view");

  if (createForm) createForm.classList.remove("hidden");
  if (profileView) profileView.classList.add("hidden");
}

function showProfileView() {
  const createForm = document.getElementById("create-profile-container");
  const profileView = document.getElementById("profile-view");

  if (createForm) createForm.classList.add("hidden");
  if (profileView) profileView.classList.remove("hidden");
}

function populateProfileForm(profile: any) {
  // Set avatar
  const avatarImg = document.getElementById(
    "profile-avatar",
  ) as HTMLImageElement;
  if (avatarImg) {
    avatarImg.src = getUserAvatar(profile.userUsername);
    avatarImg.onerror = () => {
      avatarImg.src = "/assets/avatars/panda.png"; // Default on panda
    };
  }

  // Populate profile fields
  const fields = [
    { id: "display-username", value: profile.userUsername },
    { id: "display-nickname", value: profile.nickName || "Not set" },
    { id: "display-firstname", value: profile.firstName || "Not set" },
    { id: "display-lastname", value: profile.lastName || "Not set" },
    { id: "display-bio", value: profile.bio || "No bio available" },
    { id: "display-gender", value: profile.gender || "Not set" },
    { id: "display-status", value: profile.status },
  ];

  fields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element) element.textContent = field.value;
  });
}

function setupEventListeners(username: string) {
  // Create profile form submission
  const createForm = document.getElementById(
    "create-profile-form",
  ) as HTMLFormElement;
  if (createForm) {
    createForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleCreateProfile(username);
    });
  }

  // Edit profile button (for future implementation)
  const editBtn = document.getElementById("edit-profile-btn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      // TODO: Implement profile edit
      // ...
      // ...
    });
  }

  // Change avatar button
  const changeAvatarBtn = document.getElementById("change-avatar-btn");
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener("click", () => {
      openAvatarModal();
    });
  }

  // Avatar modal event listeners
  setupAvatarModalEventListeners(username);
}

async function handleCreateProfile(username: string) {
  const form = document.getElementById(
    "create-profile-form",
  ) as HTMLFormElement;
  const formData = new FormData(form);

  const profileData: CreateProfileRequest = {
    nickName: (formData.get("nickName") as string) || undefined,
    firstName: (formData.get("firstName") as string) || undefined,
    lastName: (formData.get("lastName") as string) || undefined,
    bio: (formData.get("bio") as string) || undefined,
    gender: (formData.get("gender") as any) || undefined,
  };

  // Remove empty strings before sending
  Object.keys(profileData).forEach((key) => {
    if (profileData[key as keyof CreateProfileRequest] === "") {
      delete profileData[key as keyof CreateProfileRequest];
    }
  });

  try {
    const profile = await createProfile(username, profileData);
    console.log("Profile created successfully:", profile);

    // Show success message
    showSuccessMessage("Profile created successfully!");

    // Switch to profile view and populate with new data
    populateProfileForm(profile);
    showProfileView();
  } catch (error: any) {
    console.error("Error creating profile:", error);
    showErrorMessage(`Error creating profile: ${error.message}`);
  }
}

function showSuccessMessage(message: string) {
  const successDiv = document.getElementById("success-message");
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.classList.remove("hidden");
    setTimeout(() => successDiv.classList.add("hidden"), 3000);
  }
}

function showErrorMessage(message: string) {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
    setTimeout(() => errorDiv.classList.add("hidden"), 5000);
  }
}

// Avatar Modal Functions
let selectedAvatar: string | null = null;

function openAvatarModal() {
  const modal = document.getElementById("avatar-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    selectedAvatar = null;
    updateSaveButton();
  }
}

function closeAvatarModal() {
  const modal = document.getElementById("avatar-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    selectedAvatar = null;
    clearAvatarSelections();
  }
}

function clearAvatarSelections() {
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((option) => {
    option.classList.remove("border-(--color-primary)");
    option.classList.add("border-transparent");
  });
}

function updateSaveButton() {
  const saveBtn = document.getElementById(
    "save-avatar-btn",
  ) as HTMLButtonElement;
  if (saveBtn) {
    saveBtn.disabled = !selectedAvatar;
  }
}

function setupAvatarModalEventListeners(username: string) {
  // Preset avatar selection
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Clear previous selections
      clearAvatarSelections();

      // Select this avatar
      option.classList.remove("border-transparent");
      option.classList.add("border-(--color-primary)");

      const avatarName = option.getAttribute("data-avatar");
      if (avatarName) {
        selectedAvatar = avatarName;
        updateSaveButton();
      }
    });
  });

  // Cancel button
  const cancelBtn = document.getElementById("cancel-avatar-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeAvatarModal);
  }

  // Save button - just close modal for now
  const saveBtn = document.getElementById("save-avatar-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      showSuccessMessage("Avatar selection saved! (Placeholder - no backend)");
      closeAvatarModal();
    });
  }

  // Close modal when clicking outside
  const modal = document.getElementById("avatar-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeAvatarModal();
      }
    });
  }
}
