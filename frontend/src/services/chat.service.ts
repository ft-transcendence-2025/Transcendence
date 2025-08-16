import { BASE_URL } from "../config/config.js";
import { request, getHeaders } from "../utils/api.js";

const CHAT_SERVICE_URL = `wss://localhost:5000/ws`;

// export interface Message {
//   id: string;
//   username: string;
//   email: string;
//   active: boolean;
//   createdAt: string;
// }

// API functions
// export const getUsers = () =>
//   request<User[]>(`${USER_BASE_URL}/`, {
// 	method: "GET",
// 	headers: getHeaders(),
//   });

// export const getUserByUsername = (username: string) =>
//   request<User>(`${USER_BASE_URL}/${username}`);

// export const updateUser = (username: string, body: any) =>
//   request<User>(`${USER_BASE_URL}/${username}`, {
// 	method: "PUT",
// 	headers: getHeaders(),
// 	body: JSON.stringify(body),
//   });

// export const disableUser = (username: string) =>
//   request<User>(`${USER_BASE_URL}/${username}`, {
// 	method: "PATCH",
// 	headers: getHeaders(),
//   });

// export const deleteUser = (username: string) =>
//   request<void>(`${USER_BASE_URL}/${username}`, {
// 	method: "DELETE",
// 	headers: getHeaders(),
//   });
let lobbySocket: WebSocket | null = null;

export function connectToLobby(userId: string, gameId: string): WebSocket {
	const url = CHAT_SERVICE_URL + `?userId=${userId}&gameId=${gameId}`;
	lobbySocket = new WebSocket(url);
	return lobbySocket;
}

export function sendLobbyMessage(message: string) {
	if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
		lobbySocket.send(message);
	} else {
		console.error("WebSocket is not open.");
	}
}

