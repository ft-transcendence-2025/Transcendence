import axios from "axios";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

export class friendshipService {
  static base_url: string | undefined;

  static {
    friendshipService.base_url =
      process.env.NODE_ENV == "production"
        ? process.env.PROD_FRIENDSHIP_URL
        : process.env.DEV_FRIENDSHIP_URL;
  }

  static async sendFriendRequest(body: any) {
    return await axios.post(`${this.base_url}`, body);
  }

  static async getFriendRequests(username: string) {
    return await axios.get(`${this.base_url}/requests/${username}`);
  }

  static async listFriends(username: string) {
    return await axios.get(`${this.base_url}/list/${username}`);
  }

  static async respondToFriendRequest(friendshipId: string, body: any) {
    return await axios.patch(`${this.base_url}/respond/${friendshipId}`, body);
  }

  static async removeFriend(body: any) {
    return await axios.delete(`${this.base_url}`, body);
  }
}
