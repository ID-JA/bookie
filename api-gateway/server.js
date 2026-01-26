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

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || 'http://localhost:jj';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8000';

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
app.use(createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/auth/login', '/auth/signin'],
    pathRewrite: {
        '/auth/login': '/auth/login',
        '/auth/signin': '/auth/signin',
    },

    timeout: 15000,
    proxyTimeout: 15000,

    onError(err, req, res) {
        console.error('[Auth] Proxy error:', err.message);
        res.status(502).json({ message: 'Bad Gateway', error: err.message });
    },

    onProxyReq(proxyReq, req, res) {
        console.log(`[Auth] Proxying ${req.method} ${req.originalUrl} -> ${AUTH_SERVICE_URL}${proxyReq.path}`);
    },
}));

// 2. Reservation Service
app.use(createProxyMiddleware({
    target: RESERVATION_SERVICE_URL,
    changeOrigin: true,
    timeout: 15000,
    proxyTimeout: 15000,

    pathFilter: ['/reservations', '/rooms/available', '/rooms'],
    pathRewrite: {
        '/reservations': '/reservations',
        '/rooms/available': '/rooms/available',
        '/rooms': '/rooms',
    },


    onError(err, req, res) {
        console.error('[Reservation] Proxy error:', err.message);
        res.status(502).json({ message: 'Bad Gateway', error: err.message });
    },

    onProxyReq(proxyReq, req, res) {
        console.log(`[Reservation] Proxying ${req.method} ${req.originalUrl} -> ${RESERVATION_SERVICE_URL}${proxyReq.path}`);
    },
}));

// 3. Notification Service
app.use(createProxyMiddleware({
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

app.use(express.json()); // Optional, mainly for body parsing if needed at gateway level, usually proxy handles streams


app.listen(PORT, () => {
    console.log(`gateway running on port ${PORT}`);
});
