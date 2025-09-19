import { loadHtml } from "../utils/htmlLoader.js";
import {
	getProfileByUsername,
	getUserAvatar,
	saveUserAvatar,
	getJungleAvatarFile,
} from "../services/profileService.js";
import { UserBlockMessageResponse } from "../interfaces/message.interfaces.js";
import { Friend } from "../views/chat.js";
import { getChatManager } from "../app.js";
import { blockUser, FriendshipStatus, getFriendshipStatus, respondRequest, sendFriendRequest, unblockUser } from "../services/friendship.service.js";
import { getCurrentUser, getCurrentUsername } from "../utils/userUtils.js";
import { renderStats } from "./stats.js";
import { notificationService } from "../services/notifications.service.js";


let currentProfile: any = null;
let selectedAvatar: string | null = null;
let customAvatarFile: File | null = null;
const friendshipStatusCache = new Map<string, { status: FriendshipStatus; blockedBy?: string }>();

export async function renderProfile(container: HTMLElement | null) {
	if (!container) return;
	const params = new URLSearchParams(window.location.search);
	const username = params.get("username");

	if (!username) {
		container.innerHTML = "<p>User not found.</p>";
		return;
	}

	// Load the HTML template
	container.innerHTML = await loadHtml("/html/profile.html");

	try {
		const profile = await getProfileByUsername(username);
		populateProfileView(profile);
		showProfileView();
	} catch (error: any) {
		console.error("Error loading profile:", error);
		container.innerHTML = `<p>Error loading profile: ${error.message}</p>`;
	}

	setupEventListeners(username);

	notificationService.subscribe(() => {
		updateButtonStates(username);
	});

	renderStats(document.getElementById("content") as HTMLElement);
}

export function updateFriendshipStatusCache(username: string, status: FriendshipStatus, blockedBy?: string) {
	friendshipStatusCache.set(username, { status, blockedBy });
	updateButtonStates(username);
}

async function populateProfileView(profile: any) {
	currentProfile = profile;

	let loggedInUsername = getCurrentUser()?.username || null;

	const avatarImg = document.getElementById("user-avatar") as HTMLImageElement;
	if (avatarImg) {
		avatarImg.src = await getUserAvatar(profile.userUsername);
		avatarImg.onerror = () => {
			avatarImg.src = "/assets/avatars/panda.png";
		};
	}

	const createdAt = profile.createdAt ? new Date(profile.createdAt) : null;
	const now = new Date();
	const daysSinceCreated = createdAt ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : null;

	const fields = [
		{ id: "display-username", value: profile.userUsername },
		{ id: "display-nickname", value: profile.nickName || "Not set" },
		{ id: "display-firstname", value: profile.firstName || "Not set" },
		{ id: "display-lastname", value: profile.lastName || "Not set" },
		{ id: "display-bio", value: profile.bio || "No bio available" },
		{ id: "display-gender", value: profile.gender || "Not set" },
		{ id: "display-createdAt", value: `${daysSinceCreated !== null ? `${daysSinceCreated} days` : "0 days"}` },
	];

	fields.forEach((field) => {
		const element = document.getElementById(field.id);
		if (element) element.textContent = field.value;
	});

	const editProfileButton = document.getElementById("edit-profile-button");
	if (editProfileButton) {
		if (profile.userUsername === loggedInUsername) {
			editProfileButton.classList.remove("hidden");
		} else {
			editProfileButton.classList.add("hidden");
		}
	}
	updateButtonStates(profile.userUsername);
}

async function updateButtonStates(username: string) {
	const loggedInUsername = getCurrentUser()?.username || null;

	// Check the cache first
	let friendshipStatus: { status: FriendshipStatus; blockedBy?: string } | undefined = friendshipStatusCache.get(username);

	// If not in cache, fetch from the server
	if (!friendshipStatus) {
		friendshipStatus = await getFriendshipStatus(username) as { status: FriendshipStatus; blockedBy?: string };
		friendshipStatusCache.set(username, friendshipStatus); // Cache the result
	}

	// Update Add Friend Button
	const addFriendButton = document.getElementById("add-friend-button");
	if (addFriendButton) {
		if (
			username !== loggedInUsername && // Not the logged-in user's profile
			friendshipStatus.status !== "BLOCKED" && // No blocked relationship
			friendshipStatus.status !== "ACCEPTED" && // Not already friends
			friendshipStatus.status !== "PENDING" // No pending request
		) {
			addFriendButton.classList.add("bg-(--color-primary)", "text-green-900", "cursor-pointer", "hover:bg-(--color-primary-dark)");
			addFriendButton.classList.remove("hidden", "bg-gray-400", "text-gray-700", "cursor-not-allowed");
			addFriendButton.textContent = "Add Friend";
			(addFriendButton as HTMLButtonElement).disabled = false;
		} else if (friendshipStatus.status === "PENDING") {
			addFriendButton.classList.remove("hidden");
			addFriendButton.classList.add("bg-gray-400", "text-gray-700");
			addFriendButton.classList.remove("cursor-pointer", "hover:bg-(--color-primary-dark)");
			addFriendButton.classList.add("cursor-not-allowed");
			addFriendButton.textContent = "Request Pending";
			(addFriendButton as HTMLButtonElement).disabled = true;
		} else {
			addFriendButton.classList.add("hidden");
		}
	}

	// Update Block Button
	const blockButton = document.getElementById("block-button");
	if (blockButton) {
		if (username === loggedInUsername) {
			blockButton.classList.add("hidden");
			blockButton.style.display = "none";
		} else if (friendshipStatus.status === "BLOCKED" && friendshipStatus.blockedBy === loggedInUsername) {
			blockButton.textContent = "lock_open";
			blockButton.title = "Unblock User";
			blockButton.classList.remove("hidden");
			blockButton.style.display = "";
		} else if (
			friendshipStatus.status === "BLOCKED" &&
			friendshipStatus.blockedBy !== loggedInUsername
		) {
			blockButton.classList.add("hidden");
			blockButton.style.display = "none";
		} else {
			blockButton.textContent = "account_circle_off";
			blockButton.title = "Block User";
			blockButton.classList.remove("hidden");
			blockButton.style.display = "";
		}
	}
}

function showProfileView() {
	const fillForm = document.getElementById("fill-profile-container");
	const profileView = document.getElementById("profile-view");

	if (fillForm) fillForm.classList.add("hidden");
	if (profileView) profileView.classList.remove("hidden");
}

function setupEventListeners(username: string) {
	const friendshipStatus = friendshipStatusCache.get(username);
	const changeAvatarBtn = document.getElementById("change-avatar-btn");
	if (changeAvatarBtn) {
		changeAvatarBtn.addEventListener("click", () => {
			openAvatarModal();
		});
	}

	const blockUserBtn = document.getElementById("block-button");
	if (blockUserBtn) {
		blockUserBtn.addEventListener("click", async () => {
			try {
				// Wait for the block/unblock operation to complete
				const isUnblock = blockUserBtn.textContent === "lock_open";
				if (isUnblock) {
					await unblockUser(username); // Unblock the user
					sendBlockMessage(username);
					friendshipStatusCache.set(username, { status: FriendshipStatus.DECLINED });
				} else {
					await blockUser(username); // Block the user
					sendBlockMessage(username);
					const chatManager = getChatManager();
					chatManager.chatService.markConversationAsRead(username);
					chatManager.closeChat(username);
					notificationService.removeFriendRequest(username);
					notificationService.triggerUpdate();
					friendshipStatusCache.set(username, { status: FriendshipStatus.BLOCKED, blockedBy: getCurrentUsername() || undefined });
				}

				// Update the button states after the operation
				await updateButtonStates(username);
			} catch (error) {
				console.error("Error updating block state:", error);
			}
		});
	}
	const addFriendButton = document.getElementById("add-friend-button");
	if (addFriendButton) {
		addFriendButton.addEventListener("click", async () => {
			try {
				// Wait for the friend request operation to complete
				await sendFriendRequest(username);
				// Update the button states after the operation
				await updateButtonStates(username);
			} catch (error) {
				console.error("Error sending friend request:", error);
			}
		});
	}

	const editProfileBtn = document.getElementById("edit-profile-button");
	if (editProfileBtn) {
		editProfileBtn.addEventListener("click", () => {
			window.location.href = `/profile?username=${getCurrentUsername()}&edit=true`;
		});
	}

	function sendBlockMessage(blockedUsername: string) {
		const currentUser = getCurrentUser();
		if (!currentUser) return;

		const blockMessage: UserBlockMessageResponse = {
			kind: "user/block",
			recipientId: blockedUsername
		};
		const chatManager = getChatManager();
		chatManager.sendMessage(blockedUsername, blockMessage);

	}

	setupAvatarModalEventListeners(username);

	function openAvatarModal() {
		const modal = document.getElementById("avatar-modal");
		if (modal) {
			modal.classList.remove("hidden");
			modal.classList.add("flex");
			selectedAvatar = null;
			customAvatarFile = null;
			updateSaveButton();
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
		const fileInput = document.getElementById("custom-avatar-upload") as HTMLInputElement;
		if (fileInput) fileInput.value = "";
	}

	function updateSaveButton() {
		const saveBtn = document.getElementById("save-avatar-btn") as HTMLButtonElement;
		if (saveBtn) saveBtn.disabled = !(selectedAvatar || customAvatarFile);
	}

	async function changeAvatar(username: string) {
		try {
			const saveBtn = document.getElementById("save-avatar-btn") as HTMLButtonElement;
			if (saveBtn) {
				saveBtn.disabled = true;
				saveBtn.textContent = "Saving...";
			}

			let avatarFile: File;
			if (customAvatarFile) {
				avatarFile = customAvatarFile;
			} else if (selectedAvatar) {
				avatarFile = await getJungleAvatarFile(selectedAvatar);
			} else {
				throw new Error("No avatar selected");
			}

			await saveUserAvatar(username, avatarFile);

			const avatarImg = document.getElementById("profile-avatar") as HTMLImageElement;
			if (avatarImg) avatarImg.src = `${getUserAvatar(username)}?t=${Date.now()}`;

			closeAvatarModal();
		} catch (error: any) {
			console.error("Error changing avatar:", error);
		} finally {
			const saveBtn = document.getElementById("save-avatar-btn") as HTMLButtonElement;
			if (saveBtn) {
				saveBtn.disabled = false;
				saveBtn.textContent = "Save Avatar";
			}
		}
	}

	function setupAvatarModalEventListeners(username: string) {
		const avatarOptions = document.querySelectorAll(".avatar-option");
		avatarOptions.forEach((option) => {
			option.addEventListener("click", () => {
				clearAvatarSelections();
				clearCustomFileInput();
				customAvatarFile = null;

				option.classList.remove("border-transparent");
				option.classList.add("border-(--color-primary)");

				const avatarName = option.getAttribute("data-avatar");
				if (avatarName) {
					selectedAvatar = avatarName;
					updateSaveButton();
				}
			});
		});

		const fileInput = document.getElementById("custom-avatar-upload") as HTMLInputElement;
		if (fileInput) {
			fileInput.addEventListener("change", (e) => {
				const target = e.target as HTMLInputElement;
				const file = target.files?.[0];

				if (file) {
					if (!file.type.startsWith("image/")) {
						target.value = "";
						return;
					}
					if (file.size > 2 * 1024 * 1024) {
						target.value = "";
						return;
					}

					clearAvatarSelections();
					selectedAvatar = null;

					customAvatarFile = file;
					updateSaveButton();
				} else {
					customAvatarFile = null;
					updateSaveButton();
				}
			});
		}

		const cancelBtn = document.getElementById("cancel-avatar-btn");
		if (cancelBtn) cancelBtn.addEventListener("click", closeAvatarModal);

		const saveBtn = document.getElementById("save-avatar-btn");
		if (saveBtn) {
			saveBtn.addEventListener("click", async () => {
				if (selectedAvatar || customAvatarFile) {
					await changeAvatar(username);
				}
			});
		}

		const modal = document.getElementById("avatar-modal");
		if (modal) {
			modal.addEventListener("click", (e) => {
				if (e.target === modal) {
					closeAvatarModal();
				}
			});
		}
	}
}
