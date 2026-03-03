// ============================================================
// routes/reports.js — API route for submitting question reports
//
// POST /api/report → save a new report to the database
// ============================================================

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const QuestionSet = require('../models/QuestionSet');

// ------------------------------------------------------------
// POST /api/report
// Saves a report about a potentially incorrect/unclear question
// Body: { questionSetId, questionIndex, reason }
// ------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { questionSetId, questionIndex, reason } = req.body;

    // --- Validation ---
    if (!questionSetId) {
      return res.status(400).json({ success: false, message: 'questionSetId is required' });
    }
    if (questionIndex === undefined || questionIndex === null) {
      return res.status(400).json({ success: false, message: 'questionIndex is required' });
    }
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason (at least 3 characters)',
      });
    }

    // Make sure the question set actually exists
    const set = await QuestionSet.findById(questionSetId);
    if (!set) {
      return res.status(404).json({ success: false, message: 'Question set not found' });
    }

    // Make sure the question index is valid
    if (questionIndex < 0 || questionIndex >= set.questions.length) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }

    // --- Save the report ---
    const report = new Report({ questionSetId, questionIndex, reason: reason.trim() });
    await report.save();

    res.status(201).json({ success: true, message: 'Report submitted. Thank you!' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid question set ID format' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('Error saving report:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
