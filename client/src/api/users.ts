import { api } from './helpers';

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  // Add other fields as needed
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
