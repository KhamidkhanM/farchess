import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../member/member.schema';
import { Tournament, TournamentSchema } from '../tournament/tournament.schema';
import { GameModule } from '../game/game.module';
import { LobbyService } from './lobby.service';
import { LobbyController } from './lobby.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Tournament.name, schema: TournamentSchema },
    ]),
    GameModule,
  ],
  controllers: [LobbyController],
  providers: [LobbyService],
})
export class LobbyModule {}
