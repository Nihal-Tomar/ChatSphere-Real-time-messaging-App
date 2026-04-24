import { create } from 'zustand';
import * as chatApi from '../api/chat.api';
import * as messageApi from '../api/message.api';
import * as msgApi from '../api/message.api';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},      // { chatId: Message[] }
  hasMore: {},       // { chatId: boolean }
  cursors: {},       // { chatId: string }
  typingUsers: {},   // { chatId: Set<userId> }
  isLoadingChats: false,
  isLoadingMessages: false,

  // ── Chats ───────────────────────────────────────────────────────────────────
  fetchChats: async () => {
    set({ isLoadingChats: true });
    try {
      const { data } = await chatApi.getMyChats();
      set({ chats: data.data.chats, isLoadingChats: false });
    } catch { set({ isLoadingChats: false }); }
  },

  setActiveChat: (chat) => set({ activeChat: chat }),

  addOrUpdateChat: (chat) => set((state) => {
    const exists = state.chats.find((c) => c._id === chat._id);
    if (exists) {
      return { chats: state.chats.map((c) => c._id === chat._id ? { ...c, ...chat } : c) };
    }
    return { chats: [chat, ...state.chats] };
  }),

  updateChatLastMessage: (chatId, message) => set((state) => ({
    chats: state.chats
      .map((c) => c._id === chatId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
  })),

  incrementUnread: (chatId) => set((state) => ({
    chats: state.chats.map((c) =>
      c._id === chatId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
    ),
  })),

  clearUnread: (chatId) => set((state) => ({
    chats: state.chats.map((c) => c._id === chatId ? { ...c, unreadCount: 0 } : c),
  })),

  // ── Messages ─────────────────────────────────────────────────────────────────
  fetchMessages: async (chatId, reset = false) => {
    const { cursors, hasMore, messages } = get();
    if (!reset && hasMore[chatId] === false) return;
    set({ isLoadingMessages: true });
    try {
      const cursor = reset ? undefined : cursors[chatId];
      const { data } = await messageApi.getMessages(chatId, cursor);
      const { messages: newMsgs, hasMore: more, nextCursor } = data.data;
      set({
        messages: {
          ...messages,
          [chatId]: reset ? newMsgs : [...newMsgs, ...(messages[chatId] || [])],
        },
        hasMore: { ...hasMore, [chatId]: more },
        cursors: { ...cursors, [chatId]: nextCursor },
        isLoadingMessages: false,
      });
    } catch { set({ isLoadingMessages: false }); }
  },

  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message],
    },
  })),

  updateMessage: (chatId, messageId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).map((m) =>
        m._id === messageId ? { ...m, ...updates } : m
      ),
    },
  })),

  removeMessage: (chatId, messageId) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted', attachments: [] } : m
      ),
    },
  })),

  updateReactions: (chatId, messageId, reactions) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).map((m) =>
        m._id === messageId ? { ...m, reactions } : m
      ),
    },
  })),

  markChatAsRead: async (chatId) => {
    try {
      await chatApi.markChatAsRead(chatId);
      set((state) => ({
        chats: state.chats.map((c) => c._id === chatId ? { ...c, unreadCount: 0 } : c),
      }));
    } catch { /* silent */ }
  },

  // ── Typing ───────────────────────────────────────────────────────────────────
  setTyping: (chatId, userId, isTyping) => set((state) => {
    const current = new Set(state.typingUsers[chatId] || []);
    if (isTyping) current.add(userId); else current.delete(userId);
    return { typingUsers: { ...state.typingUsers, [chatId]: current } };
  }),
}));
