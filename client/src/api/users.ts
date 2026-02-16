import { api } from '@client/api/helpers';
import { SanitizedUser } from '@common/server-api/types/users';

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: SanitizedUser;
}

export interface InvitationInfo {
  targetEmail: string;
  churchName: string;
}

export interface RegisterParams {
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  password: string;
  invitationCode: string;
}

export const UsersApi = {
  login: async (params: LoginParams): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/users/login', params);
      return response;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to log in');
    }
  },

  getInvitation: (code: string): Promise<InvitationInfo> => {
    return api.get<InvitationInfo>(`/users/invitation?code=${encodeURIComponent(code)}`);
  },

  register: (params: RegisterParams): Promise<{ userId: string }> => {
    return api.post<{ userId: string }>('/users/', params);
  },

  logout: (): Promise<void> => {
    return api.post('/users/logout', {});
  },
};
