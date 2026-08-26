import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getUniversityConfig = () => api.get('/university/config');
export const updateUniversityConfig = (data) => api.post('/university/config', data);
export const getGeneratedPeriods = () => api.get('/university/periods');

export const getDepartments = () => api.get('/departments');
export const createDepartment = (data) => api.post('/departments', data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

export const getSections = () => api.get('/sections');
export const createSection = (data) => api.post('/sections', data);
export const updateSection = (id, data) => api.put(`/sections/${id}`, data);
export const deleteSection = (id) => api.delete(`/sections/${id}`);

export const getFacultyList = () => api.get('/faculty');
export const createFaculty = (data) => api.post('/faculty', data);
export const updateFaculty = (id, data) => api.put(`/faculty/${id}`, data);
export const deleteFaculty = (id) => api.delete(`/faculty/${id}`);

export const getSubjects = () => api.get('/subjects');
export const createSubject = (data) => api.post('/subjects', data);
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);

export const getRooms = () => api.get('/rooms');
export const createRoom = (data) => api.post('/rooms', data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);

export const getPreferences = () => api.get('/preferences');
export const updatePreferences = (data) => api.post('/preferences', data);

export const getValidationReport = () => api.get('/validation');
export const getDashboardStats = () => api.get('/dashboard/stats');

// --- Phase 2 & Phase 3 Scheduler & Export API ---
export const generateTimetable = () => api.post('/scheduler/generate');
export const getGeneratedTimetable = (params) => api.get('/scheduler/timetable', { params });
export const clearGeneratedTimetable = () => api.delete('/scheduler/timetable');
export const getTimetableAudit = () => api.get('/scheduler/audit');
export const exportTimetableCsv = () => api.get('/scheduler/export', { responseType: 'blob' });

export default api;
