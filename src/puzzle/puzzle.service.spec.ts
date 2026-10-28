import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PuzzleService } from './puzzle.service';
import { Puzzle } from './puzzle.schema';
import { Member } from '../member/member.schema';

describe('PuzzleService', () => {
  // Fake models, so the test does not need a real database
  const exists = jest.fn();
  const updateOne = jest.fn();
  const findOne = jest.fn();
  let service: PuzzleService;

  const id = '6650f0a1b2c3d4e5f6a7b8c9';
  const puzzles = { rating: 1500, value: 1508, change: 8, count: 1 };

  beforeEach(async () => {
    [exists, updateOne, findOne].forEach((fn) => fn.mockReset());
    exists.mockResolvedValue({ _id: id });
    findOne.mockReturnValue({
      lean: () => ({
        exec: () =>
          Promise.resolve({ ratings: [{ kind: 'Puzzles', ...puzzles }] }),
      }),
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        PuzzleService,
        { provide: getModelToken(Puzzle.name), useValue: { exists } },
        {
          provide: getModelToken(Member.name),
          useValue: { updateOne, findOne },
        },
      ],
    }).compile();
    service = moduleRef.get(PuzzleService);
  });

  const updateMatches = (...counts: number[]) =>
    counts.forEach((matchedCount) =>
      updateOne.mockReturnValueOnce({
        exec: () => Promise.resolve({ matchedCount }),
      }),
    );

  it('raises the Puzzles rating when the puzzle was solved', async () => {
    updateMatches(1);
    await service.saveResult(id, 'Khamid', true);
    expect(updateOne).toHaveBeenCalledWith(
      { username: 'khamid', 'ratings.kind': 'Puzzles' },
      {
        $inc: {
          'ratings.$.value': 8,
          'ratings.$.change': 8,
          'ratings.$.count': 1,
        },
      },
    );
  });

  it('adds a Puzzles rating for a player who has none', async () => {
    updateMatches(0, 1);
    await service.saveResult(id, 'khamid', false);
    expect(updateOne).toHaveBeenLastCalledWith(
      { username: 'khamid' },
      {
        $push: {
          ratings: { kind: 'Puzzles', value: 1492, change: -8, count: 0 },
        },
      },
    );
  });

  it('returns 404 for a player who does not exist', async () => {
    updateMatches(0, 0);
    await expect(service.saveResult(id, 'nobody', true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('asks for solved to be true or false', async () => {
    await expect(
      service.saveResult(id, 'khamid', 'yes'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for a puzzle that does not exist', async () => {
    exists.mockResolvedValue(null);
    await expect(service.saveResult(id, 'khamid', true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
