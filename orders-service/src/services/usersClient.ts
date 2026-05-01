import axios, { AxiosInstance } from "axios";
import { User } from "../types";
import { logger } from "../logger";

export class UsersClient {
  private http: AxiosInstance;

  constructor(baseURL: string) {
    this.http = axios.create({ baseURL, timeout: 5000 });
  }

  async getUser(userId: number): Promise<User | null> {
    try {
      const res = await this.http.get<User>(`/users/${userId}`);
      logger.info("Fetched user from Users service", { userId });
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      logger.error("Users service call failed", { userId, error: err.message });
      throw new Error(`Users service unavailable: ${err.message}`);
    }
  }

  async userExists(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    return user !== null;
  }
}
