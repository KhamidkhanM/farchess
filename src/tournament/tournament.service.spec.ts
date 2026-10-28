import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TournamentService } from './tournament.service';
import { Tournament } from './tournament.schema';

describe('TournamentService', () => {
  // A fake model, so the test does not need a real database
  const findOneAndUpdate = jest.fn();
  const findById = jest.fn();
  let service: TournamentService;

  const id = '6650f0a1b2c3d4e5f6a7b8c9';
  const query = (value: unknown) => ({
    lean: () => ({ exec: () => Promise.resolve(value) }),
  });

  beforeEach(async () => {
    findOneAndUpdate.mockReset();
    findById.mockReset();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TournamentService,
        {
          provide: getModelToken(Tournament.name),
          useValue: { findOneAndUpdate, findById },
        },
      ],
    }).compile();
    service = moduleRef.get(TournamentService);
  });

  it('adds the player when there is a free spot', async () => {
    findOneAndUpdate.mockReturnValue(query({ players: ['khamid'] }));
    await expect(service.join(id, 'Khamid')).resolves.toEqual({
      players: ['khamid'],
    });
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { $push: { players: 'khamid' }, $inc: { joined: 1 } },
      { new: true },
    );
  });

  it('does nothing when the player already joined', async () => {
    findOneAndUpdate.mockReturnValue(query(null));
    findById.mockReturnValue(query({ players: ['khamid'] }));
    await expect(service.join(id, 'khamid')).resolves.toEqual({
      players: ['khamid'],
    });
  });

  it('says so when the tournament is full', async () => {
    findOneAndUpdate.mockReturnValue(query(null));
    findById.mockReturnValue(query({ players: [] }));
    await expect(service.join(id, 'khamid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns 404 for an id that is not a valid Mongo id', async () => {
    await expect(service.join('abc', 'khamid')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('asks for a username when none is sent', async () => {
    await expect(service.join(id, '')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
