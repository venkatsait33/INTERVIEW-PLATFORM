/**
 * Interview API Service
 * Wraps all interview-related API calls
 */

import api from './api';

export const interviewService = {
  getAll: (params) => api.get('/interviews', { params }),
  getOne: (id) => api.get(`/interviews/${id}`),
  schedule: (data) => api.post('/interviews', data),
  start: (id) => api.post(`/interviews/${id}/start`),
  joinLobby: (id, token) => api.post(`/interviews/${id}/lobby`, { token }),
  admit: (id) => api.post(`/interviews/${id}/admit`),
  submitFeedback: (id, data) => api.post(`/interviews/${id}/feedback`, data),
  cancel: (id, reason) => api.patch(`/interviews/${id}/cancel`, { reason }),
};

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getInterviewers: () => api.get('/users/list/interviewers'),
  getCandidates: () => api.get('/users/list/candidates'),
  update: (id, data) => api.patch(`/users/${id}`, data),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
};
