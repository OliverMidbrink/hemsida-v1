export const simpleAuth = {
  signIn: async (email, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      return response.json();
    } catch (error) {
      console.error('SignIn service error:', error);
      throw error;
    }
  },

  signUp: async (email, password) => {
    try {
      console.log('Sending registration request:', { email }); // Debug log
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration response:', data); // Debug log
      return data;
    } catch (error) {
      console.error('SignUp service error:', error);
      throw error;
    }
  },

  signOut: () => {
    localStorage.removeItem('user');
    return Promise.resolve();
  }
}; 