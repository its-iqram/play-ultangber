<div align="center">

<img src="https://raw.githubusercontent.com/its-iqram/ultangber/main/assets/logo.png" alt="ULTANGBER" height="80" />

# ULTANGBER WebApp

**The official digital companion to the ULTANGBER Challenge Board — Students Edition.**  
An educational snake-and-ladder game where every square is a question and every move is earned.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Overview

ULTANGBER WebApp is the digital version of the *Papan Cabaran* physical board game, an innovation by the **SEMEKAP Innovation Team**. Players roll the dice and race against a robot opponent across a challenge board. Landing on a special square draws a question — answer correctly to gain the advantage, answer wrongly and face the consequence. The first to reach the END square and answer correctly wins.

- 🗺️ **Three board sizes** — 5×8 (40 sq) · 6×9 (54 sq) · 7×10 (70 sq)
- 🤖 **Robot AI opponent** — 70% answer accuracy
- 🐍 **Six square types** — Ladder, Snake, Bonus (+), Penalty (−), Freeze, End
- 📚 **Custom question sets** — create and manage your own via the built-in editor
- 📱 **Fully mobile-responsive** — works on any screen size

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
3. Under **Network Access**, allow connections from anywhere (`0.0.0.0/0`) — required for Vercel's dynamic IPs

### 2. Ensure `vercel.json` is in the repo root

```json
{
  "version": 2,
  "builds": [
    { "src": "server/server.js", "use": "@vercel/node" },
    { "src": "public/**",        "use": "@vercel/static" }
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
2. **Choose a board size** — 5×8, 6×9, or 7×10
3. **Pick your token colour** and click **Start Game**
4. **Roll the dice** on your turn — your token moves forward by that many squares
5. **Landing on a special square** draws a challenge card question:

| Square | Correct Answer ✅ | Wrong Answer ❌ |
|--------|-------------------|-----------------|
| 🪜 **Ladder** | Climb to the top | Stay at the bottom |
| 🐍 **Snake** | Stay on the square | Slide down to the tail |
| ➕ **Bonus** | Move forward by the bonus value | Stay |
| ➖ **Penalty** | Stay (penalty avoided) | Move backward by the penalty value |
| 🧊 **Freeze** | *(No question on landing)* Skip next turn, then answer to unfreeze | If wrong: remain frozen, retry next turn |
| 🏁 **End Square** | WIN! | Move back 5 squares |

6. **The robot takes its turn** automatically — it answers with 70% accuracy
7. **First to reach the END square and answer correctly wins!**

---

## Licence

© SEMEKAP Innovation Team. All rights reserved.

This project — including its source code, game design, assets, and documentation — is the intellectual property of the SEMEKAP Innovation Team. **It is not open source and is not free to use.**

- ❌ You may **not** copy, modify, distribute, sublicense, or sell any part of this project without explicit written permission from the copyright holders.
- ❌ You may **not** use this project, or any derivative of it, for commercial or institutional purposes without a licence agreement.
- ✅ Authorised collaborators may access and contribute to this repository solely under the terms agreed upon with the SEMEKAP Innovation Team.

For licensing enquiries, please contact the team via [bit.ly/ultangber-student-version](https://bit.ly/ultangber-student-version).

> **"HAK CIPTA TERPELIHARA"** — All intellectual property rights reserved.

---

<div align="center">
  <sub>GAME ON. BRAIN ON. · An Innovation by SEMEKAP Innovation Team</sub>
</div>
