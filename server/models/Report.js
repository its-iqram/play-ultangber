// ============================================================
// models/Report.js — Mongoose schema for reported questions
// When a player thinks a question is wrong or unclear,
// they can report it. Reports are saved here.
// ============================================================

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    // Which question set does this question belong to?
    questionSetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionSet', // References the QuestionSet collection
      required: [true, 'Question Set ID is required'],
    },

    // The index of the question inside the set's `questions` array
    // (e.g. index 0 = first question, index 2 = third question)
    questionIndex: {
      type: Number,
      required: [true, 'Question index is required'],
      min: [0, 'Index cannot be negative'],
    },

    // Short explanation from the player about why they reported
    reason: {
      type: String,
      required: [true, 'Please provide a reason for reporting'],
      trim: true,
      minlength: [3, 'Reason must be at least 3 characters'],
    },
  },
  {
    // Automatically adds createdAt (used as reportedAt) and updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', ReportSchema);
