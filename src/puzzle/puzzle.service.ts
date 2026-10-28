import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Member } from '../member/member.schema';
import { Puzzle } from './puzzle.schema';

// How many points a puzzle is worth, up or down
const RATING_STEP = 8;
// Where a player's puzzle rating starts if they have none yet
const START_RATING = 1500;

@Injectable()
export class PuzzleService {
  constructor(
    @InjectModel(Puzzle.name) private puzzleModel: Model<Puzzle>,
    @InjectModel(Member.name) private memberModel: Model<Member>,
  ) {}

  // Easiest first
  getAll() {
    return this.puzzleModel.find().sort({ rating: 1 }).lean().exec();
  }

  // Moves the player's Puzzles rating up when they solved it, down when they missed.
  // Returns their new Puzzles rating.
  async saveResult(id: string, username: unknown, solved: unknown) {
    if (!isValidObjectId(id) || !(await this.puzzleModel.exists({ _id: id }))) {
      throw new NotFoundException('Puzzle not found');
    }
    if (typeof username !== 'string' || typeof solved !== 'boolean') {
      throw new BadRequestException(
        'Send the username and whether it was solved, like { "username": "khamid", "solved": true }',
      );
    }
    const name = username.trim().toLowerCase();
    const delta = solved ? RATING_STEP : -RATING_STEP;
    const count = solved ? 1 : 0;

    // "ratings.$" means "the rating that matched", here the Puzzles one
    const updated = await this.memberModel
      .updateOne(
        { username: name, 'ratings.kind': 'Puzzles' },
        {
          $inc: {
            'ratings.$.value': delta,
            'ratings.$.change': delta,
            'ratings.$.count': count,
          },
        },
      )
      .exec();

    // No Puzzles rating yet: add one
    if (updated.matchedCount === 0) {
      const added = await this.memberModel
        .updateOne(
          { username: name },
          {
            $push: {
              ratings: {
                kind: 'Puzzles',
                value: START_RATING + delta,
                change: delta,
                count,
              },
            },
          },
        )
        .exec();
      if (added.matchedCount === 0) {
        throw new NotFoundException(`No member called ${username}`);
      }
    }

    const member = await this.memberModel
      .findOne({ username: name })
      .lean()
      .exec();
    return member?.ratings.find((rating) => rating.kind === 'Puzzles');
  }
}
