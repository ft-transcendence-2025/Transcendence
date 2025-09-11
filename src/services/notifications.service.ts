import { NotificationType } from '../../generated/prisma';
import prisma from '../lib/prisma';

/**
 * Create a new notification.
 * @param senderId - The user who triggered the notification.
 * @param recipientId - The user who will receive the notification.
 * @param type - The type of the notification (e.g., NEW_MESSAGE, GAME_INVITE, NEW_FRIENDSHIP).
 * @param content - The content of the notification.
 */
export async function createNotification(
  senderId: string,
  recipientId: string,
  type: NotificationType,
  content: string
) {
  return await prisma.notification.create({
    data: {
      senderId,
      recipientId,
      type,
      content,
    },
  });
}

/**
 * Fetch unread notifications for a user.
 * @param recipientId - The user ID to fetch notifications for.
 * @returns A list of unread notifications.
 */
export async function getUnreadNotifications(recipientId: string) {
  return await prisma.notification.findMany({
    where: {
      recipientId,
      read: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Mark notifications as read for a specific type and optionally a sender.
 * @param recipientId - The user ID who received the notifications.
 * @param type - The type of notifications to mark as read.
 * @param senderId - (Optional) The sender ID to filter notifications.
 * @returns The count of notifications marked as read.
 */
export async function markNotificationsAsRead(
  recipientId: string,
  type: string,
  senderId?: string
) {
  const whereClause: any = {
    recipientId,
    type,
    read: false,
  };

  if (senderId) {
    whereClause.senderId = senderId;
  }

  const result = await prisma.notification.updateMany({
    where: whereClause,
    data: {
      read: true,
    },
  });

  return result.count;
}

/**
 * Delete all notifications for a user (optional: filter by type).
 * @param recipientId - The user ID whose notifications will be deleted.
 * @param type - (Optional) The type of notifications to delete.
 */
export async function deleteNotifications(recipientId: string, type?: string) {
  const whereClause: any = {
    recipientId,
  };

  if (type) {
    whereClause.type = type;
  }

  await prisma.notification.deleteMany({
    where: whereClause,
  });
}