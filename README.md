# farchess-api

The backend for farchess, built with NestJS and MongoDB (Mongoose).

## Run it locally

1. Start MongoDB on your machine (for example with MongoDB Compass or `mongod`).
2. Copy `.env.example` to `.env` and change the values if needed.
3. Install and fill the database with sample data:

```bash
npm install
npm run seed       # deletes and re-creates the sample members, games, tournaments and puzzles
npm run start:dev  # API on http://localhost:4000
```

## Endpoints

| Method | Path | What it returns |
| --- | --- | --- |
| GET | `/members?search=:text` | Up to 20 players whose username contains the text |
| GET | `/members/:username` | A player's profile, ratings, rating history and coach tip |
| GET | `/members/:username/friends` | The players this member added as friends |
| POST | `/members/:username/friends` | Adds a friend. Body: `{ "friend": "opponent" }` |
| DELETE | `/members/:username/friends/:friend` | Removes a friend |
| GET | `/games?player=:username&limit=5` | A player's finished games, newest first |
| GET | `/games/live` | Games being played right now |
| GET | `/games/featured` | The live game with the most people watching |
| GET | `/games/:id` | One game with its moves, position and chat |
| POST | `/games/:id/chat` | Adds a chat message. Body: `{ "from": "khamid", "text": "gg" }` |
| GET | `/lobby` | Online count, live game count, time controls and the next tournament |
| GET | `/tournaments` | Tournaments that have not started yet, soonest first |
| POST | `/tournaments/:id/join` | Joins a tournament. Body: `{ "username": "khamid" }` |
| POST | `/tournaments/:id/leave` | Leaves a tournament. Body: `{ "username": "khamid" }` |
| GET | `/puzzles` | Every puzzle with its position and answer, easiest first |
| POST | `/puzzles/:id/result` | Moves the player's puzzle rating up or down. Body: `{ "username": "khamid", "solved": true }` |

## Tests

```bash
npm test
```
