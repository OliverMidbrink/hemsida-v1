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
    (set, get) => ({
      user: getStoredUser(),
      loading: false,
      error: null,

      setUser: (user) => set({ user }),
      signOut: () => {
        localStorage.removeItem('auth-storage');
        set({ user: null });
      },
      
      // Get auth header for API requests
      getAuthHeader: () => {
        const { user } = get();
        if (!user || !user.token) return {};
        
        return {
          'Authorization': `Bearer ${user.token}`
        };
      },
      
      // Login function
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/user-api/login', {
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
          const response = await fetch('/user-api/register', {
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

      // Verify token is still valid
      verifyToken: async () => {
        const { user } = get();
        if (!user || !user.token) return false;
        
        try {
          const response = await fetch('/user-api/verify-token', {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          return response.ok;
        } catch (error) {
          console.error('Token verification failed:', error);
          return false;
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