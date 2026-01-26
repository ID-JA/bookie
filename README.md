# Bookie - Hotel Reservation System

Bookie is a cloud-based microservices application for hotel reservations. It consists of authenticated user management, hotel room browsing/booking, and email notifications.

## 🏗 System Architecture

The project is structured as follows:

| Service | Technology | Port | Description |
|---------|------------|------|-------------|
| **Web App** | React, Vite, Tailwind | `5173` | Frontend User Interface |
| **API Gateway** | Node.js, Express | `3002` | Centralized entry point & proxy |
| **Auth Service** | NestJS | `3001` | User authentication (JWT) |
| **Reservation Service** | FastAPI (Python) | `8001` | Room & Reservation management |
| **Notification Service** | FastAPI (Python) | `8000` | Email notifications & Logging |

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Python 3.9+
- MongoDB (Atlas or Local)
- RabbitMQ (Optional, for future async messaging)

### 1. Auth Service
Handles Sign Up and Login.
```bash
cd auth-service
npm install
# Ensure .env has MONGO_URI
npm run start:dev
```

### 2. Reservation Service
Handles Room listings and Booking logic.
```bash
cd reservation-service
# Create venv if needed
pip install -r requirements.txt
# Ensure .env has MONGO_URI
uvicorn app.main:app --reload --port 8001
```

### 3. Notification Service
Handles sending confirmation emails.
```bash
cd notification-service
pip install -r requirements.txt
# Ensure .env has MONGO_URI and SMTP credentials
uvicorn app.main:app --reload --port 8000
```

### 4. API Gateway
Routes requests from the Web App to the appropriate microservice.
```bash
cd api-gateway
npm install
# Ensure .env has service URLs configured
npm run start:dev
```

### 5. Web App
The user-facing frontend.
```bash
cd web-app
npm install
npm run dev
```

## 🛠 Features

- **User Authentication**: Secure Sign-up and Login.
- **Room Search**: Browse available rooms by date range.
- **Booking**: Instant reservation creation with real-time availability checks.
- **Microservices Pattern**: Decoupled services communicating via HTTP (proxied by Gateway).

## 📡 API Endpoints

The API Gateway (`http://localhost:3002`) routes requests to the following services:

### 🔐 Auth Service (`/auth` -> `:3001`)
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/auth/signup` | Register a new user | `{ "email": "...", "password": "...", "name": "..." }` |
| `POST` | `/auth/login` | Log in and get JWT | `{ "email": "...", "password": "..." }` |

### 🏨 Reservation Service (`/reservations` -> `:8001/reservations`)
*Directly maps `/api` prefix from service if applicable, or logic handles it.*
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/reservations` | Create a reservation | `{ "room_id": "...", "user_id": "...", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD" }` |
| `GET` | `/reservations/user/:id` | Get user reservations | N/A |
| `POST` | `/rooms` | Add a new room | `{ "room_number": "101", "room_type": "Suite", "price": 150 }` |
| `GET` | `/rooms/available` | Search available rooms | Query: `?start_date=...&end_date=...` |

### 📧 Notification Service (`/notifications` -> `:8000/notifications`)
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/notifications/send` | Send an email | `{ "email": "...", "type": "reservation|cancellation..." }` |

