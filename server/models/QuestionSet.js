// ============================================================
// models/QuestionSet.js — Mongoose schema for question sets
// A "question set" is a collection of quiz questions
// created by a teacher or student (no login required)
// ============================================================

const mongoose = require('mongoose');

// --- Sub-schema: individual question inside a set ---
const QuestionSchema = new mongoose.Schema({
  // The actual question text (e.g. "What is 5 + 3?")
  question: {
    type: String,
    required: [true, 'Question text is required'],
    minlength: [6, 'Question must be at least 6 characters long'],
    trim: true,
  },

  // The correct answer (e.g. "8")
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
  },

  // Difficulty level for the question
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  },
});

// --- Main schema: a named collection of questions ---
const QuestionSetSchema = new mongoose.Schema(
  {
    // Name of the question set (e.g. "Grade 5 Math Quiz")
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    // Subject of the questions (e.g. "Mathematics", "Science")
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },

    // Array of questions — must have at least 1
    questions: {
      type: [QuestionSchema],
      validate: {
        validator: function (arr) {
          return arr.length >= 1; // Minimum 1 question required
        },
        message: 'A question set must have at least one question',
      },
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

module.exports = mongoose.model('QuestionSet', QuestionSetSchema);
