const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');
const apiRoutes = require('./routes/api');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: '*', // For development, allow all. In production, restrict to frontend url.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Test DB Connection and Start Server
async function startServer() {
  try {
    // Attempt to connect to the pool to verify database connectivity
    console.log('Verifying database connectivity...');
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database.');
    connection.release();

    app.listen(PORT, () => {
      console.log(`FocusFlow AI Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('DATABASE CONNECTION FAILURE:');
    console.error(err.message);
    console.error('\nEnsure MySQL is running and database configuration in backend/.env is correct.');
    console.error('You can run "npm run seed" to automatically create the database and tables.\n');
    
    // Still start server so API failure is graceful and debuggable
    app.listen(PORT, () => {
      console.log(`FocusFlow AI Backend running on port ${PORT} (Database Offline)`);
    });
  }
}

startServer();
