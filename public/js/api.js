// api.js — All API calls to the Express backend

const API_BASE = '';

const api = {

  async getQuestionSets() {
    const res = await fetch(`${API_BASE}/api/question-sets`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to load question sets');
    return data.data;
  },

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

  async getRandomQuestion(questionSetId) {
    const res = await fetch(`${API_BASE}/api/question-sets/${questionSetId}/random-question`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to load question');
    return data.data;
  },

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
