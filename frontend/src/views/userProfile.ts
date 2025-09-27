import { loadHtml } from "../utils/htmlLoader.js";
import { getCurrentUsername, getCurrentUser } from "../utils/userUtils.js";
import { getUserByUsername, updateUser } from "../services/userService.js";
import { generate2FA, enable2FA, disable2FA } from "../services/authService.js";
import {
  getProfileByUsername,
  createProfile,
  updateProfile,
  getUserAvatar,
  saveUserAvatar,
  getJungleAvatarFile,
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
    await populateProfileView(profile);
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

  // Set up all view event listeners
  setupEventListeners(username);
}

function showCreateForm() {
  const createForm = document.getElementById("fill-profile-container");
  const profileView = document.getElementById("profile-view");
  const titleElement = document.getElementById("fill-profile-title");
  const buttonElement = document.getElementById("save-profile-btn");

  if (titleElement) titleElement.textContent = "Create Your Profile";
  if (buttonElement) buttonElement.textContent = "Create Profile";

  // Clear form fields for create mode
  clearFormFields();

  // Clear current profile to ensure there are no leftovers from previous session
  currentProfile = null;

  // Hide 2FA toggle for new profiles
  hide2FAToggle();

  if (createForm) createForm.classList.remove("hidden");
  if (profileView) profileView.classList.add("hidden");
}

function clearFormFields() {
  const form = document.getElementById("fill-profile-form") as HTMLFormElement;
  if (form) {
    form.reset();
  }
}

async function showUpdateForm() {
  const updateForm = document.getElementById("fill-profile-container");
  const profileView = document.getElementById("profile-view");
  document.getElementById("fill-profile-title")!.textContent =
    "Update Your Profile";
  document.getElementById("save-profile-btn")!.textContent = "Update Profile";

  // Use stored profile data to populate form fields
  if (currentProfile) {
    await populateFormFields(currentProfile);
  }

  // Show 2FA toggle for existing profiles
  show2FAToggle();

  if (updateForm) updateForm.classList.remove("hidden");
  if (profileView) profileView.classList.add("hidden");
}

function show2FAToggle() {
  const twoFactorSection = document.getElementById("2fa-toggle-section");
  if (twoFactorSection) {
    twoFactorSection.classList.remove("hidden");
  }
}

function hide2FAToggle() {
  const twoFactorSection = document.getElementById("2fa-toggle-section");
  if (twoFactorSection) {
    twoFactorSection.classList.add("hidden");
  }
}

function showProfileView() {
  const fillForm = document.getElementById("fill-profile-container");
  const profileView = document.getElementById("profile-view");

  if (fillForm) fillForm.classList.add("hidden");
  if (profileView) profileView.classList.remove("hidden");
}

function setup2FAToggle() {
  const checkbox = document.getElementById(
    "update-two-factor-enabled",
  ) as HTMLInputElement;
  const toggleContainer = checkbox?.nextElementSibling as HTMLElement;

  if (toggleContainer && checkbox) {
    // Handle toggle clicks on the visual toggle
    toggleContainer.addEventListener("click", () => {
      checkbox.checked = !checkbox.checked;
      // Trigger change event for any listeners
      checkbox.dispatchEvent(new Event("change"));
    });
  }
}

async function populateProfileView(profile: any) {
  currentProfile = profile;

  // Set avatar
  const avatarImg = document.getElementById(
    "profile-avatar",
  ) as HTMLImageElement;
  if (avatarImg) {
    avatarImg.src = await getUserAvatar(profile.userUsername);
    avatarImg.onerror = () => {
      avatarImg.src = "/assets/avatars/panda.png"; // Default on panda
    };
  }

  // Get user data for 2FA status and email from backend
  let twoFAStatus = "Disabled";
  let currentEmail = "Not set";
  try {
    const userData = await getUserByUsername(profile.userUsername);
    twoFAStatus = userData.twoFactorEnabled ? "Enabled" : "Disabled";
    currentEmail = userData.email || "Not set";
  } catch (error) {
    console.error("Error fetching user data:", error);
  }

  // Populate profile display fields (including 2FA status and current email)
  const fields = [
    { id: "display-username", value: profile.userUsername },
    { id: "display-nickname", value: profile.nickName || "Not set" },
    { id: "display-firstname", value: profile.firstName || "Not set" },
    { id: "display-lastname", value: profile.lastName || "Not set" },
    { id: "display-bio", value: profile.bio || "No bio available" },
    { id: "display-gender", value: profile.gender || "Not set" },
    { id: "display-email", value: currentEmail },
    { id: "display-2fa-status", value: twoFAStatus },
  ];

  fields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element) element.textContent = field.value;
  });
}

async function populateFormFields(profile: any) {
  // Get current user data from backend to get the latest email
  let currentEmail = "";
  try {
    const userData = await getUserByUsername(profile.userUsername);
    currentEmail = userData.email || "";
  } catch (error) {
    console.error("Error fetching user email:", error);
    // Fallback to JWT token email if backend fails
    currentEmail = getCurrentUser()?.email || "";
  }

  // Populate form input fields for editing
  const formFields = [
    { name: "update-nick-name", value: profile.nickName || "" },
    { name: "update-email", value: currentEmail },
    { name: "update-first-name", value: profile.firstName || "" },
    { name: "update-last-name", value: profile.lastName || "" },
    { name: "update-bio", value: profile.bio || "" },
    { name: "update-gender", value: profile.gender || "" },
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

  // Set 2FA toggle based on current user status
  populateUser2FAStatus();
}

async function populateUser2FAStatus() {
  try {
    const username = getCurrentUsername();
    if (username) {
      const userData = await getUserByUsername(username);
      const twoFactorCheckbox = document.getElementById(
        "update-two-factor-enabled",
      ) as HTMLInputElement;
      if (twoFactorCheckbox) {
        twoFactorCheckbox.checked = userData.twoFactorEnabled || false;
      }
    }
  } catch (error) {
    console.error("Error fetching current user data:", error);
  }
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
    editBtn.addEventListener("click", async () => {
      await showUpdateForm();
    });
  }

  // Change avatar button
  const changeAvatarBtn = document.getElementById("change-avatar-btn");
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener("click", () => {
      openAvatarModal();
    });
  }

  // Setup 2FA toggle functionality
  setup2FAToggle();
}

async function handleCreateProfile(username: string) {
  const form = document.getElementById("fill-profile-form") as HTMLFormElement;
  const formData = new FormData(form);

  // Extract email separately because it will go to a different endpoint
  const email = (formData.get("update-email") as string) || "";
  
  const profileData: CreateProfileRequest = {
    nickName: (formData.get("update-nick-name") as string) || undefined,
    firstName: (formData.get("update-first-name") as string) || undefined,
    lastName: (formData.get("update-last-name") as string) || undefined,
    bio: (formData.get("update-bio") as string) || undefined,
    gender: (formData.get("update-gender") as any) || undefined,
  };

  // Remove empty strings before sending
  Object.keys(profileData).forEach((key) => {
    if (profileData[key as keyof CreateProfileRequest] === "") {
      delete profileData[key as keyof CreateProfileRequest];
    }
  });

  try {
    // Update email first (if provided and different from current)
    const backendUserData = await getUserByUsername(username);
    if (email && email.trim() !== "" && email !== backendUserData.email) {
      await updateUser(username, { email: email.trim() });
    }

    const profile = await createProfile(username, profileData);
    showSuccessMessage("Profile created successfully!");

    // Switch to profile view and populate with new data
    await populateProfileView(profile);
    showProfileView();
  } catch (error: any) {
    showErrorMessage(`Error creating profile: ${error.message}`);
  }
}

async function handle2FASetup() {
  try {
    const { qr } = await generate2FA();
    // Show QR code modal - the modal will handle the rest
    showQRCodeModal(qr);
  } catch (error: any) {
    alert(`Error setting up 2FA: ${error.message}`);
    throw error;
  }
}

async function handleUpdateProfile(username: string) {
  const form = document.getElementById("fill-profile-form") as HTMLFormElement;
  const formData = new FormData(form);

  // Extract email separately because it will go to a different endpoint
  const email = (formData.get("update-email") as string) || "";

  const profileData: Partial<CreateProfileRequest> = {
    nickName: (formData.get("update-nick-name") as string) || undefined,
    firstName: (formData.get("update-first-name") as string) || undefined,
    lastName: (formData.get("update-last-name") as string) || undefined,
    bio: (formData.get("update-bio") as string) || undefined,
    gender: (formData.get("update-gender") as any) || undefined,
  };

  // Remove empty strings before sending
  Object.keys(profileData).forEach((key) => {
    if (profileData[key as keyof CreateProfileRequest] === "") {
      delete profileData[key as keyof CreateProfileRequest];
    }
  });

  try {
    // Handle email update first (if provided and different from current)
    const backendUserData = await getUserByUsername(username);

    if (email && email.trim() !== "" && email !== backendUserData.email) {
      await updateUser(username, { email: email.trim() });
    }

    // Handle 2FA changes
    const twoFactorCheckbox = document.getElementById(
      "update-two-factor-enabled",
    ) as HTMLInputElement;
    const currentUserData = await getUserByUsername(username);
    const new2FAStatus = twoFactorCheckbox?.checked || false;

    if (new2FAStatus !== currentUserData.twoFactorEnabled) {
      if (new2FAStatus) {
        await handle2FASetup();
        // The success message will be shown by the modal when 2FA is confirmed
      } else {
        // User wants to disable 2FA
        const disableConfirm = window.confirm(
          "Are you sure you want to disable Two-Factor Authentication?",
        );
        if (disableConfirm) {
          await disable2FA();
          showSuccessMessage(
            "Two-Factor Authentication disabled successfully!",
          );
        } else {
          // User cancelled, check the box
          if (twoFactorCheckbox) twoFactorCheckbox.checked = true;
          return;
        }
      }
    }

    const profile = await updateProfile(username, profileData);
    showSuccessMessage("Profile updated successfully!");

    // Fetch the updated profile
    const updatedProfile = await getProfileByUsername(username);

    await populateProfileView(updatedProfile);
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

// Avatar options: default options or custom file
let selectedAvatar: string | null = null;
let customAvatarFile: File | null = null;

// Avatar Modal Functions

function openAvatarModal() {
  const modal = document.getElementById("avatar-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    selectedAvatar = null;
    customAvatarFile = null;
    updateSaveButton();
  }

  // Setup event listeners when modal is opened
  const username = getCurrentUsername();
  if (username) {
    setupAvatarModalEventListeners(username);
  }
}

function closeAvatarModal() {
  const modal = document.getElementById("avatar-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    selectedAvatar = null;
    customAvatarFile = null;
    clearAvatarSelections();
    clearCustomFileInput();
  }
}

function clearAvatarSelections() {
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((option) => {
    option.classList.remove("border-(--color-primary)");
    option.classList.add("border-transparent");
  });
}

function clearCustomFileInput() {
  const fileInput = document.getElementById(
    "custom-avatar-upload",
  ) as HTMLInputElement;
  if (fileInput) {
    fileInput.value = "";
  }
}

function updateSaveButton() {
  const saveBtn = document.getElementById(
    "save-avatar-btn",
  ) as HTMLButtonElement;
  if (saveBtn) {
    saveBtn.disabled = !(selectedAvatar || customAvatarFile);
  }
}

// Change user avatar to selected jungle avatar or custom file
async function changeAvatar(username: string) {
  try {
    // Show loading state
    const saveBtn = document.getElementById(
      "save-avatar-btn",
    ) as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }

    let avatarFile: File;

    if (customAvatarFile) {
      // Use custom uploaded file
      avatarFile = customAvatarFile;
    } else if (selectedAvatar) {
      // Convert selected jungle avatar to File object
      avatarFile = await getJungleAvatarFile(selectedAvatar);
    } else {
      throw new Error("No avatar selected");
    }

    // Save avatar to backend
    await saveUserAvatar(username, avatarFile);

    // Update the profile avatar image in the UI
    const avatarImg = document.getElementById(
      "profile-avatar",
    ) as HTMLImageElement;
    if (avatarImg) {
      avatarImg.src = await getUserAvatar(username);
    }

    showSuccessMessage("Avatar updated successfully!");
    closeAvatarModal();
  } catch (error: any) {
    alert(`Error updating avatar: ${error.message}`);
  } finally {
    // Reset save button
    const saveBtn = document.getElementById(
      "save-avatar-btn",
    ) as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Avatar";
    }
  }
}

function setupAvatarModalEventListeners(username: string) {
  // Preset avatar selection
  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Clear previous selections
      clearAvatarSelections();
      clearCustomFileInput();
      customAvatarFile = null;

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

  // Custom file upload
  const fileInput = document.getElementById(
    "custom-avatar-upload",
  ) as HTMLInputElement;
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert("Please select a valid image file");
          target.value = "";
          return;
        }

        // Validate file size (limit to 2MB)
        if (file.size > 2 * 1024 * 1024) {
          alert("Image file must be smaller than 2MB");
          target.value = "";
          return;
        }

        // Clear preset avatar selection
        clearAvatarSelections();
        selectedAvatar = null;

        // Set custom file
        customAvatarFile = file;
        updateSaveButton();
      } else {
        customAvatarFile = null;
        updateSaveButton();
      }
    });
  }

  // Cancel button
  const cancelBtn = document.getElementById("cancel-avatar-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeAvatarModal);
  }

  // Save button - implement avatar change
  const saveBtn = document.getElementById("save-avatar-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      if (selectedAvatar || customAvatarFile) {
        await changeAvatar(username);
      }
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

// QR Code Modal Functions

function showQRCodeModal(qrCode: string) {
  const modal = document.getElementById("profile-2fa-modal");
  const qrImage = document.getElementById(
    "profile-2fa-qr-code",
  ) as HTMLImageElement;
  const tokenInput = document.getElementById(
    "profile-2fa-token",
  ) as HTMLInputElement;

  if (modal && qrImage && tokenInput) {
    // Set QR code image
    qrImage.src = qrCode;

    // Clear previous input
    tokenInput.value = "";

    // Show modal
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  // QR Code modal event listeners
  setupQRCodeModalEventListeners();
}

function closeQRCodeModal() {
  const modal = document.getElementById("profile-2fa-modal");
  const tokenInput = document.getElementById(
    "profile-2fa-token",
  ) as HTMLInputElement;

  if (modal && tokenInput) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    tokenInput.value = "";
  }
}

async function confirm2FASetup() {
  const tokenInput = document.getElementById(
    "profile-2fa-token",
  ) as HTMLInputElement;

  if (!tokenInput) return;

  const token = tokenInput.value.trim();

  if (token.length !== 6 || !/^\d{6}$/.test(token)) {
    alert("Please enter a valid 6-digit code");
    return;
  }

  try {
    await enable2FA(token);
    showSuccessMessage("Two-Factor Authentication enabled successfully!");

    closeQRCodeModal();
    // Refresh profile view to show updated 2FA status
    const username = getCurrentUsername();
    if (username) {
      const updatedProfile = await getProfileByUsername(username);
      await populateProfileView(updatedProfile);
      showProfileView();
    }
  } catch (error: any) {
    alert(`${error.message}`);
  }
}

function setupQRCodeModalEventListeners() {
  // Cancel button
  const cancelBtn = document.getElementById("profile-2fa-cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeQRCodeModal);
  }

  // Enable 2FA button
  const enableBtn = document.getElementById("profile-2fa-enable-btn");
  if (enableBtn) {
    enableBtn.addEventListener("click", confirm2FASetup);
  }

  // Submit 2FA on Enter key
  const tokenInput = document.getElementById(
    "profile-2fa-token",
  ) as HTMLInputElement;
  if (tokenInput) {
    tokenInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirm2FASetup();
      }
    });
  }

  // Close modal when clicking outside
  const modal = document.getElementById("profile-2fa-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeQRCodeModal();
      }
    });
  }
}
