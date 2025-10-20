import { Profile } from "./profile.interface";

export interface User {
  id: string;
  username: string;
  email?: string;
  password: string;
  active: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile;
}
