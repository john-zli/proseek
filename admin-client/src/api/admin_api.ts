import { api } from './helpers';
import { Church, ChurchMember } from '@common/server-api/types/churches';
import { SanitizedUser, UserChurchMembership } from '@common/server-api/types/users';

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

export interface InviteUserParams {
  email: string;
  churchId: string;
}

export type ChurchDetail = Church & { members: ChurchMember[] };

export type UserDetail = Omit<SanitizedUser, never> & {
  churchIds: string[];
  creationTimestamp: number;
  modificationTimestamp: number;
  churches: UserChurchMembership[];
};

export const AdminApi = {
  // Churches
  listChurches: () => api.get<Church[]>('/churches'),

  getChurch: (churchId: string) => api.get<ChurchDetail>(`/churches/${churchId}`),

  createChurch: (params: CreateChurchParams) => api.post<{ churchId: string }>('/churches', params),

  updateChurch: (churchId: string, params: UpdateChurchParams) => api.put(`/churches/${churchId}`, params),

  deleteChurch: (churchId: string) => api.delete(`/churches/${churchId}`),

  // Users
  listUsers: () => api.get<SanitizedUser[]>('/users'),

  getUser: (userId: string) => api.get<UserDetail>(`/users/${userId}`),

  updateUser: (userId: string, params: UpdateUserParams) => api.put(`/users/${userId}`, params),

  deleteUser: (userId: string) => api.delete(`/users/${userId}`),

  // Invitations
  inviteUser: (params: InviteUserParams) => api.post<{ message: string }>('/users/invite', params),
};
