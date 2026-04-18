import { apiEndpoints } from '@/api/endpoints';
import { httpClient } from '@/api/http-client';
import type { LoginRequest, SignupRequest, User } from '@/api/models';
import {
  clearAuthStorage,
  setAccessToken,
  setStoredUser,
} from '@/api/token-storage';

export const authApi = {
  async login(credentials: LoginRequest): Promise<string> {
    const response = await httpClient.post<string>(apiEndpoints.auth.login, credentials);
    const token = response.data;
    if (token) {
      setAccessToken(token);
    }
    return token;
  },

  signup(payload: SignupRequest) {
    return httpClient.post<null>(apiEndpoints.auth.signup, payload);
  },

  getMe() {
    return httpClient.get<User>(apiEndpoints.auth.me, { auth: true });
  },

  async loginAndLoadUser(credentials: LoginRequest): Promise<User> {
    await this.login(credentials);
    const me = await this.getMe();
    setStoredUser(me.data);
    return me.data;
  },

  logout() {
    clearAuthStorage();
  },
};

