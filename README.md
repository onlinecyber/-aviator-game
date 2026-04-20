# Aviator Crash Game Platform

## Quick Start

### 1. Start MongoDB
Make sure MongoDB is running locally:
```bash
mongod
```
Or use MongoDB Atlas — update `MONGO_URI` in `server/.env`.

---

### 2. Install & Start Server

```bash
cd server
npm install
node scripts/createAdmin.js   # Create admin account (run once)
npm run dev
```

Server runs on: **http://localhost:5000**

---

### 3. Install & Start Client

```bash
cd client
npm install
npm run dev
```

Client runs on: **http://localhost:5173**

---

## Default Accounts

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@aviator.com   | admin123  |

New users automatically receive **₹1,000** starting balance on registration.

---

## Environment Variables (server/.env)

| Variable          | Default                          | Description              |
|-------------------|----------------------------------|--------------------------|
| `PORT`            | 5000                             | Server port              |
| `MONGO_URI`       | mongodb://localhost:27017/aviator | MongoDB connection string |
| `JWT_SECRET`      | (change this!)                   | JWT signing secret       |
| `STARTING_BALANCE`| 1000                             | Balance for new users    |
| `CLIENT_URL`      | http://localhost:5173            | Allowed CORS origin      |

---

## Game Flow

1. **WAITING phase (7s)** — Place bets, set optional auto-cashout  
2. **RUNNING phase** — Multiplier rises exponentially; click CASH OUT  
3. **CRASHED** — Round ends; all uncashed bets are lost  
4. Repeat

---

## Provably Fair

Every game has a `serverSeed` + `clientSeed`. After the round you can verify:
```
HMAC-SHA256(serverSeed, clientSeed) → crash point
```
The `clientSeed` is always revealed after the game ends in the History page.

---

## Architecture

```
server/
├── index.js                   # Entry, wires everything together
├── src/
│   ├── config/                # DB connection, constants
│   ├── controllers/           # REST API logic
│   ├── middleware/            # JWT auth, admin guard
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── services/
│   │   ├── gameEngine.js      # ★ Core game loop (state machine)
│   │   └── walletService.js   # Deposit/withdraw logic
│   ├── socket/
│   │   └── socketHandler.js   # Socket.IO events
│   └── utils/
│       └── rng.js             # Provably fair crash point RNG

client/
├── src/
│   ├── context/               # Auth, Socket, Game, Wallet contexts
│   ├── components/            # PlaneCanvas, BetPanel, etc.
│   ├── pages/                 # Game, Wallet, History, Leaderboard, Admin
│   └── services/              # Axios API client
```
