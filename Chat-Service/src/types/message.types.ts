/**
 * Message Types for Chat Service
 * These types define the structure of WebSocket messages handled by the chat service
 */

/**
 * Base message interface
 */
export interface BaseMessage {
  kind: string;
  ts?: number;
}

/**
 * Private message (text, image, file, system)
 */
export interface PrivateSendMessage extends BaseMessage {
  kind: 'private/send';
  recipientId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'GAME_INVITE';
}

/**
 * Lobby message interfaces
 */
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

/**
 * User block/unblock message
 */
export interface UserBlockMessage {
  kind: 'user/block';
  recipientId: string;
}

/**
 * Notification message
 * Used for friend requests, game invites, and other notifications
 */
export interface NotificationMessage extends BaseMessage {
  kind: 'notification/new';
  recipientId: string;
  type: NotificationType;
  content: string;
  senderId: string;
  ts: number;
  friendshipId?: string; // For friend request notifications
  inviteId?: string; // For game invite responses
  gameId?: number; // For custom game invite context
}

/**
 * Notification types supported by the system
 */
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

/**
 * Union type for all incoming WebSocket messages
 */
export type IncomingMessage =
  | PrivateSendMessage
  | LobbyJoinMessage
  | LobbyLeaveMessage
  | LobbySendMessage
  | UserBlockMessage
  | NotificationMessage;

/**
 * Outgoing message events
 */
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
  recipientId?: string;
}

export interface NotificationResponse {
  event: 'notification/new';
  type: NotificationType;
  senderId: string;
  recipientId: string;
  content: string;
  ts: number;
  friendshipId?: string;
  inviteId?: string;
  gameId?: number;
}

/**
 * Union type for all outgoing WebSocket messages
 */
export type OutgoingMessage =
  | SystemReadyMessage
  | SystemErrorMessage
  | PrivateMessageResponse
  | NotificationResponse;
