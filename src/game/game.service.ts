import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Game } from './game.schema';

// The fields shown in game lists, so we do not send every move and chat line
const SUMMARY_FIELDS = 'white black status result timeControl opening moves';

@Injectable()
export class GameService {
  constructor(@InjectModel(Game.name) private gameModel: Model<Game>) {}

  getLive() {
    return this.gameModel
      .find({ status: 'live' })
      .select(SUMMARY_FIELDS)
      .sort({ watching: -1 })
      .lean()
      .exec();
  }

  // Games waiting for a second player, oldest first, so the lobby can pair people
  getOpen(timeControl?: string) {
    return this.gameModel
      .find({ status: 'waiting', ...(timeControl ? { timeControl } : {}) })
      .select(SUMMARY_FIELDS)
      .sort({ createdAt: 1 })
      .limit(20)
      .lean()
      .exec();
  }

  countLive() {
    return this.gameModel.countDocuments({ status: 'live' }).exec();
  }

  // The live game with the most people watching
  async getFeatured() {
    const game = await this.gameModel
      .findOne({ status: 'live' })
      .sort({ watching: -1 })
      .lean()
      .exec();
    if (!game) throw new NotFoundException('No live games right now');
    return game;
  }

  async getById(id: string) {
    // Stops Mongoose from throwing a confusing error for ids like "abc"
    if (!isValidObjectId(id)) throw new NotFoundException('Game not found');
    const game = await this.gameModel.findById(id).lean().exec();
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }

  // Finished games where this player had white or black, newest first
  getFinishedByPlayer(username: string, limit: number) {
    const name = username.toLowerCase();
    return this.gameModel
      .find({
        status: 'finished',
        $or: [{ 'white.username': name }, { 'black.username': name }],
      })
      .select(SUMMARY_FIELDS)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  // Adds a chat message and returns the whole chat
  async addChat(id: string, from: unknown, text: unknown) {
    if (!isValidObjectId(id)) throw new NotFoundException('Game not found');
    if (typeof from !== 'string' || typeof text !== 'string' || !text.trim()) {
      throw new BadRequestException(
        'Send who wrote it and the text, like { "from": "khamid", "text": "gg" }',
      );
    }
    const game = await this.gameModel
      .findByIdAndUpdate(
        id,
        {
          $push: {
            // $slice keeps only the newest 100 messages
            chat: {
              $each: [
                { from: from.toLowerCase(), text: text.trim().slice(0, 300) },
              ],
              $slice: -100,
            },
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!game) throw new NotFoundException('Game not found');
    return game.chat;
  }
}
