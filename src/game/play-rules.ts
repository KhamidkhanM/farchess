// The rules for playing a game, kept apart from the database so they are easy to test
import { Chess } from 'chess.js';
import { GameResult } from './game.schema';

// "3+2" → 180 seconds each, plus 2 seconds after every move
export const parseTimeControl = (timeControl: string) => {
  const match = /^(\d+)\+(\d+)$/.exec(timeControl);
  if (!match) return null;
  return { base: Number(match[1]) * 60, increment: Number(match[2]) };
};

// Rebuilds the board from the list of moves
export const replay = (moves: string[]) => {
  const chess = new Chess();
  moves.forEach((move) => chess.move(move));
  return chess;
};

const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// A very simple evaluation: white's material minus black's, in pawns
export const material = (chess: Chess) =>
  chess
    .board()
    .flat()
    .reduce(
      (sum, piece) =>
        piece ? sum + (piece.color === 'w' ? 1 : -1) * VALUES[piece.type] : sum,
      0,
    );

// If the game is over on the board, the result and the reason. Otherwise null.
export const boardResult = (
  chess: Chess,
): { result: GameResult; reason: string } | null => {
  if (chess.isCheckmate()) {
    // The side to move is the one that got mated
    return {
      result: chess.turn() === 'w' ? '0-1' : '1-0',
      reason: 'checkmate',
    };
  }
  if (chess.isStalemate()) return { result: '1/2-1/2', reason: 'stalemate' };
  if (chess.isThreefoldRepetition()) {
    return { result: '1/2-1/2', reason: 'repetition' };
  }
  if (chess.isInsufficientMaterial()) {
    return { result: '1/2-1/2', reason: 'insufficient material' };
  }
  if (chess.isDraw()) return { result: '1/2-1/2', reason: '50-move rule' };
  return null;
};

// The result when one side loses (by resigning or running out of time)
export const lossFor = (side: 'white' | 'black'): GameResult =>
  side === 'white' ? '0-1' : '1-0';
