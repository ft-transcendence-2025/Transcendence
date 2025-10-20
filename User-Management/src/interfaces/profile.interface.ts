export enum FriendshipStatus {
  PENDING,
  ACCEPTED,
  BLOCKED,
  DECLINED,
}

export enum UserStatus {
  ONLINE,
  OFFLINE,
  IN_GAME,
}

export enum ProfileLanguage {
  ENGLISH,
  PORTUGUESE,
}

export enum UserGender {
  MALE,
  FEMALE,
  OTHER,
}

export interface Profile {
  id: string;
  status: UserStatus;
  avatar?: string;
  bio?: string;
  gender?: UserGender;
  nickName?: string;
  firstName?: string;
  lastName?: string;
  language?: ProfileLanguage;
  createdAt: Date;
  updatedAt: Date;
}
