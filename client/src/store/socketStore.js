import { create } from 'zustand';

export const useSocketStore = create((set) => ({
  socket: null,
  onlineUsers: [],
  setSocket: (socket) => set({ socket }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (userId) => set((state) => ({
    onlineUsers: state.onlineUsers.includes(userId)
      ? state.onlineUsers
      : [...state.onlineUsers, userId],
  })),
  removeOnlineUser: (userId) => set((state) => ({
    onlineUsers: state.onlineUsers.filter((id) => id !== userId),
  })),
}));
