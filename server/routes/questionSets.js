// ============================================================
// routes/questionSets.js — API routes for question sets
//
// GET  /api/question-sets           → list all question sets
// POST /api/question-sets           → create a new question set
// GET  /api/question-sets/:id/random-question → get one random Q
// ============================================================

const express = require('express');
const router = express.Router();
const QuestionSet = require('../models/QuestionSet');

// ------------------------------------------------------------
// GET /api/question-sets
// Returns all question sets (only title, subject, createdAt)
// Used to populate the dropdown on the dashboard
// ------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    // Fetch all sets but only return a few fields (lean = faster)
    const sets = await QuestionSet.find(
      {},
      { title: 1, subject: 1, createdAt: 1, 'questions.0': 1 }
    ).lean();

    res.json({ success: true, data: sets });
  } catch (err) {
    console.error('Error fetching question sets:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------------------------------------------------
// POST /api/question-sets
// Creates a new question set
// Body: { title, subject, questions: [{ question, answer, difficulty }] }
// ------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { title, subject, questions } = req.body;

    // --- Manual validation ---
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!subject || subject.trim() === '') {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    if (!questions || !Array.isArray(questions) || questions.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'At least one question is required',
      });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.question || q.question.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: must be at least 6 characters`,
        });
      }
      if (!q.answer || q.answer.trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: answer cannot be empty`,
        });
      }
    }

    // --- Create and save to database ---
    const newSet = new QuestionSet({ title, subject, questions });
    const saved = await newSet.save();

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    // Handle Mongoose validation errors nicely
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('Error creating question set:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------------------------------------------------
// GET /api/question-sets/:id/random-question
// Returns one random question from the specified question set
// Also returns the index (for reporting purposes)
// ------------------------------------------------------------
router.get('/:id/random-question', async (req, res) => {
  try {
    const set = await QuestionSet.findById(req.params.id);

    if (!set) {
      return res.status(404).json({ success: false, message: 'Question set not found' });
    }

    if (set.questions.length === 0) {
      return res.status(400).json({ success: false, message: 'This set has no questions' });
    }

    // Pick a random index
    const randomIndex = Math.floor(Math.random() * set.questions.length);
    const question = set.questions[randomIndex];

    res.json({
      success: true,
      data: {
        questionSetId: set._id,
        questionIndex: randomIndex,
        question: question.question,
        answer: question.answer,
        difficulty: question.difficulty,
      },
    });
  } catch (err) {
    // Handle invalid MongoDB ID format
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid question set ID' });
    }
    console.error('Error fetching random question:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
