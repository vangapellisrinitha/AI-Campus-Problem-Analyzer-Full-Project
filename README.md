# AI Campus Problem Analyzer

A smart college campus issue reporting and resolution tracking system.

## Project Structure

```
AI-Campus-Problem-Analyzer/
├── backend/
│   ├── controllers/         # Request handling logic
│   │   └── healthController.js
│   ├── database/            # Database configuration (SQLite)
│   ├── middleware/          # Custom Express middlewares
│   ├── routes/              # Express API route declarations
│   │   └── healthRoutes.js
│   ├── services/            # Business & AI integration logic
│   ├── .env.example         # Example environment configuration
│   ├── package.json         # Backend dependencies & scripts
│   └── server.js            # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application views
│   │   ├── services/        # Frontend API call services
│   │   │   └── api.js
│   │   ├── App.css          # Core application styling
│   │   ├── App.jsx          # Root React component
│   │   ├── index.css        # Base styling & theme variables
│   │   └── main.jsx         # Vite React entry point
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies & scripts
│   └── vite.config.js       # Vite build configuration
├── .gitignore
└── README.md
```

## How to Run

### 1. Start the Backend

Open a terminal in the `backend` directory:

```bash
cd backend
npm install
npm run dev
```

The backend server will run on: `http://localhost:5000`
Health check endpoint: `http://localhost:5000/api/health`

### 2. Start the Frontend

Open a second terminal in the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will run on: `http://localhost:5173`
