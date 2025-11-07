# 🏓 Pickleball Court Reservation System - Backend

This is the **backend server** for the **Pickleball Court Reservation System**, developed by **Team Stakloy Gray AVR Chapter** for **IT321 – Fundamentals of Systems Integration & Architecture**.

The backend handles **user authentication**, **court management**, and **court reservations**, providing RESTful APIs for frontend integration.

## 👥 Team Members
- **Ryle Gabotero** – Fullstack Developer
- **Dave Ilagan** – Documentation & Design
- **Jan Michael Lanciso** – Frontend Developer

## 🧠 Project Overview
The system provides a **digital solution** to replace the manual process of booking pickleball courts.  
It allows players to easily **view court availability**, **book time slots**, and **receive confirmations**, while admins can **approve reservations** and **manage court schedules**.

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL (via `mysql2`) |
| Authentication | JWT (JSON Web Token) |
| Environment Config | dotenv |
| Error Handling | Custom middleware (`errorHandler.js`) |
| Logging (optional) | morgan |
| CORS & Security | cors |

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── courtController.js
│   │   └── reservationController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── courtRoutes.js
│   │   └── reservationRoutes.js
│   ├── app.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## 🧩 Environment Variables

Create a `.env` file in the root directory with the following keys:

```
PORT=8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=pickleball_db
JWT_SECRET=supersecretkey
```

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/pickleball-backend.git
cd pickleball-backend
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Setup Database
```sql
CREATE DATABASE pickleball_db;
USE pickleball_db;
```

Then run your table creation queries as described in documentation.

## 🧪 API Routes Overview

### 🔐 Auth Routes
| Method | Endpoint | Description | Access |
|--------|-----------|--------------|--------|
| POST | `/auth/register` | Register a new player | Public |
| POST | `/auth/login` | Login and get token | Public |
| GET | `/auth/profile` | Get logged-in user info | Authenticated |

### 🏟️ Court Routes
| Method | Endpoint | Description | Access |
|--------|-----------|--------------|--------|
| GET | `/courts` | List all courts | Public |
| POST | `/courts` | Add new court | Admin |
| PUT | `/courts/:id` | Update court details | Admin |
| DELETE | `/courts/:id` | Delete a court | Admin |

### 📅 Reservation Routes
| Method | Endpoint | Description | Access |
|--------|-----------|--------------|--------|
| GET | `/reservations` | List reservations (user/admin) | Authenticated |
| POST | `/reservations` | Create new booking | Player |
| PUT | `/reservations/:id` | Edit booking | Player/Admin |
| PUT | `/reservations/:id/approve` | Approve booking | Admin |
| DELETE | `/reservations/:id` | Cancel booking | Player/Admin |

## 🧰 Error Handling

Centralized in `middleware/errorHandler.js`.

## 📌 Notes
- Always send `Authorization: Bearer <token>` for protected routes.
- Admin routes should only be accessible to users with `role: 'admin'`.
- Add notification integration (SMS/Email) later.

## 📄 License
This project is created for academic purposes under IT321 – Systems Integration & Architecture.
All rights reserved © 2025 Team Stakloy Gray AVR Chapter.
