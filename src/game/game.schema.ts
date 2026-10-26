import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GameStatus = 'live' | 'finished';
export type GameResult = '1-0' | '0-1' | '1/2-1/2';

@Schema({ _id: false })
export class GamePlayer {
  @Prop({ required: true, lowercase: true, trim: true })
  username: string;

  // Rating when the game started
  @Prop({ required: true })
  rating: number;

  // Rating won or lost, filled in when the game ends
  @Prop({ default: 0 })
  ratingChange: number;

  // Time left on the clock, in seconds
  @Prop({ required: true })
  clock: number;
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ChatMessage {
  @Prop({ required: true })
  from: string;

  @Prop({ required: true, maxlength: 300 })
  text: string;
}

@Schema({ timestamps: true })
export class Game {
  @Prop({ type: GamePlayer, required: true })
  white: GamePlayer;

  @Prop({ type: GamePlayer, required: true })
  black: GamePlayer;

  @Prop({ required: true, enum: ['live', 'finished'], default: 'live' })
  status: GameStatus;

  // Only set once the game is finished
  @Prop({ enum: ['1-0', '0-1', '1/2-1/2'] })
  result?: GameResult;

  @Prop({ default: true })
  rated: boolean;

  // Like "3+2": 3 minutes each, plus 2 seconds after every move
  @Prop({ required: true })
  timeControl: string;

  @Prop({ default: '' })
  opening: string;

  // Every move in order, like ['e4', 'e5', 'Nf3']
  @Prop({ type: [String], default: [] })
  moves: string[];

  // Board position, in FEN notation (only the piece placement part)
  @Prop({ default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR' })
  fen: string;

  // Squares of the last move, like ['h7', 'h6']
  @Prop({ type: [String], default: [] })
  lastMove: string[];

  // Engine evaluation in pawns. Positive means white is better.
  @Prop({ default: 0 })
  evaluation: number;

  @Prop({ default: 0 })
  watching: number;

  @Prop({ type: [ChatMessage], default: [] })
  chat: ChatMessage[];
}

export type GameDocument = HydratedDocument<Game>;
export const GameSchema = SchemaFactory.createForClass(Game);
