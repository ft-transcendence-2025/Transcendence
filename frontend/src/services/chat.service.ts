import { BASE_URL } from "../config/config.js";
import { IncomingMessage, OutgoingMessage } from "../interfaces/message.interfaces.js";
import { request, getHeaders } from "../utils/api.js";
import { getCurrentUsername } from "../utils/userUtils.js";

const CHAT_SERVICE_URL = `wss://localhost:5001/ws/chat`;
const MESSAGE_SERVICE = `${BASE_URL}/chat/conversations`

export default class chatService {
	public conn: WebSocket | null = null;
	public username: any
	public url: any;
	public lobbyConnections: any;

	constructor() {
		try {
			this.username = getCurrentUsername();
			this.url = CHAT_SERVICE_URL + `?userId=${this.username}`;
			this.connect();
			this.lobbyConnections = new Map()
		} catch (error) {
			console.error("Couldn't connect user to chat-service: ", error);
		}
	}

	connect() {
		this.conn = new WebSocket(this.url);
	}
	
	sendPrivateMessage(message: OutgoingMessage) {
		if (this.conn && this.conn.readyState === WebSocket.OPEN) {
			this.conn.send(JSON.stringify(message));
		} else {
			console.error("WebSocket is not open.");
		}
	}

	async getConversation(friendUsername: string) {
		const url = MESSAGE_SERVICE + `/${this.username}/${friendUsername}`;
		const conversation: any = await request(url, {
			method: "GET",
			headers: getHeaders(),
		});
		return conversation?.messages;
	}

	async markConversationAsRead(senderId: string): Promise<void> {
		try {
			await fetch(`${MESSAGE_SERVICE}/markAsRead`, {
				method: "POST",
				headers: getHeaders(),
				body: JSON.stringify({ senderId, recipientId: this.username }),
			});
		} catch (error) {
			console.error("Failed to mark conversation as read:", error);
		}
	}

	async fetchUnreadMessagesCount(): Promise<number> {
	  try {
		const response = await fetch(`${MESSAGE_SERVICE}/unreadMessagesCount/${this.username}`, {
		  method: "GET",
		  headers: getHeaders(),
		});
		const data = await response.json();
		return data.count || 0;
	  } catch (error) {
		console.error("Failed to fetch unread messages count:", error);
		return 0;
	  }
	}
	async fetchUnreadNotifications() {
		const url = `${MESSAGE_SERVICE}/notifications/unread/${this.username}`;
		const notifications = await request(url, {
			method: "GET",
			headers: getHeaders(),
		});
		return notifications;
	}

	async markNotificationsAsRead(type: string, senderId?: string): Promise<void> {
		try {
			const url = `${MESSAGE_SERVICE}/notifications/mark-as-read`;
			await request(url, {
				method: "POST",
				headers: getHeaders(),
				body: JSON.stringify({ recipientId: this.username, type, senderId }),
			});
		} catch (error) {
			console.error("Failed to mark notifications as read:", error);
		}
	}
}


