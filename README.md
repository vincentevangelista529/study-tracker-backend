# Study EXP Tracker — Backend

A gamified study tracker where logging study time earns experience points across three tracks — Developer, Gamer, and Anime — each leveling up independently as you study. This is the backend API; the frontend lives in a separate repo: [study-tracker-frontend](https://github.com/vincentevangelista529/study-tracker-frontend).

---

## Why I built this

Plain to-do-list study trackers are easy to abandon because there's no feedback loop — you check a box and that's it. This app borrows the leveling systems from games to make studying feel like progress: log a session, watch a progress bar fill, and level up once you cross a threshold. Splitting progress into three separate tracks also means studying dev topics doesn't "compete" with, say, casually researching a game guide — they're tracked and leveled independently.

## Features

- **User authentication** — register and log in with JWT-based sessions and bcrypt-hashed passwords
- **Three independent tracks** — Developer, Gamer, and Anime, automatically created for every new user on registration
- **EXP and leveling system** — study sessions convert duration into EXP (100 EXP per hour), with automatic level-ups at defined thresholds
- **Session history** — every logged session is stored, not just the running total, so historical study time is preserved

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT, bcrypt |

## Architecture

```
┌──────────────┐      REST API       ┌─────────────┐      SQL      ┌──────────────┐
│   React      │ ──────────────────> │   Express   │ ────────────> │  PostgreSQL  │
│  (frontend   │ <────────────────── │  (backend)  │ <──────────── │ users/       │
│   repo)      │                     └─────────────┘                │ tracks/     │
└──────────────┘                                                    │ sessions    │
                                                                     └──────────────┘
```

Auth requests (`/api/auth/register`, `/api/auth/login`) issue a JWT on success. That token is required on every `/api/tracks` route, verified via middleware before the request reaches the route handler. On registration, three track rows (developer/gamer/anime) are created for the new user, each starting at level 1 with 0 EXP.

## API Endpoints

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create a new account; auto-creates 3 track rows |
| POST | `/api/auth/login` | No | Authenticate and receive a JWT (valid 7 days) |
| GET | `/api/tracks` | Yes | Get the logged-in user's 3 tracks with current level/EXP |
| POST | `/api/tracks/session` | Yes | Log a study session for a track; updates EXP and recalculates level |

All routes use parameterized queries (`$1`, `$2`, etc.) to prevent SQL injection.

## Leveling Logic

EXP is awarded at a rate of 100 EXP per hour studied. Levels are recalculated after every logged session:

| Level | Name | EXP Required |
|---|---|---|
| 1 | Beginner | 0 |
| 2 | Apprentice | 500 |
| 3 | Intermediate | 1,000 |
| 4 | Advanced | 2,000 |
| 5 | Master | 4,000 |

## Database Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

CREATE TABLE tracks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_name TEXT NOT NULL,
    total_exp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    exp_earned INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

`tracks` and `sessions` both reference `users` via a foreign key with `ON DELETE CASCADE`, so deleting a user cleans up their tracks and session history automatically.

## Running Locally

### Prerequisites
- Node.js
- PostgreSQL

### Setup

```bash
npm install
```

Create a `.env` file in the project root:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=study_tracker
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
PORT=5000
```

Create the database and run the schema:

```bash
createdb study_tracker
psql -U postgres -d study_tracker -f schema.sql
```

Start the server:

```bash
node index.js
```

The API runs at `http://localhost:5000`. See [study-tracker-frontend](https://github.com/vincentevangelista529/study-tracker-frontend) for the client that consumes this API.

## What I'd improve next

- Move the hardcoded frontend API URL (`http://localhost:5000`) to an environment variable so this can be deployed alongside the frontend
- Add automated tests for the leveling calculation and auth flows
- Add a `GET /api/tracks/:trackName/sessions` endpoint to view session history per track, not just the running total
- Add input validation (e.g. rejecting negative or zero duration) on session logging

## Author

**Vincent Evangelista**
[GitHub](https://github.com/vincentevangelista529) · [Portfolio](https://vincentevangelista.vercel.app/)
