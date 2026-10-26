import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MemberService } from './member.service';
import { Member } from './member.schema';

describe('MemberService', () => {
  // A fake model, so the test does not need a real database
  const findOne = jest.fn();
  let service: MemberService;

  beforeEach(async () => {
    findOne.mockReset();
    const moduleRef = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: getModelToken(Member.name), useValue: { findOne } },
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
});
