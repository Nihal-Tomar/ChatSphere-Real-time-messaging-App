import api from './axios';
export const getMessages = (chatId, cursor, limit = 30) => api.get(`/messages/${chatId}`, { params: { cursor, limit } });
export const sendMessage = (formData, onUploadProgress) => api.post('/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress });
export const editMessage = (id, content) => api.patch(`/messages/${id}`, { content });
export const deleteMessage = (id) => api.delete(`/messages/${id}`);
export const reactToMessage = (id, emoji) => api.post(`/messages/${id}/react`, { emoji });
export const pinMessage = (id) => api.post(`/messages/${id}/pin`);
export const searchMessages = (chatId, q) => api.get('/messages/search', { params: { chatId, q } });
export const markMessagesRead = (chatId) => api.post(`/messages/${chatId}/read`);
