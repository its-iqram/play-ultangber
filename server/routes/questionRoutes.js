const express = require("express");
const router = express.Router();
const QuestionSet = require("../models/QuestionSet");
const Report = require("../models/Report");

// ==============================
// GET ALL QUESTION SETS
// ==============================
router.get("/question-sets", async (req, res) => {
  try {
    const sets = await QuestionSet.find();
    res.json(sets);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ==============================
// CREATE QUESTION SET
// ==============================
router.post("/question-sets", async (req, res) => {
  try {
    const { title, subject, questions } = req.body;

    if (!title || !subject || !questions || questions.length === 0) {
      return res.status(400).json({ error: "Invalid data" });
    }

    for (let q of questions) {
      if (!q.question || q.question.length < 5 || !q.answer) {
        return res.status(400).json({ error: "Invalid question format" });
      }
    }

    const newSet = new QuestionSet({ title, subject, questions });
    await newSet.save();

    res.status(201).json(newSet);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ==============================
// GET RANDOM QUESTION
// ==============================
router.get("/question-sets/:id/random-question", async (req, res) => {
  try {
    const set = await QuestionSet.findById(req.params.id);

    if (!set) return res.status(404).json({ error: "Not found" });

    const index = Math.floor(Math.random() * set.questions.length);
    const question = set.questions[index];

    res.json({
      question,
      index
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ==============================
// REPORT QUESTION
// ==============================
router.post("/report", async (req, res) => {
  try {
    const { questionSetId, questionIndex, reason } = req.body;

    if (!questionSetId || questionIndex === undefined || !reason) {
      return res.status(400).json({ error: "Invalid report data" });
    }

    const report = new Report({
      questionSetId,
      questionIndex,
      reason
    });

    await report.save();
    res.status(201).json({ message: "Report submitted" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;