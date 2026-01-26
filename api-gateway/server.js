require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json()); // Optional, mainly for body parsing if needed at gateway level, usually proxy handles streams

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || 'http://localhost:8000';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8001';

console.log(`🔌 Gateway configured with:`);
console.log(`   - Auth: ${AUTH_SERVICE_URL}`);
console.log(`   - Reservation: ${RESERVATION_SERVICE_URL}`);
console.log(`   - Notification: ${NOTIFICATION_SERVICE_URL}`);

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'API Gateway is running 🚀' });
});

// Proxy Routes

// 1. Auth Service
app.use('/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/auth': '', // If auth service expects /login directly without /auth prefix, uncomment this. 
        // BUT usually microservices might be mapped. 
        // Let's assume Auth Service (NestJS) has routes like /auth/login.
        // If NestJS has global prefix, we need to match it.
        // Based on file search, NestJS app controller might be root or have prefix. 
        // Common pattern: Gateway /auth/login -> Service /auth/login.
        // So NO rewrite usually needed if names match.
    },
    onProxyReq: (proxyReq, req, res) => {
        // Log for debug
        console.log(`[Auth] Proxying ${req.method} ${req.path} -> ${AUTH_SERVICE_URL}`);
    }
}));

// 2. Reservation Service
app.use('/reservations', createProxyMiddleware({
    target: RESERVATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        // If reservation service is at /api, we might need to prepend /api or rewrite
        // Based on main.py: prefix="/api"
        // So Gateway /reservations/x -> Service /api/x
        '^/reservations': '/api/reservations',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Reservation] Proxying ${req.method} ${req.path} -> ${RESERVATION_SERVICE_URL}`);
    }
}));

// 3. Notification Service
app.use('/notifications', createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        // FastAPI at /notifications prefix in main.py
        // Service main.py: prefix="/notifications"
        // Gateway /notifications -> Service /notifications
        // So no rewrite needed if path matches
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Notification] Proxying ${req.method} ${req.path} -> ${NOTIFICATION_SERVICE_URL}`);
    }
}));

app.listen(PORT, () => {
    console.log(`gateway running on port ${PORT}`);
});
