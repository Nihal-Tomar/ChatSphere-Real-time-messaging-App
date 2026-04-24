import api from './axios';
export const searchUsers = (q, page = 1) => api.get('/users/search', { params: { q, page } });
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateProfile = (data) => api.patch('/users/profile', data);
export const uploadAvatar = (formData) => api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateStatus = (status) => api.patch('/users/status', { status });
export const blockUser = (id) => api.post(`/users/block/${id}`);
