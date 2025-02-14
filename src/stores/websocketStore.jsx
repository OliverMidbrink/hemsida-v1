import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const useWebSocketStore = create((set) => ({
  socket: null,
  clientId: uuidv4(),
  setSocket: (socket) => set({ socket }),
}));

export default useWebSocketStore; 