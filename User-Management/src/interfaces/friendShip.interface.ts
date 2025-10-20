export enum Role {
  ADMIN,
  USER,
}

export enum FriendshipStatus {
  PENDING,
  ACCEPTED,
  BLOCKED,
  DECLINED,
}

export interface FriendShip {
  id: string;
  role: Role;
  requesterUsername: string;
  addresseeUsername: string;
  createdAt: Date;
  updatedAt: Date;
}
