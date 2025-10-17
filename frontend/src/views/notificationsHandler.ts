import { IncomingMessage } from "../interfaces/message.interfaces.js";
import { getUserAvatar } from "../services/profileService.js";
import { notificationService } from "../services/notifications.service.js";
import { updateFriendshipStatusCache } from "../views/profile.js";
import { FriendshipStatus } from "../services/friendship.service.js";
import { getChatManager } from "../app.js";
import { getCurrentUsername } from "../utils/userUtils.js";
import { toast } from "../utils/toast.js";
import { navigateTo } from "../router/router.js";

// Function to handle incoming WebSocket messages
export async function handleIncomingMessage(event: MessageEvent) {
	const message: IncomingMessage = JSON.parse(event.data);
	// console.log("INCOMING MSG: ", message);

	if (message.event === "private/message") {
		await handlePrivateMessage(message);
	} else if (message.event === "notification/new") {
		await handleNotificationMessage(message);
	}
}

// Function to handle private messagese
export async function handlePrivateMessage(message: IncomingMessage) {
	const chatManager = getChatManager()
	if (message.senderId === chatManager.currentUserId) {
		updateChatForRecipient(message.recipientId, message);
	} else {
		updateChatForSender(message.senderId, message);
	}
}

// Function to update chat for the recipient
function updateChatForRecipient(recipientId: string, message: IncomingMessage) {
	const chatManager = getChatManager();
	if (chatManager.openChats.has(recipientId)) {
		const messages = chatManager.messages.get(recipientId) || [];
		messages.push(message);
		chatManager.messages.set(recipientId, messages);
		chatManager.updateChatMessages(recipientId);
	}
}

// Function to update chat for the sender
function updateChatForSender(senderId: string, message: IncomingMessage) {
	const chatManager = getChatManager();
	const messages = chatManager.messages.get(senderId) || [];
	messages.push(message);
	chatManager.messages.set(senderId, messages);
	chatManager.updateChatMessages(senderId);
}

// Handle notification messages
export async function handleNotificationMessage(message: IncomingMessage) {
	const username = getCurrentUsername();
	if (message.senderId === username) {
		await handleSelfNotification(message);
	} else {
		await handleOtherUserNotification(message);
	}
}

// Handle notifications for the current user
export async function handleSelfNotification(message: IncomingMessage) {
	switch (message.type) {
		case "FRIEND_REQUEST":
			updateFriendshipStatusCache(message.recipientId, FriendshipStatus.PENDING, undefined);
			break;
		case "FRIEND_REQUEST_ACCEPTED":
			notificationService.removeFriendRequest(message.recipientId);
			updateFriendshipStatusCache(message.recipientId, FriendshipStatus.ACCEPTED, undefined);
			break;
		case "FRIEND_REQUEST_DECLINED":
			notificationService.removeFriendRequest(message.recipientId);
			updateFriendshipStatusCache(message.recipientId, FriendshipStatus.DECLINED, undefined);
			break;
		case "FRIEND_BLOCKED":
			handleFriendBlocked(message);
			break;
		case "FRIEND_UNBLOCKED":
			updateFriendshipStatusCache(message.recipientId, FriendshipStatus.DECLINED, undefined);
			break;
		case "GAME_INVITE_ACCEPTED":
			notificationService.removeGameInvite(message.recipientId);
			// Clear from sent invites tracking so user can send new invite later
			const chatManagerAccept = getChatManager();
			if (chatManagerAccept) {
				chatManagerAccept.clearSentGameInvite(message.recipientId);
			}
			toast.success(`${message.recipientId} accepted your game invite!`);
			break;
		case "GAME_INVITE_DECLINED":
			notificationService.removeGameInvite(message.recipientId);
			// Clear from sent invites tracking
			const chatManager2 = getChatManager();
			if (chatManager2) {
				chatManager2.clearSentGameInvite(message.recipientId);
			}
			toast.info(`${message.recipientId} declined your game invite.`);
			
			// If sender is on the pong page waiting, navigate them back to dashboard
			if (window.location.pathname.startsWith('/pong')) {
				setTimeout(() => {
					navigateTo('/dashboard', document.getElementById('content'));
				}, 500);
			}
			break;
		case "GAME_INVITE_CANCELLED":
			notificationService.removeGameInvite(message.recipientId);
			const chatManagerCancelSelf = getChatManager();
			if (chatManagerCancelSelf) {
				chatManagerCancelSelf.clearSentGameInvite(message.recipientId);
			}
			break;
	}
	notificationService.triggerUpdate();
}

// Handle "FRIEND_BLOCKED" notifications for the current user
function handleFriendBlocked(message: IncomingMessage) {
	notificationService.removeFriendRequest(message.recipientId);
	const chatManager = getChatManager();
	chatManager.closeChat(message.recipientId);
	notificationService.updateMessageNotifications(message.senderId, 0, "set");
	updateFriendshipStatusCache(message.recipientId, FriendshipStatus.BLOCKED, message.senderId);
}

// Handle notifications for other users
export async function handleOtherUserNotification(message: IncomingMessage) {
	switch (message.type) {
		case "FRIEND_REQUEST":
			const avatar = await getUserAvatar(message.senderId);
			updateFriendshipStatusCache(message.senderId, FriendshipStatus.PENDING, undefined);
			notificationService.addFriendRequest({
				requesterUsername: message.senderId,
				avatar,
				id: message.friendshipId,
			});
			break;
		case "FRIEND_REQUEST_ACCEPTED":
			updateFriendshipStatusCache(message.senderId, FriendshipStatus.ACCEPTED, undefined);
			break;
		case "FRIEND_REQUEST_DECLINED":
			updateFriendshipStatusCache(message.senderId, FriendshipStatus.DECLINED, undefined);
			break;
		case "FRIEND_BLOCKED":
			handleOtherUserBlocked(message);
			break;
		case "FRIEND_UNBLOCKED":
			updateFriendshipStatusCache(message.senderId, FriendshipStatus.DECLINED, undefined);
			break;
		case "GAME_INVITE":
			const senderAvatar = await getUserAvatar(message.senderId);
			notificationService.addGameInvite({
				senderUsername: message.senderId,
				avatar: senderAvatar,
				id: `${message.senderId}-${message.ts}`,
				ts: message.ts,
				gameId: parseInt(message.content, 10)
			});
			break;
		case "GAME_INVITE_ACCEPTED":
			// Clear from sent invites tracking so user can send new invite later
			const chatManagerAccept = getChatManager();
			if (chatManagerAccept) {
				chatManagerAccept.clearSentGameInvite(message.senderId);
			}
			toast.success(`${message.senderId} accepted your game invite!`);
			break;
		case "GAME_INVITE_DECLINED":
			// Clear from sent invites tracking so user can send new invite later
			const chatManagerDecline = getChatManager();
			if (chatManagerDecline) {
				chatManagerDecline.clearSentGameInvite(message.senderId);
			}
			toast.info(`${message.senderId} declined your game invite.`);
			navigateTo('/dashboard', document.getElementById('content'));
			break;
		case "GAME_INVITE_CANCELLED":
			notificationService.removeGameInvite(message.senderId);
			toast.info(`${message.senderId} cancelled the game invite.`);
			break;
	}
	notificationService.triggerUpdate();
}

// Handle "FRIEND_BLOCKED" notifications for other users
function handleOtherUserBlocked(message: IncomingMessage) {
	updateFriendshipStatusCache(message.senderId, FriendshipStatus.BLOCKED, message.senderId);
	const chatManager = getChatManager();
	chatManager.closeChat(message.senderId);
	chatManager.chatService.markConversationAsRead(message.senderId);
	notificationService.removeFriendRequest(message.senderId);
}