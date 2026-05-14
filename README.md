# Task Board Web Application

A full-stack Task Board Web Application built for an IT company (10–50 users). It features a KanBan board, Role-Based Access Control (RBAC), Magic Link Invite System, and a robust Activity Log.

## Tech Stack
- **Frontend**: React, Vite, React Router, React Hot Toast, Dnd-Kit, Recharts
- **Backend**: Node.js, Express, better-sqlite3, jsonwebtoken, nodemailer
- **Database**: SQLite (local database)

## Prerequisites
- Node.js 18+

## Setup Instructions

### 1. Install Dependencies
Install dependencies for both the backend and frontend:
```bash
# In the backend directory
cd backend
npm install

# In the frontend directory
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory with the following contents:
```env
PORT=5000
JWT_SECRET=super_secret_jwt_key
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=test
SMTP_PASS=test
FRONTEND_URL=http://localhost:5173
```
*Note: Update SMTP settings with real credentials for production or testing real emails. If email fails, the invite link will be provided in the UI.*

### 3. Start the Backend
Start the backend server (this will automatically create `database.db` and seed the admin user):
```bash
cd backend
node server.js
```

### 4. Start the Frontend
In a new terminal window, start the React Vite app:
```bash
cd frontend
npm run dev
```

## Default Credentials
On first run, the database seeds a default admin user:
- **Email**: `admin@company.com`
- **Password**: `Admin@123`

## Features Included
- **Admin & User Dashboards**
- **Kanban Board** with Drag-and-Drop capability
- **Roles & Permissions Module**
- **Invite-Based User Onboarding**
- **Detailed Activity Logs**
- **Sleek Light-Mode UI**
