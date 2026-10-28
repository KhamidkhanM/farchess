import {
  boardResult,
  lossFor,
  material,
  parseTimeControl,
  replay,
} from './play-rules';

describe('play rules', () => {
  it('reads a time control', () => {
    expect(parseTimeControl('3+2')).toEqual({ base: 180, increment: 2 });
    expect(parseTimeControl('fast')).toBeNull();
  });

  it('sees checkmate and who won', () => {
    expect(boardResult(replay(['f3', 'e5', 'g4', 'Qh4#']))).toEqual({
      result: '0-1',
      reason: 'checkmate',
    });
  });

  it('says a normal position is not over', () => {
    expect(boardResult(replay(['e4', 'e5']))).toBeNull();
  });

  it('counts material in pawns', () => {
    // White took a pawn: 1 pawn ahead
    expect(material(replay(['e4', 'd5', 'exd5']))).toBe(1);
  });

  it('gives the win to the other side', () => {
    expect(lossFor('white')).toBe('0-1');
  });
});
