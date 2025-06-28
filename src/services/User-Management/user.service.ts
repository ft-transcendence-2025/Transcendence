import axios from "axios";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

export class userService {
  static base_url: string | undefined;

  static {
    userService.base_url =
      process.env.NODE_ENV == "production"
        ? process.env.PROD_USER_URL
        : process.env.DEV_USER_URL;
  }

  static async getUsers() {
    return axios.get(`${this.base_url}/users`);
  }

  static async getUserByUsername(username: string) {
    return axios.get(`${this.base_url}/users/${username}`);
  }

  static async updateUser(username: string, body: any) {
    return axios.put(`${this.base_url}/users/${username}`, body);
  }

  static async disableUser(username: string) {
    return axios.patch(`${this.base_url}/users/${username}`);
  }

  static async deleteUser(username: string) {
    return axios.delete(`${this.base_url}/users/${username}`);
  }
}
