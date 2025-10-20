import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaClientKnownRequestError } from "../../generated/prisma/runtime/library";
import bcrypt from "bcrypt";
import qrcode from "qrcode";
import { UserService, UserServiceError } from "../services/user.service";

const userService = new UserService();

export const createUser = async (req: FastifyRequest, res: FastifyReply) => {
  const { username, password, email } = req.body as {
    username: string;
    password: string;
    email?: string;
  };

  if (!username || !password) {
    return res
      .code(400)
      .send({ message: "Username and password are required." });
  }

  try {
    const user = await userService.createUser(username, password, email);
    return res.code(201).send({ message: "User created!", user: user });
  } catch (err) {
    if (err instanceof UserServiceError) {
      return res.code(err.code).send({ error: err?.error });
    }
    return res.code(500).send({ message: "Error creating user", error: err });
  }
};

export const login = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username, password, token } = req.body as {
      username: string;
      password: string;
      token?: string;
    };
    if (!username || !password)
      return res
        .code(400)
        .send({ message: "Username and password are required." });

    const user = await userService.findUserByUsername(username);
    if (!user)
      return res.code(403).send({ message: "Invalid username or password." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.code(403).send({ message: "Invalid username or password." });

    if (user.twoFactorEnabled) {
      if (!token) return res.code(401).send({ message: "2FA token required." });
      const verified = await userService.verify2FA(username, token);
      if (!verified)
        return res.code(401).send({ message: "Invalid 2FA token." });
    }

    const { password: _, ...userSafe } = user;
    return res
      .code(200)
      .send({ message: "User successfully logged in.", user: userSafe });
  } catch (err) {
    return res.code(500).send({ message: "Internal server error." });
  }
};

export const getAll = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const users = await userService.getAllUsers();
    return users && users.length > 0
      ? res.code(200).send(users)
      : res.code(404).send({ message: "No user was found!" });
  } catch (err) {
    return res.code(500).send({ message: "Internal Server Error", error: err });
  }
};

export const getByUsername = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const user = await userService.findUserByUsername(username);
    if (!user) {
      return res.code(404).send({ message: "User not found!" });
    }
    const { password: _, ...userSafe } = user;
    return res.code(200).send(userSafe);
  } catch (err) {
    return res.code(500).send({ message: "Internal Server Error", error: err });
  }
};

export const disableUser = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    await userService.disableUser(username);
    return res.code(200).send({ message: "User disabled successfully" });
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError && err.code == "P2025") {
      return res.code(404).send({ message: "User not found!" });
    }
    return res.code(500).send({ message: "Internal Server Error", error: err });
  }
};

export const updateUser = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    let data: any = {};
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await userService.updateUser(username, data);

    return res.send({ message: "User updated", user });
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError && err.code == "P2025") {
      return res.code(404).send({ message: "User not found" });
    }
    return res.code(500).send({ message: "Internal server error", error: err });
  }
};

export const deleteUser = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const user = await userService.deleteUser(username);
    return res.code(200).send({ message: "User deleted successfully!", user });
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError && err.code == "P2025") {
      return res.code(404).send({ message: "User not found!" });
    }
    return res.code(500).send({ message: "Internal Server Error", error: err });
  }
};

// Generate 2FA QR code
export const generate2FAQr = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const otpauthUrl = await userService.generate2FASecret(username);
    if (!otpauthUrl) {
      return res.code(400).send({ message: "Failed to generate 2FA secret." });
    }
    const qr = await qrcode.toDataURL(otpauthUrl);
    return res.send({ qr, otpauthUrl });
  } catch (err) {
    return res
      .code(500)
      .send({ message: "Error generating 2FA QR", error: err });
  }
};

// Enable 2FA
export const enable2FA = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const { token } = req.body as { token: string };
    const result = await userService.enable2FA(username, token);
    return res.send(result);
  } catch (err) {
    return res.code(400).send({ message: "Error enabling 2FA", error: err });
  }
};

// Disable 2FA
export const disable2FA = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const result = await userService.disable2FA(username);
    return res.send(result);
  } catch (err) {
    return res.code(400).send({ message: "Error disabling 2FA", error: err });
  }
};
