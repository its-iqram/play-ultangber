// ============================================================
// server.js — Main entry point for ULTANGBER backend
// This file starts the Express server and connects to MongoDB
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
// Allow cross-origin requests (useful during development)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Serve static frontend files from /public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---- Import Routes ----
const questionSetRoutes = require('./routes/questionSets');
const reportRoutes = require('./routes/reports');

// Attach routes under /api prefix
app.use('/api/question-sets', questionSetRoutes);
app.use('/api/report', reportRoutes);

// ---- Catch-all: Serve index.html for any unmatched route ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ---- Connect to MongoDB Atlas, then start server ----
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Stop app if DB fails
  });
