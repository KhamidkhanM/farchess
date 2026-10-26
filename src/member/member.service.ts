import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from './member.schema';

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
}
