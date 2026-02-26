# 🎲 ULTANGBER WebApp

An educational Snake-and-Ladder style board game built with Node.js, Express, MongoDB, and Vanilla JavaScript.

---

## 📁 Project Structure

```
ultangber/
├── server/
│   ├── server.js              ← Express app entry point
│   ├── models/
│   │   ├── QuestionSet.js     ← Mongoose schema for question sets
│   │   └── Report.js          ← Mongoose schema for reports
│   └── routes/
│       ├── questionSets.js    ← API routes for question sets
│       └── reports.js         ← API route for reports
├── public/
│   ├── index.html             ← Dashboard (setup page)
│   ├── game.html              ← Game board page
│   ├── create-set.html        ← Create question set page
│   ├── css/
│   │   └── style.css          ← All styles
│   └── js/
│       ├── api.js             ← All API fetch calls
│       ├── ui.js              ← DOM manipulation helpers
│       ├── game.js            ← Core game engine
│       ├── dashboard.js       ← Dashboard page logic
│       └── create-set.js     ← Create set page logic
├── .env.example               ← Environment variable template
├── .gitignore
├── package.json
├── render.yaml                ← Render deployment config
└── README.md
```

---

## 🚀 Local Development Setup

### Step 1 — Install Dependencies

```bash
npm install
```

### Step 2 — Set Up Environment Variables

Copy the example file and fill in your MongoDB URI:

```bash
cp .env.example .env
```

Then open `.env` and replace the placeholder with your actual MongoDB Atlas URI.

### Step 3 — Run the Server

```bash
# Development (auto-restarts on file changes):
npm run dev

# Production:
npm start
```

Visit: http://localhost:3000

---

## 🗄 Step-by-Step: Connect MongoDB Atlas

1. Go to https://cloud.mongodb.com and sign in (free account works)

2. Create a **new Project** → Create a **free cluster** (M0 tier)

3. In the cluster dashboard, click **"Connect"**

4. Choose **"Drivers"** → Select **Node.js**

5. Copy the connection string. It looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. Add your database name to the URI:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ultangber?retryWrites=true&w=majority
   ```

7. Go to **Network Access** → Add IP Address → Allow access from anywhere (`0.0.0.0/0`)  
   *(Required for Render to connect)*

8. Paste this URI as the value of `MONGODB_URI` in your `.env` file

---

## ☁️ Deploy to Render

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ultangber-webapp.git
git push -u origin main
```

### Step 2 — Create a Render Account

Go to https://render.com and sign up (free tier available).

### Step 3 — Create a New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account → Select your `ultangber-webapp` repository
3. Render will auto-detect the settings from `render.yaml`

### Step 4 — Set Environment Variables in Render

1. In your Render service dashboard, go to **"Environment"** tab
2. Click **"Add Environment Variable"**
3. Add:
   - **Key:** `MONGODB_URI`  
   - **Value:** your full MongoDB Atlas connection string

### Step 5 — Build & Start Commands

Render reads these from `render.yaml` automatically, but verify:
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Step 6 — Deploy

Click **"Deploy"** and wait ~2 minutes. Your app will be live at:
```
https://ultangber-webapp.onrender.com
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/question-sets` | Get all question sets |
| POST | `/api/question-sets` | Create a new question set |
| GET | `/api/question-sets/:id/random-question` | Get a random question from a set |
| POST | `/api/report` | Submit a question report |

### POST /api/question-sets — Body Example
```json
{
  "title": "Grade 6 Science Quiz",
  "subject": "Science",
  "questions": [
    {
      "question": "What planet is closest to the Sun?",
      "answer": "Mercury",
      "difficulty": "Easy"
    }
  ]
}
```

### POST /api/report — Body Example
```json
{
  "questionSetId": "65abc123def456...",
  "questionIndex": 0,
  "reason": "The answer seems incorrect"
}
```

---

## 🎮 Game Rules

- Two players: **You** vs **Robot**
- Take turns rolling a 6-sided die
- Move your token forward by the dice value
- **Special squares** trigger a question popup:
  - 🪜 **Ladder** — Answer correctly → move forward; wrong → slide back
  - 🐍 **Snake** — Answer correctly → snake spared; wrong → extra penalty
  - ⬆️ **Bonus** — Correct → move forward extra; wrong → nothing
  - ⬇️ **Penalty** — Correct → small move back; wrong → double penalty
  - 🧊 **Freeze** — Correct → one turn frozen; wrong → two turns frozen
- Robot has **70% accuracy** on answers
- First to reach the last square wins!

---

## 🛡 Validation Summary

| Field | Rule |
|-------|------|
| Question set title | Required, non-empty |
| Subject | Required, non-empty |
| Questions array | Minimum 1 question |
| Question text | Minimum 6 characters |
| Answer | Non-empty |
| Report reason | Minimum 3 characters |
