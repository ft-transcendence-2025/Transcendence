import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import { PasswordValidator } from "password-validator-pro";
import { ProfileService } from "./profile.service";
import { UsernameValidator } from "../lib/usernameValidator";

const profileService = new ProfileService();

export class UserServiceError extends Error {
  code: number;
  error?: object;
  constructor(message: string, code: number, error?: object) {
    super(message);
    this.code = code;
    this.error = error;
    Object.setPrototypeOf(this, UserServiceError.prototype);
  }
}

export class UserService {
  private pwValidator: PasswordValidator;

  constructor() {
    this.pwValidator = new PasswordValidator({
      minLength: 8,
      maxLength: 20,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      combineErrors: true, // Set this to true to combine all errors into one message
    });
  }
  async createUser(username: string, password: string, email?: string) {
    // Validate username
    const usernameValidation = UsernameValidator.validate(username);
    if (!usernameValidation.valid) {
      throw new UserServiceError(
        "Username does not meet requirements.",
        400,
        { username: usernameValidation.errors }
      );
    }

    // Normalize username to lowercase for storage
    const normalizedUsername = UsernameValidator.normalize(username);

    // Check if username already exists
    const existingUser = await this.findUserByUsername(normalizedUsername);
    if (existingUser) {
      throw new UserServiceError(
        "Username already exists.",
        409,
        { username: ["This username is already taken"] }
      );
    }

    // Validate password
    const result = this.pwValidator.validate(password);
    if (!result.valid) {
      throw new UserServiceError(
        "Password does not meet security requirements.",
        400,
        result.errors
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username: normalizedUsername, password: hashedPassword, email },
      omit: { password: true },
    });
    const profile = await profileService.createProfile(normalizedUsername, {});
    return user;
  }

  async findUserByUsername(username: string) {
    return prisma.user.findFirst({
      where: { username },
    });
  }

  async getAllUsers() {
    return prisma.user.findMany({
      omit: { password: true },
    });
  }

  async updateUser(
    username: string,
    data: { email?: string; password?: string }
  ) {
    return prisma.user.update({
      where: { username },
      data,
    });
  }

  async disableUser(username: string) {
    return prisma.user.update({
      where: { username },
      data: { active: false },
    });
  }

  async deleteUser(username: string) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { username },
        select: { id: true, username: true },
      });

      if (!user) {
        throw new UserServiceError("User not found", 404);
      }

      await tx.friendship.deleteMany({
        where: {
          OR: [
            { requesterUsername: username },
            { addresseeUsername: username },
          ],
        },
      });

      await tx.profile.deleteMany({
        where: { userUsername: username },
      });

      return tx.user.delete({
        where: { username },
        omit: { password: true },
      });
    });
  }

  /* ####################################### 2FA ####################################### */

  async generate2FASecret(username: string) {
    const secret = speakeasy.generateSecret({
      name: `TRANSCENDENCE (${username})`,
    });
    await prisma.user.update({
      where: { username },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false,
      },
    });
    return secret.otpauth_url;
  }

  async enable2FA(username: string, token: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.twoFactorSecret)
      throw new UserServiceError("2FA not initialized", 400);
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });
    if (!verified) throw new UserServiceError("Invalid 2FA token", 400);
    await prisma.user.update({
      where: { username },
      data: { twoFactorEnabled: true },
    });
    return { message: "2FA enabled" };
  }

  async disable2FA(username: string) {
    await prisma.user.update({
      where: { username },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { message: "2FA disabled" };
  }

  async verify2FA(username: string, token: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) return false;
    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });
  }

  /* ####################################### 2FA ####################################### */
}
