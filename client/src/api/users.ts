import { api } from './helpers';
import { SanitizedUser } from '@common/server-api/types/users';

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: SanitizedUser;
}

export const UsersApi = {
  login: async (params: LoginParams): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/users/login', params);
      return response;
    } catch (error) {
      throw new Error('Failed to log in');
    }
  },
};
