import { FastifyRequest, FastifyReply } from "fastify";
import { Profile, ProfileLanguage, UserGender } from "../../generated/prisma";
import { PrismaClientKnownRequestError } from "../../generated/prisma/runtime/library";
import { fileTypeFromBuffer } from "file-type";
import {
  ProfileService,
  ProfileServiceError,
} from "../services/profile.service";

const profileService = new ProfileService();

export const getAvatar = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const avatarData = await profileService.getAvatar(username);
    res.header("Content-Type", avatarData.mime);
    return res.send(avatarData.buffer);
  } catch (err) {
    if (err instanceof ProfileServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res.code(500).send({ message: "Error fetching avatar", error: err });
  }
};

export const uploadAvatar = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const data = await req.file();
    if (!data) return res.code(400).send({ message: "No file uploaded" });

    // Limit: 2MB (change as needed)
    const MAX_SIZE = 2 * 1024 * 1024;
    const buffer = await data.toBuffer();
    if (buffer.length > MAX_SIZE) {
      return res
        .code(413)
        .send({ message: "File too large. Max 2MB allowed." });
    }

    // Accept only jpeg, png, gif
    const type = await fileTypeFromBuffer(buffer);
    const allowed = ["image/jpeg", "image/png", "image/gif"];
    if (!type || !allowed.includes(type.mime)) {
      return res
        .code(415)
        .send({ message: "Only JPEG, PNG, or GIF images are allowed." });
    }

    const { username } = req.params as { username: string };
    await profileService.uploadAvatar(username, buffer);
    return res.code(200).send({ message: "Avatar updated successfully." });
  } catch (err) {
    if (err instanceof ProfileServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res
      .code(500)
      .send({ message: "Error uploading avatar", error: err });
  }
};

export const createProfile = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const { nickName, bio, gender, firstName, lastName, language } =
      req.body as {
        nickName?: string;
        bio?: string;
        gender?: UserGender;
        firstName?: string;
        lastName?: string;
        language?: ProfileLanguage;
      };

    const profile = await profileService.createProfile(username, {
      nickName,
      bio,
      gender,
      firstName,
      lastName,
      language,
    });
    return res.code(201).send(profile);
  } catch (err) {
    if (err instanceof ProfileServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res
      .code(500)
      .send({ message: "Error creating profile", error: err });
  }
};

export const getProfileByUsername = async (
  req: FastifyRequest,
  res: FastifyReply
) => {
  try {
    const { username } = req.params as { username: string };
    const profile = await profileService.getProfileByUsername(username);
    return res.send(profile);
  } catch (err) {
    if (err instanceof ProfileServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res
      .code(500)
      .send({ message: "Error fetching profile", error: err });
  }
};

export const updateProfile = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    const data = req.body as Partial<Profile>;
    const profile = await profileService.updateProfile(username, data);
    return res.send({ message: "Profile updated", profile });
  } catch (err) {
    if (err instanceof ProfileServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res
      .code(500)
      .send({ message: "Error updating profile", error: err });
  }
};

export const deleteProfile = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { username } = req.params as { username: string };
    await profileService.deleteProfile(username);
    return res.code(200).send({ message: "Profile successfully deleted." });
  } catch (err) {
    if (err instanceof ProfileServiceError) {
      return res.code(err.code).send({ message: err.message });
    }
    return res
      .code(500)
      .send({ message: "Error deleting profile", error: err });
  }
};
