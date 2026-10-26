import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Tournament {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  startsAt: Date;

  @Prop({ required: true })
  timeControl: string;

  @Prop({ required: true })
  rounds: number;

  // Like "Swiss" or "Arena"
  @Prop({ default: 'Swiss' })
  format: string;

  @Prop({ default: 0 })
  joined: number;

  @Prop({ required: true })
  capacity: number;
}

export type TournamentDocument = HydratedDocument<Tournament>;
export const TournamentSchema = SchemaFactory.createForClass(Tournament);
