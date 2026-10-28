import { Chess } from 'chess.js';
import { puzzles } from './seed-data';

describe('sample puzzles', () => {
  it.each(puzzles.map((puzzle) => [puzzle.title, puzzle]))(
    '%s has a legal answer',
    (_title, puzzle) => {
      const chess = new Chess(puzzle.fen);
      // chess.move throws if a move is not legal in the position
      puzzle.solution.forEach((move) => chess.move(move));
      // Every "mate" puzzle must really end in checkmate
      if (puzzle.theme.startsWith('mate')) {
        expect(chess.isCheckmate()).toBe(true);
      }
    },
  );
});
