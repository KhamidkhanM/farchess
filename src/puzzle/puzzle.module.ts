import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../member/member.schema';
import { Puzzle, PuzzleSchema } from './puzzle.schema';
import { PuzzleService } from './puzzle.service';
import { PuzzleController } from './puzzle.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Puzzle.name, schema: PuzzleSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [PuzzleController],
  providers: [PuzzleService],
})
export class PuzzleModule {}
