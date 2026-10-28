import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from './member.schema';

// What player lists show: enough for a name, a city and ratings
const LIST_FIELDS = 'username city gamesPlayed ratings';

// Makes characters like "." or "*" match themselves inside a search
const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class MemberService {
  constructor(@InjectModel(Member.name) private memberModel: Model<Member>) {}

  async getByUsername(username: string): Promise<Member> {
    const member = await this.memberModel
      .findOne({ username: username.toLowerCase() })
      .lean()
      .exec();
    if (!member) throw new NotFoundException(`No member called ${username}`);
    return member;
  }

  // Players whose username contains the search text, A to Z
  search(text = '') {
    return this.memberModel
      .find({ username: { $regex: escapeRegex(text.trim().toLowerCase()) } })
      .select(LIST_FIELDS)
      .sort({ username: 1 })
      .limit(20)
      .lean()
      .exec();
  }

  async getFriends(username: string) {
    const member = await this.getByUsername(username);
    return this.memberModel
      .find({ username: { $in: member.friends ?? [] } })
      .select(LIST_FIELDS)
      .sort({ username: 1 })
      .lean()
      .exec();
  }

  async addFriend(username: string, friend: unknown) {
    if (typeof friend !== 'string' || !friend.trim()) {
      throw new BadRequestException(
        'Send the friend’s username, like { "friend": "opponent" }',
      );
    }
    const name = username.toLowerCase();
    const friendName = friend.trim().toLowerCase();
    if (friendName === name) {
      throw new BadRequestException('You cannot add yourself as a friend');
    }
    // Throws 404 if the friend does not exist
    await this.getByUsername(friendName);

    // $addToSet only adds the name if it is not in the list already
    const updated = await this.memberModel
      .updateOne({ username: name }, { $addToSet: { friends: friendName } })
      .exec();
    if (updated.matchedCount === 0) {
      throw new NotFoundException(`No member called ${username}`);
    }
    return this.getFriends(name);
  }

  async removeFriend(username: string, friend: string) {
    const name = username.toLowerCase();
    const updated = await this.memberModel
      .updateOne(
        { username: name },
        { $pull: { friends: friend.toLowerCase() } },
      )
      .exec();
    if (updated.matchedCount === 0) {
      throw new NotFoundException(`No member called ${username}`);
    }
    return this.getFriends(name);
  }
}
