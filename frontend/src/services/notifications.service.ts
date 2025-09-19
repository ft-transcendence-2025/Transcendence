import {  getChatManager } from "../app.js";
import { FriendshipStatus, getFriendshipStatus, getPendingRequests } from "./friendship.service.js";
import { getUserAvatar } from "./profileService.js";

type NotificationState = {
	friendRequests: { requesterUsername: string; avatar: string; id: string }[];
	messageNotifications: Map<string, number>;
	gameInvites: Map<string, number>;
	tournamentTurns: Map<string, number>;
};

class NotificationService {
	private state: NotificationState = {
		friendRequests: [],
		messageNotifications: new Map(),
		gameInvites: new Map(),
		tournamentTurns: new Map(),
	};

	private listeners: Set<() => void> = new Set();

	// Subscribe to state changes
	subscribe(listener: () => void) {
		this.listeners.add(listener);
	}

	// Unsubscribe from state changes
	unsubscribe(listener: () => void) {
		this.listeners.delete(listener);
	}

	// Notify all subscribers of state changes
	private notifyListeners() {
		this.listeners.forEach((listener) => listener());
	}

	// Get the current state
	getState(): NotificationState {
		return this.state;
	}

	// Update friend requests
	updateFriendRequests(requests: { requesterUsername: string; avatar: string; id: string }[]) {
		this.state.friendRequests = requests;
		this.notifyListeners();
	}

	addFriendRequest(request: { requesterUsername: string; avatar: string; id: string }) {
		if (!this.state.friendRequests.some(r => r.id === request.id)) {
			this.state.friendRequests.push(request);
		}
		this.notifyListeners();
	}

	removeFriendRequest(requesterUsername: string) {
		this.state.friendRequests = this.state.friendRequests.filter(r => r.requesterUsername !== requesterUsername);
		this.notifyListeners();
	}

	addFriendRequestAccepted(username: string) {
		this.notifyListeners(); // Notify all subscribers to update their UI
	}

	addFriendRequestDeclined(username: string) {
		this.notifyListeners(); // Notify all subscribers to update their UI
	}

	// Update message notifications
	updateMessageNotifications(userId: string, count: number, mode: "add" | "set" = "set") {
		if (mode === "add") {
			const prev = this.state.messageNotifications.get(userId) || 0;
			this.state.messageNotifications.set(userId, prev + count);
		} else {
			this.state.messageNotifications.set(userId, count);
		}
		if (this.state.messageNotifications.get(userId) === 0) {
			this.state.messageNotifications.delete(userId);
		}
		this.notifyListeners();
	}

	// Trigger a manual update
	triggerUpdate() {
		this.notifyListeners();
	}

	async fetchAllNotifications() {
		try {
			const raw = (await getPendingRequests()) as any[];
			this.state.friendRequests = await Promise.all(
				raw.map(async (req) => ({
					requesterUsername: req.requesterUsername,
					avatar: await getUserAvatar(req.requesterUsername),
					id: req.id,
				}))
			);
			const chatManager = getChatManager();
			const unreadCounts = (await chatManager.chatService.fetchUnreadMessagesCount()) || {}; // Ensure it's an object
			Object.entries(unreadCounts).forEach(([userId, count]) => {
				this.state.messageNotifications.set(userId, Number(count));
			});
			this.notifyListeners();
		} catch (error) {
			console.error("Failed to fetch unread message counts:", error);
		}
	}
}

export const notificationService = new NotificationService();