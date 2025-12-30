import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

// Simple localStorage persistence
const loadAuth = (): { token: string | null; user: User | null } => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Ignore
  }
  return { token: null, user: null };
};

const saveAuth = (token: string | null, user: User | null) => {
  try {
    localStorage.setItem('auth-storage', JSON.stringify({ token, user }));
  } catch (e) {
    // Ignore
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const { token, user } = loadAuth();
  return {
    token,
    user,
    setAuth: (token, user) => {
      set({ token, user });
      saveAuth(token, user);
    },
    logout: () => {
      set({ token: null, user: null });
      localStorage.removeItem('auth-storage');
    },
  };
});

