import client from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  
  register: async (credentials: LoginCredentials): Promise<void> => {
    await client.post('/auth/register', credentials);
  },
  
  me: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },
};

