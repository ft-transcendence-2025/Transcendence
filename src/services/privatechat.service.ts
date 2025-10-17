import prisma from '../lib/prisma';
import { NotificationMessage } from '../types/message.types';

export async function sendPendingMessages(userId: string, socket: any) {
  const pending = await prisma.message.findMany({
    where: {
      conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      delivered: false,
    },
  });

  for (const msg of pending) {
    // socket.send(JSON.stringify({ event: 'private/message', ...msg }));
    await prisma.message.update({ where: { id: msg.id }, data: { delivered: true } });
  }
}

export async function handlePrivateMessage(users: Map<string, any>, senderId: string, msg: any, originatingSocket: any) {
  const { recipientId, content, type = 'TEXT' } = msg;
  if (!recipientId || !content) return;

  const sender = users.get(senderId);
  if (!sender) {
    console.error(`Sender with ID ${senderId} not found.`);
    return;
  }

  if (sender.blockedUsersList.includes(recipientId)) {
    // Notify all sender's connections that the message was not delivered
    for (const ws of sender.connections) {
      ws.send(JSON.stringify({ event: "system/error", message: "Message not delivered." }));
    }
    return;
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      OR: [{ user1Id: senderId, user2Id: recipientId }, { user1Id: recipientId, user2Id: senderId }],
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { user1Id: senderId, user2Id: recipientId } });
  }

  const saved = await prisma.message.create({
    data: { senderId, conversationId: conversation.id, content, type, delivered: false },
  });



  // Send the message and notification in real-time if the recipient is online
  const recipientConn = users.get(recipientId);
  if (recipientConn) {
    await prisma.message.update({ where: { id: saved.id }, data: { delivered: true } });
    for (const ws of recipientConn.connections) {
      ws.send(JSON.stringify({ event: 'private/message', ...saved }));
    }
  }
  for (const ws of sender.connections) {
    if (ws !== originatingSocket) {
      ws.send(JSON.stringify({ event: 'private/message', ...saved , recipientId}));
    }
  }
}


export async function handleBlockUser(users: Map<string, any>, userId: string, msg: any) {
  const { recipientId } = msg;

  const user = users.get(userId);
  if (!user) return;

  if (!user.blockedUsersList.includes(recipientId)) {
    user.blockedUsersList.push(recipientId);
    const targetUser = users.get(recipientId);
    if (targetUser && !targetUser.blockedUsersList.includes(userId)) {
      targetUser.blockedUsersList.push(userId);
    }
  } else {
    user.blockedUsersList = user.blockedUsersList.filter((id: string) => id !== recipientId);
    const targetUser = users.get(recipientId);
    if (targetUser) {
      targetUser.blockedUsersList = targetUser.blockedUsersList.filter((id: string) => id !== userId);
    }
  }
}

export async function markMessagesAsRead(userId: string, conversationId: string): Promise<void> {
  try {
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  } catch (error) {
    console.error(`Failed to mark messages as read for user ${userId} in conversation ${conversationId}:`, error);
    throw new Error("Failed to mark messages as read.");
  }
}

/**
 * Handle notification messages between users
 * Supports various notification types including:
 * - Friend requests (FRIEND_REQUEST, FRIEND_REQUEST_ACCEPTED, FRIEND_REQUEST_DECLINED)
 * - Friend blocking (FRIEND_BLOCKED, FRIEND_UNBLOCKED)
 * - Game invites (GAME_INVITE, GAME_INVITE_ACCEPTED, GAME_INVITE_DECLINED)
 * 
 * @param users - Map of connected users
 * @param userId - ID of the user sending the notification
 * @param msg - Notification message containing recipientId, type, and content
 * @param originatingSocket - The WebSocket connection that sent the message
 */
export async function handleNotification(users: Map<string, any>, userId: string, msg: any, originatingSocket: any) {
  const { recipientId, type, content } = msg;
  if (!recipientId || !content || !type) return;

  const sender = users.get(userId);
  if (sender.blockedUsersList.includes(recipientId) && type !== "FRIEND_UNBLOCKED") {
    for (const ws of sender.connections) {
      ws.send(JSON.stringify({ msg: "Notification not delivered." }));
    }
    return;
  }

  // Log game invite related notifications
  if (type === 'GAME_INVITE' || type === 'GAME_INVITE_ACCEPTED' || type === 'GAME_INVITE_DECLINED' || type === 'GAME_INVITE_CANCELLED') {
    console.log(`Game invite notification: ${type} from ${userId} to ${recipientId}`);
  }

  // Send notification to recipient if they're online
  if (users.has(recipientId)) {
    const recipientConn = users.get(recipientId);
    for (const ws of recipientConn.connections) {
      ws.send(JSON.stringify({ event: 'notification/new', ...msg }));
    }
  }

  // Send notification to all sender's connections (except the originating one)
  for (const ws of sender.connections) {
    if (ws !== originatingSocket) {
      ws.send(JSON.stringify({ event: 'notification/new', ...msg , recipientId}));
    }
  }
}