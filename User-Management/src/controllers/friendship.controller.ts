import { FastifyRequest, FastifyReply } from "fastify";
import {
  FriendshipService,
  FriendshipServiceError,
} from "../services/friendship.service";
import { FriendshipStatus } from "../../generated/prisma";

const friendshipService = new FriendshipService();

export const sendFriendRequest = async (
  req: FastifyRequest,
  res: FastifyReply
) => {
  try {
    const { fromUserId, toUserId } = req.body as {
      fromUserId: string;
      toUserId: string;
    };
    const result = await friendshipService.sendFriendRequest(
      fromUserId,
      toUserId
    );
    return res.code(201).send(result);
  } catch (err) {
    if (err instanceof FriendshipServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
};

export const getFriendRequests = async (
  req: FastifyRequest,
  res: FastifyReply
) => {
  try {
    const { username } = req.params as { username: string };
    const requests = await friendshipService.getFriendRequests(username);
    return res.send(requests);
  } catch (err) {
    if (err instanceof FriendshipServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
};

export const getBlockedUsers = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const blockedUsersList = await friendshipService.getBlockedUsersList(username);
    return res.send(blockedUsersList);

  } catch (err) {
    if (err instanceof FriendshipServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
}

export const respondToFriendRequest = async (
  req: FastifyRequest,
  res: FastifyReply
) => {
  try {
    const { friendshipId } = req.params as { friendshipId: string };
    const { status } = req.body as { status: FriendshipStatus };
    const result = await friendshipService.updateFriendshipStatus(
      friendshipId,
      status
    );
    return res.send(result);
  } catch (err) {
    if (err instanceof FriendshipServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
};

export const listFriends = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const friends = await friendshipService.listFriends(username);
    return res.send(friends);
  } catch (err) {
    if (err instanceof FriendshipServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
};

export const removeFriend = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { userId, friendId } = req.body as {
      userId: string;
      friendId: string;
    };
    const result = await friendshipService.removeFriend(userId, friendId);
    return res.send(result);
  } catch (err) {
    if (err instanceof FriendshipServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
};

export const blockUser = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { friendId } = req.params as { friendId: string };
    const { blockedBy } = req.body as { blockedBy: string };
    const result = await friendshipService.blockUser(blockedBy, friendId);
    return res.send(result);
  } catch (err) {
    if (err instanceof FriendshipServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
};

export const unblockUser = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { friendId } = req.params as { friendId: string };
    const { unblockedBy } = req.body as { unblockedBy: string };
    const result = await friendshipService.unblockUser(unblockedBy, friendId);
    return res.send(result);
  } catch (err) {
    if (err instanceof FriendshipServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
};

export const getFriendshipStatus = async (
  req: FastifyRequest,
  res: FastifyReply
) => {
  try {
    const { requester, addressee } = req.params as { requester: string; addressee: string };
    const userId1 = requester;
    const userId2 = addressee;
    const status = await friendshipService.getFriendshipStatus(userId1, userId2);
    return res.send(status);
  } catch (err) {
    if (err instanceof FriendshipServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
};