import axios from 'axios';

// Access environment variable for Gateway URL, default to localhost:8080 or the one we see running
// The user's gateway seems to be on 8080 based on my setup, but checking previous output he had issues.
// 2026-01-26T10:09:54 output showed: "gateway running on port 3002" in the end?
// Wait, Step 106 and 107 output "gateway running on port 3002".
// So I should use 3002 or make it configurable. Ideally env var.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to attach token if we have one
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default client;
