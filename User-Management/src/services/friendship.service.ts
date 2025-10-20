import prisma from "../lib/prisma";
import { PrismaClientKnownRequestError } from "../../generated/prisma/runtime/library";
import { FriendshipStatus } from "../../generated/prisma";

export class FriendshipServiceError extends Error {
  code: number;
  error?: object;
  constructor(message: string, code: number, error?: object) {
    super(message);
    this.code = code;
    this.error = error;
    Object.setPrototypeOf(this, FriendshipServiceError.prototype);
  }
}

export class FriendshipService {
  async sendFriendRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new FriendshipServiceError("You can't add yourself", 400);
    }
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterUsername: fromUserId, addresseeUsername: toUserId },
          { requesterUsername: toUserId, addresseeUsername: fromUserId },
        ],
      },
    });

    if (existing) {
      if (
        existing.status === FriendshipStatus.ACCEPTED ||
        existing.status === FriendshipStatus.PENDING
      ) {
        throw new FriendshipServiceError(
          "Friendship already exists or pending",
          400
        );
      } else {
        // Update to pending if not already pending or accepted
        const updated = await prisma.friendship.update({
          where: { id: existing.id },
          data: {
            requesterUsername: fromUserId,
            addresseeUsername: toUserId,
            status: FriendshipStatus.PENDING,
            blockedByUsername: null
          },
        });
        return { message: "Friend request sent", friendshipId: updated.id };
      }
    }

    const created = await prisma.friendship.create({
      data: {
        requesterUsername: fromUserId,
        addresseeUsername: toUserId,
        status: FriendshipStatus.PENDING,
      },
    });
    return { message: "Friend request sent", friendshipId: created.id };
  }

  async getFriendRequests(username: string) {
    return prisma.friendship.findMany({
      where: {
        addresseeUsername: username,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: { select: { id: true, username: true } },
      },
    });
  }

  async getBlockedUsersList(username: string) {
    const usersList = await prisma.friendship.findMany({
      where: {
        OR: [
          { addresseeUsername: username },
          { requesterUsername: username }
        ],
        status: FriendshipStatus.BLOCKED,
      },
    });

    return usersList.map((user) => {
      return (username != user.requesterUsername) ? user.requesterUsername : user.addresseeUsername;
    })
  }

  async updateFriendshipStatus(friendshipId: string, status: FriendshipStatus) {
    try {
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status },
      });
      return { message: `Friend request ${status.toLowerCase()}` , friendshipId: friendshipId };
    } catch (err: any) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new FriendshipServiceError("Friend request not found", 404);
      }
      throw new FriendshipServiceError(
        "Error updating friend request",
        500,
        err
      );
    }
  }

  async listFriends(username: string) {
    const friends = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterUsername: username }, { addresseeUsername: username }],
        status: FriendshipStatus.ACCEPTED,
      },
      include: {
        requester: { select: { id: true, username: true, profile: { select: { status: true } } } },
        addressee: { select: { id: true, username: true, profile: { select: { status: true } } } },
      },
    });

    return friends.map((f) => {
      const friendUser =
        f.requesterUsername == username ? f.addressee : f.requester;
      return { id: friendUser.id, username: friendUser.username, status: friendUser.profile?.status };
    });
  }

  async removeFriend(userId: string, friendId: string) {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterUsername: userId, addresseeUsername: friendId },
          { requesterUsername: friendId, addresseeUsername: userId },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
    });
    return { message: "Friend removed" };
  }

  async blockUser(blockedBy: string, blockedUser: string) {
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterUsername: blockedBy, addresseeUsername: blockedUser },
          { requesterUsername: blockedUser, addresseeUsername: blockedBy },
        ],
      },
    });

    if (existingFriendship) {
      const updated = await prisma.friendship.update({
        where: { id: existingFriendship.id },
        data: {
          status: FriendshipStatus.BLOCKED,
          blockedByUsername: blockedBy
        },
      });
      return { message: "User blocked", friendshipId: updated.id };
    } else {
      const created = await prisma.friendship.create({
        data: {
          requesterUsername: blockedBy,
          addresseeUsername: blockedUser,
          status: FriendshipStatus.BLOCKED,
          blockedByUsername: blockedBy
        },
      });
      return { message: "User blocked", friendshipId: created.id };
    }
  }

  async unblockUser(unblockedBy: string, unblockedUser: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterUsername: unblockedBy, addresseeUsername: unblockedUser },
          { requesterUsername: unblockedUser, addresseeUsername: unblockedBy },
        ],
        status: FriendshipStatus.BLOCKED,
        blockedByUsername: unblockedBy,
      },
    });

    if (!friendship) {
      throw new FriendshipServiceError("No blocked relationship found", 404);
    }

    // If there was a friendship before blocking, set to DECLINED, else delete
    const updated = await prisma.friendship.update({
      where: { id: friendship.id },
      data: {
        status: FriendshipStatus.DECLINED,
        blockedByUsername: null
      },
    });
    return { message: "User unblocked", friendshipId: updated.id };
  }


  async getFriendshipStatus(blockedBy: string, blockedUser: string) {
    console.log("Checking friendship status between", blockedBy, "and", blockedUser);
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterUsername: blockedBy, addresseeUsername: blockedUser },
          { requesterUsername: blockedUser, addresseeUsername: blockedBy },
        ],
      },
    });
    console.log("Friendship record found:", friendship);
    if (!friendship) {
      return { status: FriendshipStatus.DECLINED, blockedBy: null };
    }
    return { status: friendship.status, blockedBy: friendship.blockedByUsername || null };
  }
}
