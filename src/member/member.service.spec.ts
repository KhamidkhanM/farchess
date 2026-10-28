import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MemberService } from './member.service';
import { Member } from './member.schema';

describe('MemberService', () => {
  // A fake model, so the test does not need a real database
  const findOne = jest.fn();
  const updateOne = jest.fn();
  const find = jest.fn();
  let service: MemberService;

  beforeEach(async () => {
    [findOne, updateOne, find].forEach((fn) => fn.mockReset());
    // find().select().sort().lean().exec() → an empty list
    const chain = {
      select: () => chain,
      sort: () => chain,
      limit: () => chain,
      lean: () => chain,
      exec: () => Promise.resolve([]),
    };
    find.mockReturnValue(chain);
    const moduleRef = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: getModelToken(Member.name),
          useValue: { findOne, updateOne, find },
        },
      ],
    }).compile();
    service = moduleRef.get(MemberService);
  });

  const returns = (value: unknown) =>
    findOne.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve(value) }),
    });

  it('finds a member by username, ignoring case', async () => {
    returns({ username: 'khamid' });
    await expect(service.getByUsername('Khamid')).resolves.toEqual({
      username: 'khamid',
    });
    expect(findOne).toHaveBeenCalledWith({ username: 'khamid' });
  });

  it('throws 404 when the member does not exist', async () => {
    returns(null);
    await expect(service.getByUsername('nobody')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('adds a friend only once, using $addToSet', async () => {
    returns({ username: 'opponent', friends: [] });
    updateOne.mockReturnValue({
      exec: () => Promise.resolve({ matchedCount: 1 }),
    });
    await service.addFriend('khamid', 'Opponent');
    expect(updateOne).toHaveBeenCalledWith(
      { username: 'khamid' },
      { $addToSet: { friends: 'opponent' } },
    );
  });

  it('does not let you add yourself', async () => {
    await expect(service.addFriend('khamid', 'khamid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('searches with special characters taken literally', async () => {
    await service.search('a.b');
    expect(find).toHaveBeenCalledWith({ username: { $regex: 'a\\.b' } });
  });
});
