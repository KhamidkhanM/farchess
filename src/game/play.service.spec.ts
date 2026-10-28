import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PlayService } from './play.service';
import { Game } from './game.schema';
import { Member } from '../member/member.schema';

describe('PlayService', () => {
  // Fake models, so the test does not need a real database
  const findById = jest.fn();
  const findOneAndUpdate = jest.fn();
  const updateOne = jest.fn();
  let service: PlayService;

  const id = '6650f0a1b2c3d4e5f6a7b8c9';
  const query = (value: unknown) => ({
    lean: () => ({ exec: () => Promise.resolve(value) }),
  });
  const seat = (username: string) => ({
    username,
    rating: 1600,
    ratingChange: 0,
    clock: 180,
  });
  const liveGame = (moves: string[] = []) => ({
    _id: id,
    white: seat('khamid'),
    black: seat('opponent'),
    status: 'live',
    rated: true,
    timeControl: '3+2',
    moves,
    turnStartedAt: new Date(),
    drawOffer: '',
  });

  beforeEach(async () => {
    [findById, findOneAndUpdate, updateOne].forEach((fn) => fn.mockReset());
    // Every update "works" and sends back whatever was asked for
    findOneAndUpdate.mockImplementation(() => query({ status: 'finished' }));
    updateOne.mockReturnValue({ exec: () => Promise.resolve({}) });
    const moduleRef = await Test.createTestingModule({
      providers: [
        PlayService,
        {
          provide: getModelToken(Game.name),
          useValue: { findById, findOneAndUpdate },
        },
        { provide: getModelToken(Member.name), useValue: { updateOne } },
      ],
    }).compile();
    service = moduleRef.get(PlayService);
  });

  it('saves a legal move with its squares', async () => {
    findById.mockReturnValue(query(liveGame()));
    await service.move(id, 'khamid', 'e4');
    const [filter, update] = findOneAndUpdate.mock.calls[0] as [
      object,
      { $push: object; $set: { lastMove: string[] } },
    ];
    expect(filter).toEqual({
      _id: id,
      status: 'live',
      moves: { $size: 0 },
    });
    expect(update.$push).toEqual({ moves: 'e4' });
    expect(update.$set.lastMove).toEqual(['e2', 'e4']);
  });

  it('refuses a move when it is the other player’s turn', async () => {
    findById.mockReturnValue(query(liveGame()));
    await expect(service.move(id, 'opponent', 'e5')).rejects.toThrow(
      'It is not your turn',
    );
  });

  it('refuses an illegal move', async () => {
    findById.mockReturnValue(query(liveGame()));
    await expect(service.move(id, 'khamid', 'e5')).rejects.toThrow(
      'not a legal move',
    );
  });

  it('ends the game with checkmate and moves the ratings', async () => {
    findById.mockReturnValue(query(liveGame(['f3', 'e5', 'g4'])));
    findOneAndUpdate.mockReturnValue(query(liveGame(['f3', 'e5', 'g4'])));
    await service.move(id, 'opponent', 'Qh4#');
    const [, finish] = findOneAndUpdate.mock.calls[1] as [
      object,
      { $set: Record<string, unknown> },
    ];
    expect(finish.$set).toMatchObject({
      status: 'finished',
      result: '0-1',
      endReason: 'checkmate',
      'white.ratingChange': -8,
      'black.ratingChange': 8,
    });
    expect(updateOne).toHaveBeenCalledTimes(2);
  });

  it('ends the game on time when the clock has run out', async () => {
    const game = liveGame();
    game.turnStartedAt = new Date(Date.now() - 200_000);
    findById.mockReturnValue(query(game));
    await service.getById(id);
    const [, finish] = findOneAndUpdate.mock.calls[0] as [
      object,
      { $set: Record<string, unknown> },
    ];
    expect(finish.$set).toMatchObject({
      result: '0-1',
      endReason: 'timeout',
      'white.clock': 0,
    });
  });

  it('only lets players resign', async () => {
    findById.mockReturnValue(query(liveGame()));
    await expect(service.resign(id, 'someone')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
