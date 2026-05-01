import axios from "axios";

export interface User {
  id: number;
  name: string;
  email: string;
}

export const createUserClient = (baseURL: string) => ({
  getUsers: (): Promise<User[]> =>
    axios.get(`${baseURL}/users`).then((r) => r.data),

  getUserById: (id: number): Promise<User> =>
    axios.get(`${baseURL}/users/${id}`).then((r) => r.data),
});
