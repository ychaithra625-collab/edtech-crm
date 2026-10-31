# EdTech CRM & Inquiry Management System

A full-stack web application developed for K12 Hunar to collect, manage, and track inquiries from parents, students, and schools.

## Features

### Public Inquiry Form
- Submit inquiries as a Parent, Student, or School.
- Select an inquiry category: Scholarship, Concert, Admission, or General Query.
- Enter contact details and inquiry messages.
- Store submitted inquiries in a PostgreSQL database.

### Admin Dashboard
- Secure admin login using password hashing and JWT authentication.
- View submitted inquiries.
- Search inquiries by name or phone number.
- Filter inquiries by user type and category.
- Update inquiry status: New, In Progress, or Resolved.
- Refresh the dashboard to view updated records.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | Supabase PostgreSQL |
| Authentication | bcrypt, JSON Web Tokens (JWT) |
| Database connectivity | PostgreSQL (`pg`) |
| Version control | Git, GitHub |

## Project Structure

```text
edtech-crm/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── create-admin.js
│   ├── .env.example
│   └── package.json
├── database/
│   └── schema.sql
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## Local Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/ychaithra625-collab/edtech-crm.git
cd edtech-crm
```

### 2. Set up the database

- Create a Supabase PostgreSQL project.
- Open the Supabase SQL Editor.
- Execute the SQL statements in `database/schema.sql`.

### 3. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as a template and enter your own database credentials and secret values.

Configure these variables:

```env
DB_HOST=your_supabase_host
DB_PORT=5432
DB_NAME=postgres
DB_USER=your_supabase_user
DB_PASSWORD=your_database_password
JWT_SECRET=your_jwt_secret
ADMIN_PASSWORD=your_admin_password
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Create the admin account:

```bash
node create-admin.js
```

Start the backend:

```bash
npm start
```

The backend runs locally at `http://localhost:5000`.

### 4. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local Vite URL shown in the terminal, usually `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Backend health check |
| POST | `/api/inquiries` | Submit a public inquiry |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/inquiries` | Retrieve inquiries (admin authentication required) |
| PUT | `/api/admin/inquiries/:id/status` | Update inquiry status (admin authentication required) |

## Deployment

The application is designed to use:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Supabase PostgreSQL

For deployment, configure the backend environment variables in Render and set `FRONTEND_URL` to the deployed frontend URL. In Vercel, configure `VITE_API_URL` with the deployed backend URL.

## Security

- Admin passwords are hashed using bcrypt.
- Protected admin endpoints use JWT authentication.
- Database credentials and application secrets are stored in environment variables.
- `.env` files should never be committed to GitHub.

## Author

**Chaithra Yerrakagari**

GitHub: https://github.com/ychaithra625-collab/edtech-crm