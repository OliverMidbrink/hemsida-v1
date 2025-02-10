import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Safely parse stored user
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

const useAuthStore = create(
  persist(
    (set) => ({
      user: getStoredUser(),
      loading: false,
      error: null,

      setUser: (user) => set({ user }),
      signOut: () => {
        localStorage.removeItem('auth-storage');
        set({ user: null });
      },
      
      // Login function
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
          }

          const user = await response.json();
          set({ user, loading: false });
          return user;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Register function
      register: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
          }

          const user = await response.json();
          set({ user, loading: false });
          return user;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage', // name of the item in localStorage
      getStorage: () => localStorage, // storage provider
    }
  )
);

export default useAuthStore; 