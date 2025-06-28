import axios from "axios";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

export class authService {
  static base_url: string | undefined;

  static {
    authService.base_url =
      process.env.NODE_ENV == "production"
        ? process.env.PROD_AUTH_URL
        : process.env.DEV_AUTH_URL;
  }
  static async login(body: any) {
    return await axios.post(`${this.base_url}/login`, body);
  }

  static async register(body: any) {
    return await axios.post(`${this.base_url}/register`, body);
  }

  static async generate2FA(username: string, body: any) {
    return await axios.post(`${this.base_url}/${username}/2fa/generate`, body);
  }

  static async enable2FA(username: string, body: any) {
    return await axios.post(`${this.base_url}/${username}/2fa/enable`, body);
  }

  static async disable2FA(username: string, body: any) {
    return await axios.post(`${this.base_url}/${username}/2fa/disable`, body);
  }
}
