# Game Invite Feature

## Overview
The Chat Service now supports game invite notifications through the WebSocket notification system. This allows users to send game invitations to their friends and receive acceptance/decline responses in real-time.

## Message Types

### GAME_INVITE
Sent when a user wants to invite another user to play a game.

**Example message:**
```json
{
  "kind": "notification/new",
  "type": "GAME_INVITE",
  "recipientId": "username",
  "senderId": "currentUser",
  "content": "currentUser invited you to play a game!",
  "ts": 1234567890
}
```

### GAME_INVITE_ACCEPTED
Sent when a user accepts a game invitation.

**Example message:**
```json
{
  "kind": "notification/new",
  "type": "GAME_INVITE_ACCEPTED",
  "recipientId": "inviterUsername",
  "senderId": "currentUser",
  "content": "currentUser accepted your game invite!",
  "ts": 1234567890,
  "inviteId": "sender-timestamp"
}
```

### GAME_INVITE_DECLINED
Sent when a user declines a game invitation.

**Example message:**
```json
{
  "kind": "notification/new",
  "type": "GAME_INVITE_DECLINED",
  "recipientId": "inviterUsername",
  "senderId": "currentUser",
  "content": "currentUser declined your game invite.",
  "ts": 1234567890,
  "inviteId": "sender-timestamp"
}
```

## Implementation Details

### Backend (Chat-Service)

1. **Prisma Schema**: Added `GAME_INVITE` to the `MessageType` enum in `schema.prisma`
2. **Type Definitions**: Created comprehensive TypeScript types in `src/types/message.types.ts`
3. **Notification Handler**: The `handleNotification` function in `privatechat.service.ts` processes game invite notifications
4. **Logging**: Added specific logging for game invite-related notifications for debugging

### Frontend Integration

The frontend already implements:
- Sending game invites through the chat interface
- Displaying game invite notifications
- Handling accept/decline responses
- Managing game invite state in the notification service

## How It Works

1. **Sending a Game Invite**:
   - User clicks "Send Game Invite" in the chat menu
   - Frontend sends a `GAME_INVITE` notification via WebSocket
   - Backend forwards the notification to the recipient (if online)
   - Recipient sees the game invite in their notifications

2. **Accepting/Declining**:
   - Recipient clicks Accept or Decline button
   - Frontend sends `GAME_INVITE_ACCEPTED` or `GAME_INVITE_DECLINED` notification
   - Backend forwards the response to the original inviter
   - Inviter's notification state is updated

3. **Blocked Users**:
   - Game invites cannot be sent to blocked users
   - The backend checks the blocked users list before forwarding notifications

## WebSocket Message Flow

```
User A (Inviter)                Backend                 User B (Invitee)
     |                             |                          |
     |-- GAME_INVITE ------------->|                          |
     |                             |------- GAME_INVITE ----->|
     |                             |                          |
     |                             |<-- GAME_INVITE_ACCEPTED--|
     |<-- GAME_INVITE_ACCEPTED ----|                          |
     |                             |                          |
```

## Error Handling

- Missing required fields (recipientId, content, type) are ignored
- Blocked users receive an error message instead of sending the notification
- Offline users will receive notifications when they reconnect (if implemented with pending notifications)

## Testing

To test the game invite feature:

1. Start the Chat-Service backend
2. Open two browser windows with different users
3. Send a game invite from User A to User B
4. Verify User B receives the notification
5. Accept/decline from User B
6. Verify User A receives the response

## Future Enhancements

- Store game invite history in the database
- Add expiration time for game invites
- Support for tournament invites
- Custom game modes in invite messages
