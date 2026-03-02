import axios from 'axios';
import { useAuthStore } from './store';

// We rely on the local running FastAPI instance mapping to 127.0.0.1:8000
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token dynamically 
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // standard OAuth2 format
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
