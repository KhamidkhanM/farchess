import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Tournament } from './tournament.schema';

@Injectable()
export class TournamentService {
  constructor(
    @InjectModel(Tournament.name) private tournamentModel: Model<Tournament>,
  ) {}

  // Events that have not started yet, soonest first
  getUpcoming() {
    return this.tournamentModel
      .find({ startsAt: { $gte: new Date() } })
      .sort({ startsAt: 1 })
      .lean()
      .exec();
  }

  async join(id: string, username: string) {
    const name = this.checkInput(id, username);
    // One update that only matches when the player is not in yet and there is a free spot.
    // Doing the check and the change together means two players can never take the last spot.
    const tournament = await this.tournamentModel
      .findOneAndUpdate(
        {
          _id: id,
          players: { $ne: name },
          $expr: { $lt: ['$joined', '$capacity'] },
        },
        { $push: { players: name }, $inc: { joined: 1 } },
        { new: true },
      )
      .lean()
      .exec();
    if (tournament) return tournament;

    // Nothing changed: find out why, so the page can say so
    const existing = await this.getById(id);
    if (existing.players.includes(name)) return existing;
    throw new BadRequestException('This tournament is full');
  }

  async leave(id: string, username: string) {
    const name = this.checkInput(id, username);
    const tournament = await this.tournamentModel
      .findOneAndUpdate(
        { _id: id, players: name },
        { $pull: { players: name }, $inc: { joined: -1 } },
        { new: true },
      )
      .lean()
      .exec();
    // Not in the list: leaving again changes nothing
    return tournament ?? this.getById(id);
  }

  private async getById(id: string) {
    const tournament = await this.tournamentModel.findById(id).lean().exec();
    if (!tournament) throw new NotFoundException('Tournament not found');
    return tournament;
  }

  private checkInput(id: string, username: unknown) {
    if (!isValidObjectId(id))
      throw new NotFoundException('Tournament not found');
    if (typeof username !== 'string' || !username.trim()) {
      throw new BadRequestException(
        'Send the username, like { "username": "khamid" }',
      );
    }
    return username.trim().toLowerCase();
  }
}
