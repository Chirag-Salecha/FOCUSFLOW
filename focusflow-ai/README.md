# FocusFlow AI - Student Productivity & Proctoring Hub

FocusFlow AI is an AI-assisted student productivity platform featuring task management, webcam-based focus tracking with automatic tab-switching detection, subject attendance logs, performance analytics via Recharts, Pomodoro timers with built-in alarm chimes, and rules-based dynamic AI productivity recommendations.

---

## Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide icons, React-Webcam, Recharts.
- **Backend**: Node.js, Express, JWT, Bcrypt.
- **Database**: MySQL (handled via `mysql2/promise` pool connection).

---

## Directory Structure

```text
focusflow-ai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js          # MySQL connection pool
│   │   │   ├── schema.sql     # Database tables initialization
│   │   │   └── seed.js        # Seed file to inject mock student data
│   │   ├── controllers/       # Modular controllers (auth, tasks, attendance, insights, user, sessions)
│   │   ├── middleware/        # JWT auth protection middleware
│   │   ├── routes/            # Express API route mapping
│   │   └── index.js           # Server startup script
│   ├── .env                   # Environment config variables
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/        # Navigation sidebar, navbar with live clock, profile widgets
    │   ├── context/           # AuthContext managing user login, logout, and authenticated fetch helpers
    │   ├── pages/             # Layout view modules (Dashboard, Tasks, Camera, Pomodoro, Analytics, etc.)
    │   ├── App.jsx            # Routing manager
    │   ├── index.css          # Cyber glassmorphic UI base styling layers
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    └── package.json
```

---

## Installation & Setup Instructions

### Step 1: Set Up Environment Configuration
1. Open [backend/.env](file:///C:/Users/chira/.gemini/antigravity/scratch/focusflow-ai/backend/.env).
2. Configure your MySQL credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=YOUR_ACTUAL_MYSQL_PASSWORD
   DB_NAME=focusflow_ai
   ```

### Step 2: Seed the Database
Seed the database tables and sample records (which populates the charts and AI recommendations immediately):
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Run the seed script:
   ```bash
   npm run seed
   ```

### Step 3: Start the Backend API Server
Start the backend server on port 5000:
```bash
npm start
```
*(If you want to use nodemon for developer auto-reloads, you can run `npm run dev`)*.

### Step 4: Start the Frontend Client
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Start the Vite dev server on port 5173:
   ```bash
   npm run dev
   ```

---

## How to Test the App

1. Open your browser and navigate to `http://localhost:5173`.
2. You will be greeted by the **Login Page**.
3. Log in using the seeded test account:
   - **Email**: `student@focusflow.ai`
   - **Password**: `password123`
4. Once logged in, explore the modules via the **Left Sidebar**:
   - **Dashboard**: Core summary cards and live clocks.
   - **Tasks**: Create and mark tasks as complete.
   - **AI Focus Camera**: Start a focus session. *Switch browser tabs to trigger warnings and tab-violation logs!*
   - **Attendance**: Increment subject ratios to see low-attendance alarms (e.g. DBMS).
   - **Analytics**: Visualize real log distributions (area and bar charts).
   - **Pomodoro Timer**: Launch standard or custom pomodoro countdowns with synth chimes.
   - **AI Insights**: Review personalized recommendations compiled on the fly.
