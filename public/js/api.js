// ============================================================
// api.js — All API communication with the backend
// This module handles every fetch() call to our Express server
// Other JS files import from this to keep code DRY
// ============================================================

// The base URL — empty string means "same domain as frontend"
// In development this works because Express serves static files
const API_BASE = '';

const api = {

  // ----------------------------------------------------------
  // Fetch all available question sets (for the dropdown)
  // Returns: Array of { _id, title, subject, createdAt }
  // ----------------------------------------------------------
  async getQuestionSets() {
    const res = await fetch(`${API_BASE}/api/question-sets`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to load question sets');
    return data.data;
  },

  // ----------------------------------------------------------
  // Create a new question set
  // payload: { title, subject, questions: [...] }
  // ----------------------------------------------------------
  async createQuestionSet(payload) {
    const res = await fetch(`${API_BASE}/api/question-sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to create question set');
    return data.data;
  },

  // ----------------------------------------------------------
  // Get a random question from a specific question set
  // Returns: { questionSetId, questionIndex, question, answer, difficulty }
  // ----------------------------------------------------------
  async getRandomQuestion(questionSetId) {
    const res = await fetch(`${API_BASE}/api/question-sets/${questionSetId}/random-question`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to load question');
    return data.data;
  },

  // ----------------------------------------------------------
  // Submit a report about a question
  // payload: { questionSetId, questionIndex, reason }
  // ----------------------------------------------------------
  async submitReport(payload) {
    const res = await fetch(`${API_BASE}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to submit report');
    return data;
  },
};
