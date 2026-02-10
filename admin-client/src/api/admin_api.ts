import { api } from './helpers';
import { SessionData } from '@common/server-api/types/session';
import { SanitizedUser } from '@common/server-api/types/users';

export interface Church {
  churchId: string;
  name: string;
  zip: string;
  county: string;
  city: string;
  state: string;
  address: string;
  email: string;
}

export interface CreateChurchParams {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
}

export interface UpdateChurchParams {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  email: string;
}

export interface UpdateUserParams {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
}

export const AdminApi = {
  // Auth
  login: (params: { email: string; password: string }) => api.post<{ user: SanitizedUser }>('/login', params),

  logout: () => api.post('/logout', {}),

  getSession: () => api.get<SessionData>('/session'),

  // Churches
  listChurches: () => api.get<Church[]>('/churches'),

  getChurch: (churchId: string) => api.get<Church>(`/churches/${churchId}`),

  createChurch: (params: CreateChurchParams) => api.post<{ churchId: string }>('/churches', params),

  updateChurch: (churchId: string, params: UpdateChurchParams) => api.put(`/churches/${churchId}`, params),

  deleteChurch: (churchId: string) => api.delete(`/churches/${churchId}`),

  // Users
  listUsers: () => api.get<SanitizedUser[]>('/users'),

  getUser: (userId: string) => api.get<SanitizedUser>(`/users/${userId}`),

  updateUser: (userId: string, params: UpdateUserParams) => api.put(`/users/${userId}`, params),

  deleteUser: (userId: string) => api.delete(`/users/${userId}`),
};
