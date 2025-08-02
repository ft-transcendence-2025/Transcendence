import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUsername } from "../utils/jwtUtils.js";
import {
  getProfileByUsername,
  createProfile,
  updateProfile,
  getUserAvatar,
  CreateProfileRequest,
} from "../services/profileService.js";

// Store profile data for reuse
let currentProfile: any = null;

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
    populateProfileView(profile);
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
  const createForm = document.getElementById("fill-profile-container");
  const profileView = document.getElementById("profile-view");
  document.getElementById("fill-profile-title")!.textContent =
    "Create Your Profile";
  document.getElementById("save-profile-btn")!.textContent = "Create Profile";

  // Clear form fields for create mode
  clearFormFields();

  if (createForm) createForm.classList.remove("hidden");
  if (profileView) profileView.classList.add("hidden");
}

function clearFormFields() {
  const form = document.getElementById("fill-profile-form") as HTMLFormElement;
  if (form) {
    form.reset();
  }
}

function showUpdateForm() {
  const updateForm = document.getElementById("fill-profile-container");
  const profileView = document.getElementById("profile-view");
  document.getElementById("fill-profile-title")!.textContent =
    "Update Your Profile";
  document.getElementById("save-profile-btn")!.textContent = "Update Profile";

  // Use stored profile data to populate form fields
  if (currentProfile) {
    populateFormFields(currentProfile);
  }

  if (updateForm) updateForm.classList.remove("hidden");
  if (profileView) profileView.classList.add("hidden");
}

function showProfileView() {
  const fillForm = document.getElementById("fill-profile-container");
  const profileView = document.getElementById("profile-view");

  if (fillForm) fillForm.classList.add("hidden");
  if (profileView) profileView.classList.remove("hidden");
}

function populateProfileView(profile: any) {
  currentProfile = profile; // Store for later use

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

  // Populate profile display fields
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

function populateFormFields(profile: any) {
  // Populate form input fields for editing
  const formFields = [
    { name: "nickName", value: profile.nickName || "" },
    { name: "firstName", value: profile.firstName || "" },
    { name: "lastName", value: profile.lastName || "" },
    { name: "bio", value: profile.bio || "" },
    { name: "gender", value: profile.gender || "" },
  ];

  formFields.forEach((field) => {
    const element = document.querySelector(`[name="${field.name}"]`) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    if (element) {
      element.value = field.value;
    }
  });
}

function setupEventListeners(username: string) {
  // Profile form submission (handles both create and update)
  const profileForm = document.getElementById(
    "fill-profile-form",
  ) as HTMLFormElement;
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Distinguish between create and update based on currentProfile
      if (currentProfile) {
        await handleUpdateProfile(username);
      } else {
        await handleCreateProfile(username);
      }
    });
  }

  // Edit profile button
  const editBtn = document.getElementById("edit-profile-btn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      showUpdateForm();
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
  const form = document.getElementById("fill-profile-form") as HTMLFormElement;
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
    populateProfileView(profile);
    showProfileView();
  } catch (error: any) {
    console.error("Error creating profile:", error);
    showErrorMessage(`Error creating profile: ${error.message}`);
  }
}

async function handleUpdateProfile(username: string) {
  const form = document.getElementById("fill-profile-form") as HTMLFormElement;
  const formData = new FormData(form);
  const profileData: Partial<CreateProfileRequest> = {
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
    const profile = await updateProfile(username, profileData);
    console.log("Profile updated successfully:", profile);

    // Show success message
    showSuccessMessage("Profile updated successfully!");

    // Fetch the updated profile to ensure we have complete data
    const updatedProfile = await getProfileByUsername(username);

    // Switch to profile view and populate with fresh data
    populateProfileView(updatedProfile);
    showProfileView();
  } catch (error: any) {
    console.error("Error updating profile:", error);
    showErrorMessage(`Error updating profile: ${error.message}`);
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
    setTimeout(() => errorDiv.classList.add("hidden"), 8000);
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
