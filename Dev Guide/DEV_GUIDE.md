# Frontend Developer Guide

This document provides details on how the frontend (React + Vite + Axios) integrates with the backend API using JWT authentication.

---

## 🌐 Base Configuration

**Base URL**
```
http://localhost:8080
```

All API calls should use this base URL. You can store it in an environment variable for flexibility:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

In your frontend code:
```js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## 🔑 Authentication Flow (JWT)

### 1. Login

**Endpoint**
```
POST /auth/login
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```

### 2. Using JWT in Requests

After login, save the token (usually in memory, context, or `localStorage`):

```js
localStorage.setItem("token", data.token);
```

Then include it in your Axios headers for **authenticated routes**:

```js
import axios from "axios";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

This automatically adds:
```
Authorization: Bearer <JWT_TOKEN>
```
to every request.

---

## 🧭 Authenticated Routes (Protected)

All protected routes require a **valid JWT** in the header.  
If the token is missing or expired, the server will respond with a `401 Unauthorized`.

Example usage:
```js
const res = await api.get("/users/me");
```

### Example Response
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

If the token is invalid:
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

---

## 🚪 Logout

You can simply remove the JWT from storage:
```js
localStorage.removeItem("token");
```

Or, if a refresh system is implemented:
```
POST /auth/logout
```

---

## 🧱 API Reference

| Endpoint            | Method | Description                | Auth Required | Example Headers |
|---------------------|---------|-----------------------------|----------------|-----------------|
| `/auth/register`    | POST   | Create a new user          | ❌ No | — |
| `/auth/login`       | POST   | Authenticate user           | ❌ No | — |
| `/users`            | GET    | Fetch all users             | ✅ Yes | `Authorization: Bearer <token>` |
| `/users/:id`        | GET    | Get user by ID              | ✅ Yes | `Authorization: Bearer <token>` |
| `/users`            | POST   | Create a new user           | ✅ Yes | `Authorization: Bearer <token>` |
| `/users/:id`        | PUT    | Update user                 | ✅ Yes | `Authorization: Bearer <token>` |
| `/users/:id`        | DELETE | Delete user                 | ✅ Yes | `Authorization: Bearer <token>` |

---

## ⚠️ Error Responses

| Code | Message | Meaning |
|------|----------|----------|
| `400` | Bad Request | Invalid data sent |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Endpoint or resource not found |
| `500` | Server Error | Internal backend issue |

**Example error response**
```json
{
  "success": false,
  "message": "Unauthorized access - invalid token"
}
```

---

## 🧩 Example Integration

Here’s a login + fetch user flow in React:

```js
import api from "./services/api";

export async function loginUser(email, password) {
  const res = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
}

export async function getCurrentUser() {
  const res = await api.get("/users/me");
  return res.data;
}
```

---

## 🧠 Developer Notes

- Always attach `Authorization` headers for protected endpoints.
- Tokens expire; implement a refresh system if required.
- Never expose JWTs in URLs or logs.
- When deploying frontend, use `.env` to set the backend base URL dynamically.

---

© 2025 Team Stakloy Gray AVR Chapter. All rights reserved.
