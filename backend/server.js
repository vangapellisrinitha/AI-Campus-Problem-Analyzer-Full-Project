const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./database/db');

const healthRoutes = require('./routes/healthRoutes');
const problemRoutes = require('./routes/problemRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api', problemRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('AI Campus Problem Analyzer API is active. Access /api/health for system status.');
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error occurred.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});
