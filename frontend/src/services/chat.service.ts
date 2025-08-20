import { BASE_URL } from "../config/config.js";
import { IncomingMessage, OutgoingMessage } from "../interfaces/message.interfaces.js";
import { request, getHeaders } from "../utils/api.js";
import { getCurrentUsername } from "../utils/userUtils.js";

const CHAT_SERVICE_URL = `wss://localhost:5000/ws/chat`;
const MESSAGE_SERVICE = `${BASE_URL}/chat/conversations`

export default class chatService {
	public conn: WebSocket | null = null;
	public username : any
	public url : any;
	public lobbyConnections : any ;

	constructor() {
		try {
			this.username = getCurrentUsername();
			this.url = CHAT_SERVICE_URL + `?userId=${this.username}`;
			this.conn  = new WebSocket(this.url);
			this.lobbyConnections = new Map()
			console.log("User successfully connected to chat-service.")
		} catch (error) {
			console.error("Couldn't connect user to chat-service: ", error);
		}
	}

	sendPrivateMessage(message: OutgoingMessage) {
		if (this.conn && this.conn.readyState === WebSocket.OPEN) {
			this.conn.send(JSON.stringify(message));
		} else {
			console.error("WebSocket is not open.");
		}
	}

	getConversation(friendUsername: string) {
		const url = MESSAGE_SERVICE + `/${this.username}/${friendUsername}`
		const conversation : any = request(url, {
			method: "GET",
    		headers: getHeaders(),
		})
		return conversation?.messages || [];
	}
}


