import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from './game.schema';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { PlayService } from './play.service';
import { Member, MemberSchema } from '../member/member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [GameController],
  providers: [GameService, PlayService],
  exports: [GameService],
})
export class GameModule {}
