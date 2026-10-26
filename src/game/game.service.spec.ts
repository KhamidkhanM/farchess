import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GameService } from './game.service';
import { Game } from './game.schema';

describe('GameService', () => {
  const findById = jest.fn();
  let service: GameService;

  beforeEach(async () => {
    findById.mockReset();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: getModelToken(Game.name), useValue: { findById } },
      ],
    }).compile();
    service = moduleRef.get(GameService);
  });

  it('returns 404 for an id that is not a valid Mongo id', async () => {
    await expect(service.getById('abc')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findById).not.toHaveBeenCalled();
  });

  it('returns 404 when no game has that id', async () => {
    findById.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve(null) }),
    });
    await expect(
      service.getById('6650f0a1b2c3d4e5f6a7b8c9'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
