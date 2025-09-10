import { BASE_URL } from "../config/config.js";
import { IncomingMessage, OutgoingMessage } from "../interfaces/message.interfaces.js";
import { request, getHeaders } from "../utils/api.js";
import { getCurrentUsername } from "../utils/userUtils.js";

const CHAT_SERVICE_URL = `wss://${window.location.host}/ws/chat`;
const MESSAGE_SERVICE = `${window.location.origin}/api/chat/conversations`;

export default class chatService {
	public conn: WebSocket | null = null;
	public username : any
	public url : any;
	public lobbyConnections : any ;

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
		this.conn  = new WebSocket(this.url);
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
}


