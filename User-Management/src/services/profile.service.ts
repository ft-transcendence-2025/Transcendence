import prisma from "../lib/prisma";
import { PrismaClientKnownRequestError } from "../../generated/prisma/runtime/library";
import { Profile, ProfileLanguage, UserGender } from "../../generated/prisma";
import { fileTypeFromBuffer } from "file-type";

export class ProfileServiceError extends Error {
  code: number;
  error?: object;
  constructor(message: string, code: number, error?: object) {
    super(message);
    this.code = code;
    this.error = error;
    Object.setPrototypeOf(this, ProfileServiceError.prototype);
  }
}

export class ProfileService {
  async getAvatar(username: string) {
    if (!username) {
      throw new ProfileServiceError("Username is required.", 400);
    }
    
    // Try to find by username first, then by nickname
    let profile = await prisma.profile.findUnique({
      where: { userUsername: username },
      select: { avatar: true },
    });
    
    // If not found by username, try by nickname
    if (!profile) {
      profile = await prisma.profile.findUnique({
        where: { nickName: username },
        select: { avatar: true },
      });
    }
    
    if (!profile || !profile.avatar) {
      throw new ProfileServiceError("Avatar not found.", 404);
    }
    const type = await fileTypeFromBuffer(profile.avatar as Buffer);
    return {
      buffer: profile.avatar as Buffer,
      mime: type?.mime || "application/octet-stream",
    };
  }

  async uploadAvatar(username: string, buffer: Buffer) {
    try {
      const updatedProfile = await prisma.profile.update({
        where: { userUsername: username },
        data: { avatar: buffer },
      });
      return updatedProfile;
    } catch (err: any) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new ProfileServiceError("Profile not found", 404);
      }
      throw new ProfileServiceError("Error uploading avatar", 500, err);
    }
  }

  async createProfile(
    username: string,
    data: {
      nickName?: string;
      bio?: string;
      gender?: UserGender;
      firstName?: string;
      lastName?: string;
      language?: ProfileLanguage;
    }
  ) {
    if (!username) {
      throw new ProfileServiceError("username is required.", 400);
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new ProfileServiceError("User does not exist.", 404);
    }
    const existing = await prisma.profile.findUnique({
      where: { userUsername: username },
    });
    if (existing) {
      throw new ProfileServiceError("Profile already exists.", 400);
    }
    const profile = await prisma.profile.create({
      data: {
        userUsername: username,
        ...(data.nickName && { nickName: data.nickName }),
        ...(data.bio && { bio: data.bio }),
        ...(data.gender && { gender: data.gender }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.language && { language: data.language }),
      },
    });
    return profile;
  }

  async getProfileByUsername(username: string) {
    const profile = await prisma.profile.findUnique({
      where: { userUsername: username },
      omit: { avatar: true },
    });
    if (!profile) {
      throw new ProfileServiceError("Profile not found", 404);
    }
    return profile;
  }

  async updateProfile(username: string, data: Partial<Profile>) {
    // Remove undefined fields, 'id' and 'avatar'
    const updateData = Object.fromEntries(
      Object.entries(data).filter(
        ([key, v]) => v !== undefined && key !== "id" && key !== "avatar"
      )
    );
    try {
      const profile = await prisma.profile.update({
        where: { userUsername: username },
        data: updateData,
      });
      return profile;
    } catch (err: any) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new ProfileServiceError("Profile not found", 404);
      }
      throw new ProfileServiceError("Error updating profile", 500, err);
    }
  }

  async deleteProfile(username: string) {
    try {
      await prisma.profile.delete({
        where: { userUsername: username },
      });
    } catch (err: any) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new ProfileServiceError("Profile not found", 404);
      }
      throw new ProfileServiceError("Error deleting profile", 500, err);
    }
  }
}
