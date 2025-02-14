import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const useWebSocketStore = create((set, get) => ({
  clientId: `client-${uuidv4()}`,
  socket: null,
  setSocket: (socket) => set({ socket }),
}));

export default useWebSocketStore; 