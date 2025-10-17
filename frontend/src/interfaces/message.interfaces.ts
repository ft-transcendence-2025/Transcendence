// Base message interface
export interface BaseMessage {
  kind: string;
  ts?: number;
}

// Private message interfaces
export interface PrivateSendMessage extends BaseMessage {
  kind: 'private/send';
  recipientId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
}

// Lobby message interfaces
export interface LobbyJoinMessage extends BaseMessage {
  kind: 'lobby/join';
  gameId: string;
}

export interface LobbyLeaveMessage extends BaseMessage {
  kind: 'lobby/leave';
  gameId: string;
}

export interface LobbySendMessage extends BaseMessage {
  kind: 'lobby/send';
  gameId: string;
  content: string;
  type?: 'TEXT' | 'SYSTEM';
}

export interface UserBlockMessageResponse {
  kind: 'user/block';
  recipientId: string;
}

export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'FRIEND_REQUEST_DECLINED'
  | 'FRIEND_BLOCKED'
  | 'FRIEND_UNBLOCKED'
  | 'GAME_INVITE'
  | 'GAME_INVITE_ACCEPTED'
  | 'GAME_INVITE_DECLINED'
  | 'GAME_INVITE_CANCELLED';

export interface NotificationMessage extends BaseMessage {
  kind: 'notification/new';
  recipientId: string;
  type: NotificationType;
  content: string;
  senderId: string;
  ts: number;
}

export interface FriendRequestMessage extends NotificationMessage {
  kind: 'notification/new';
  type: 'FRIEND_REQUEST';
  friendshipId: string;
  senderId: string;
  recipientId: string;
  content: string;
}

// Union type for all Outgoing messages
export type OutgoingMessage = 
  | PrivateSendMessage
  | LobbyJoinMessage
  | LobbyLeaveMessage
  | LobbySendMessage
  | UserBlockMessageResponse
  | NotificationMessage
  | FriendRequestMessage
  | any; // Fallback for unknown message types

// System response messages
export interface SystemReadyMessage {
  event: 'system/ready';
  userId: string;
  ts: number;
}

export interface SystemErrorMessage {
  event: 'system/error';
  message: string;
  ts?: number;
}

export interface PrivateMessageResponse {
  event: 'private/message';
  senderId: string;
  content: string;
  type?: string;
  ts: number;
}

export interface LobbyMessageResponse {
  event: 'lobby/message';
  gameId: string;
  senderId: string;
  content: string;
  type?: string;
  ts: number;
}

export interface FriendRequestResponse {
  event: 'notification/new';
  type: string; // e.g., "FRIEND_REQUEST"
  friendshipId: string;
  senderId: string;
  recipientId: string;
  content: string;
  ts: number;
}

// Union type for all Incoming messages
export type IncomingMessage = 
  | SystemReadyMessage
  | SystemErrorMessage
  | PrivateMessageResponse
  | LobbyMessageResponse
  | UserBlockMessageResponse
  | NotificationMessage
  | any; // Fallback for unknown message types

