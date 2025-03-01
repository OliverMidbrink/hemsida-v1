import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import useAuthStore from './authStore';

// Determine WebSocket URL based on environment
const getWebSocketUrl = (path) => {
  // In development, connect directly to the Python API server
  if (import.meta.env.DEV) {
    return `ws://localhost:8000${path}`;
  }
  
  // In production, use relative URL (assumes same domain)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
};

const useWebSocketStore = create((set, get) => ({
  clientId: `client-${uuidv4()}`,
  socket: null,
  connected: false,
  error: null,
  
  setSocket: (socket) => set({ socket }),
  
  connect: () => {
    const { socket, clientId } = get();
    const user = useAuthStore.getState().user;
    
    // Close existing connection if any
    if (socket) {
      socket.close();
    }
    
    if (!user || !user.token) {
      set({ error: 'Authentication required', connected: false });
      return;
    }
    
    try {
      // Create WebSocket connection with JWT token
      const wsUrl = getWebSocketUrl(`/data-api/ws/${clientId}?token=${user.token}`);
      console.log('Connecting to WebSocket:', wsUrl);
      
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connected');
        set({ socket: newSocket, connected: true, error: null });
      };
      
      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        set({ connected: false });
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({ error: 'Connection error', connected: false });
      };
      
      set({ socket: newSocket });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      set({ error: error.message, connected: false });
    }
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ socket: null, connected: false });
  }
}));

export default useWebSocketStore; 