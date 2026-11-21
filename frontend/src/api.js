import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const errMsg = (e) => e?.response?.data?.message || e.message || 'Something went wrong.';
export const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
export const daysBetween = (s, e) => Math.round((new Date(e) - new Date(s)) / 86400000);
export default api;
export const todayLocal = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
