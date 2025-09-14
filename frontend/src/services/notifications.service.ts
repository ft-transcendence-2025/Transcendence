import { chatManager } from "../app.js";
import { getPendingRequests } from "./friendship.service.js";
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
		this.state.friendRequests.push(request);
		console.log("New friend request added:", request);
		this.notifyListeners();
	}

	// Update message notifications
	updateMessageNotifications(userId: string, count: number) {
		this.state.messageNotifications.set(userId, count);
		this.notifyListeners();
	}

	// Trigger a manual update
	triggerUpdate() {
		this.notifyListeners();
	}

	async fetchAllNotifications() {
		try {
			console.log("Fetching pending friend requests...");
			const raw = (await getPendingRequests()) as any[];
			this.state.friendRequests = await Promise.all(
				raw.map(async (req) => ({
					requesterUsername: req.requesterUsername,
					avatar: await getUserAvatar(req.requesterUsername),
					id: req.id,
				}))
			);
			console.log("Friend requests loaded:", this.state.friendRequests);

			console.log("Fetching unread message counts...");
			const unreadCounts = (await chatManager.chatService.fetchUnreadMessagesCount()) || {}; // Ensure it's an object
			Object.entries(unreadCounts).forEach(([userId, count]) => {
				this.state.messageNotifications.set(userId, count);
				console.log(`Unread messages for ${userId}: ${count}`);
			});
			const unreadCount = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0);
			this.state.messageNotifications.set("__total__", unreadCount);
			console.log("Total unread messages:", unreadCount);
		} catch (error) {
			console.error("Failed to fetch unread message counts:", error);
		}
	}
}

export const notificationService = new NotificationService();