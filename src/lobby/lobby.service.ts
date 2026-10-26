import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../member/member.schema';
import { Tournament } from '../tournament/tournament.schema';
import { GameService } from '../game/game.service';
import { TIME_CONTROLS } from './time-controls';

@Injectable()
export class LobbyService {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<Member>,
    @InjectModel(Tournament.name) private tournamentModel: Model<Tournament>,
    private readonly gameService: GameService,
  ) {}

  async getLobby() {
    // Run the three database queries at the same time
    const [players, liveGames, nextTournament] = await Promise.all([
      this.memberModel.countDocuments().exec(),
      this.gameService.countLive(),
      this.tournamentModel
        .findOne({ startsAt: { $gte: new Date() } })
        .sort({ startsAt: 1 })
        .lean()
        .exec(),
    ]);

    return {
      // Nobody is tracked as "online" yet, so for now this is every member
      online: players,
      liveGames,
      timeControls: TIME_CONTROLS,
      nextTournament,
    };
  }
}
