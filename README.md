<div align="center">

<img src="https://raw.githubusercontent.com/its-iqram/ultangber/main/assets/logo.png" alt="ULTANGBER" height="80" />

# ULTANGBER WebApp

**An educational snake-and-ladder board game for the classroom.**  
Challenge a robot opponent, answer questions, and race to the final square.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Overview

ULTANGBER WebApp is the digital version of the *Papan Cabaran* physical board game. Players take turns rolling dice against a robot opponent. Landing on a special square triggers a question — answer correctly to gain the effect, answer wrongly to suffer a penalty. First to reach the final square wins.

- 🎲 **Three board sizes** — 8×8 · 10×10 · 12×12
- 🤖 **Robot AI** — 70% answer accuracy
- 🐍 **Five special square types** — Ladder, Snake, Bonus, Penalty, Freeze
- 📚 **Custom question sets** — create your own via the built-in editor
- 📱 **Fully mobile-friendly** — works on any screen size

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML · CSS · JavaScript |
| Backend | Node.js · Express |
| Database | MongoDB Atlas (Mongoose) |
| Fonts | Bebas Neue · Space Grotesk · DM Mono |
| Deployment | Vercel |

---

## Project Structure

```
ultangber/
├── public/                  # Frontend (static files)
│   ├── index.html           # Dashboard — game setup
│   ├── game.html            # Game board page
│   ├── create-set.html      # Create question set page
│   ├── css/
│   │   └── style.css        # All styles (mobile-first)
│   └── js/
│       ├── api.js           # API calls to the backend
│       ├── dashboard.js     # Setup page logic
│       ├── game.js          # Core game engine
│       ├── ui.js            # DOM updates (mobile + desktop)
│       └── create-set.js    # Question set editor logic
├── server/                  # Backend
│   ├── server.js            # Express entry point
│   ├── models/
│   │   ├── QuestionSet.js   # Mongoose schema — question sets
│   │   └── Report.js        # Mongoose schema — question reports
│   └── routes/
│       ├── questionSets.js  # GET/POST /api/question-sets
│       └── reports.js       # POST /api/report
├── vercel.json              # Vercel routing config
├── package.json
└── .env                     # Local environment variables (not committed)
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) account

### 1. Clone the repo

```bash
git clone https://github.com/its-iqram/ultangber.git
cd ultangber
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ultangber?retryWrites=true&w=majority
PORT=3000
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

### Question Sets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/question-sets` | List all question sets |
| `POST` | `/api/question-sets` | Create a new question set |
| `GET` | `/api/question-sets/:id/random-question` | Get a random question from a set |

**POST `/api/question-sets` — request body:**
```json
{
  "title": "Grade 6 Science",
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

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/report` | Submit a report on a faulty question |

**POST `/api/report` — request body:**
```json
{
  "questionSetId": "abc123",
  "questionIndex": 2,
  "reason": "The answer listed is incorrect."
}
```

---

## Deploying to Vercel

### 1. Set up MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user and copy the connection string
3. Under **Network Access**, allow connections from anywhere (`0.0.0.0/0`)

### 2. Add `vercel.json` to the repo root

```json
{
  "version": 2,
  "builds": [
    { "src": "server/server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/server.js" },
    { "src": "/(.*)",     "dest": "public/$1" }
  ]
}
```

### 3. Import the project to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the `its-iqram/ultangber` GitHub repo
3. Set **Framework Preset** to **Other**
4. Add environment variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your Atlas connection string |
| `NODE_ENV` | `production` |

5. Click **Deploy**

> After changing environment variables, go to **Deployments** → click ··· on the latest deployment → **Redeploy**.

---

## How to Play

1. **Select a question set** from the dropdown (or create one first via *Create Set*)
2. **Choose a board size** — 8×8, 10×10, or 12×12
3. **Pick your token colour** and click **Start Game**
4. **Roll the dice** on your turn — your token moves forward by that many squares
5. **Landing on a special square** triggers a question:
   - ✅ Answer correctly → the square effect applies in your favour
   - ❌ Answer wrongly → a penalty applies instead
6. **The robot takes its turn** automatically with 70% accuracy
7. **First player to reach the final square wins!**

### Special Square Effects

| Square | Correct Answer | Wrong Answer |
|--------|---------------|--------------|
| 🪜 **Ladder** | Move forward by the ladder value | Go back by the ladder value |
| 🐍 **Snake** | Move back by the snake value | No extra penalty |
| ➕ **Bonus** | Gain extra steps forward | No bonus |
| ➖ **Penalty** | Lose a few steps | Double the penalty |
| 🧊 **Freeze** | Skip 1 turn | Skip 2 turns |

---

## License

MIT — free to use, modify, and distribute.

---

<div align="center">
  <sub>Built for the classroom · Powered by ULTANGBER</sub>
</div>
