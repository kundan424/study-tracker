# Logbook — Study Tracker

A personal study tracker web application to log study sessions, set daily goals, manage tasks, and visualize your consistency over time.

**Tech Stack:** Node.js · Express · MongoDB · Vanilla JS

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd study-tracker
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your MongoDB connection string:

```
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/study-tracker?retryWrites=true&w=majority
```

### 3. Get a MongoDB Atlas URI (if you don't have one)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a free **M0 cluster**
3. Under **Database Access**, create a database user with password
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) for development
5. Click **Connect → Drivers → Node.js** and copy the connection string
6. Paste it in your `.env` file, replacing `<user>` and `<pass>`

### 4. Run

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
study-tracker/
├── server/                  # Backend
│   ├── server.js            # Express app entry point
│   ├── db.js                # MongoDB connection
│   ├── models/              # Mongoose schemas
│   │   ├── Subject.js
│   │   ├── Session.js
│   │   ├── Goal.js
│   │   └── Task.js
│   └── routes/              # API route handlers
│       ├── subjects.js
│       ├── sessions.js
│       ├── goals.js
│       └── tasks.js
├── public/                  # Frontend (served as static files)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js           # App init & tab routing
│       ├── api.js           # Fetch wrapper
│       ├── utils.js         # Date helpers
│       └── components/      # Tab renderers
│           ├── dashboard.js
│           ├── sessions.js
│           ├── subjects.js
│           ├── tasks.js
│           └── calendar.js
├── package.json
├── .env.example
└── .gitignore
```

---

## 🌐 Deploy to Render.com

1. Push your code to a GitHub repository
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variable: `MONGODB_URI` = your Atlas connection string
6. Click **Deploy**

Your app will be live at `https://your-app.onrender.com`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | List all subjects |
| POST | `/api/subjects` | Create a subject |
| PUT | `/api/subjects/:id` | Update a subject |
| DELETE | `/api/subjects/:id` | Delete subject + sessions |
| GET | `/api/sessions` | List sessions (`?from=&to=` filters) |
| GET | `/api/sessions/stats` | Aggregated stats & streaks |
| POST | `/api/sessions` | Log a study session |
| DELETE | `/api/sessions/:id` | Delete a session |
| GET | `/api/goals/today` | Get today's goal |
| PUT | `/api/goals` | Set/update a daily goal |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Toggle/edit a task |
| DELETE | `/api/tasks/:id` | Delete a task |
