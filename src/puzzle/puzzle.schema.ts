import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Puzzle {
  // Like "Smothered mate"
  @Prop({ required: true, trim: true })
  title: string;

  // The full FEN, so it also says whose turn it is: that side solves the puzzle
  @Prop({ required: true })
  fen: string;

  // The answer in SAN. Your moves and the opponent's replies take turns:
  // ['Qg8+', 'Rxg8', 'Nf7#'] means you play Qg8+, they reply Rxg8, you finish with Nf7#.
  @Prop({ type: [String], required: true })
  solution: string[];

  // How hard it is, on the same scale as player ratings
  @Prop({ required: true })
  rating: number;

  // Like "mate in 2" or "fork"
  @Prop({ default: '' })
  theme: string;
}

export type PuzzleDocument = HydratedDocument<Puzzle>;
export const PuzzleSchema = SchemaFactory.createForClass(Puzzle);
