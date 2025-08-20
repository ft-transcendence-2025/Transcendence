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

// Union type for all Outgoing messages
export type OutgoingMessage = 
  | PrivateSendMessage
  | LobbyJoinMessage
  | LobbyLeaveMessage
  | LobbySendMessage;

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

// Union type for all Incoming messages
export type IncomingMessage = 
  | SystemReadyMessage
  | SystemErrorMessage
  | PrivateMessageResponse
  | LobbyMessageResponse;

