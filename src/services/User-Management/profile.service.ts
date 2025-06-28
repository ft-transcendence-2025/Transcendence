import axios from "axios";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

export class profileService {
  static base_url: string | undefined;

  static {
    profileService.base_url =
      process.env.NODE_ENV == "production"
        ? process.env.PROD_PROFILE_URL
        : process.env.DEV_PROFILE_URL;
  }

  static async createProfile(username: string, body: any) {
    return await axios.post(`${this.base_url}/${username}`, body);
  }

  static async getProfileByUsername(username: string) {
    return await axios.get(`${this.base_url}/${username}`);
  }

  static async updateProfile(username: string, body: any) {
    return await axios.put(`${this.base_url}/${username}`, body);
  }

  static async deleteProfile(username: string) {
    return await axios.delete(`${this.base_url}/${username}`);
  }
}
