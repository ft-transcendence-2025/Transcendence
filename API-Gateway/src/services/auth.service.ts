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

  static async logout() {
    return await axios.post(
      `${this.base_url}/logout`,
      {}, // No body needed for logout
      {
        withCredentials: true, // Ensure cookies are sent with the request
      }
    );
  }

  static async register(body: any) {
    return await axios.post(`${this.base_url}/register`, body);
  }
}
