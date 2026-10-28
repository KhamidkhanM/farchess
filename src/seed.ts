// Fills the database with sample data: `npm run seed`
// Careful: it deletes the members, games, tournaments and puzzles that are already there.
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chess } from 'chess.js';
import { AppModule } from './app.module';
import { Member } from './member/member.schema';
import { Game } from './game/game.schema';
import { Tournament } from './tournament/tournament.schema';
import { Puzzle } from './puzzle/puzzle.schema';
import {
  finishedGames,
  liveGames,
  members,
  puzzles,
  tournaments,
} from './seed/seed-data';

// Plays the moves on a board to get the final position and the last move's squares
function withPosition<T extends { moves: string[] }>(game: T) {
  const chess = new Chess();
  game.moves.forEach((move) => chess.move(move));
  const last = chess.history({ verbose: true }).at(-1);
  return {
    ...game,
    fen: chess.fen().split(' ')[0],
    lastMove: last ? [last.from, last.to] : [],
  };
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  const memberModel = app.get<Model<Member>>(getModelToken(Member.name));
  const gameModel = app.get<Model<Game>>(getModelToken(Game.name));
  const tournamentModel = app.get<Model<Tournament>>(
    getModelToken(Tournament.name),
  );
  const puzzleModel = app.get<Model<Puzzle>>(getModelToken(Puzzle.name));

  await Promise.all([
    memberModel.deleteMany({}),
    gameModel.deleteMany({}),
    tournamentModel.deleteMany({}),
    puzzleModel.deleteMany({}),
  ]);

  await memberModel.insertMany(members);
  await gameModel.insertMany([
    ...liveGames.map((game) => withPosition({ ...game, status: 'live' })),
    ...finishedGames.map((game) =>
      withPosition({ ...game, status: 'finished' }),
    ),
  ]);
  await tournamentModel.insertMany(tournaments);
  await puzzleModel.insertMany(puzzles);

  console.log(
    `Seeded ${members.length} members, ${liveGames.length + finishedGames.length} games, ${tournaments.length} tournaments and ${puzzles.length} puzzles.`,
  );
  await app.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
