import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RatingKind = 'Bullet' | 'Blitz' | 'Rapid' | 'Puzzles';

// One rating card on the profile, like "Blitz 1612 (+34), 1,092 games"
@Schema({ _id: false })
export class Rating {
  @Prop({ required: true, enum: ['Bullet', 'Blitz', 'Rapid', 'Puzzles'] })
  kind: RatingKind;

  @Prop({ required: true })
  value: number;

  // How much the rating moved this week
  @Prop({ default: 0 })
  change: number;

  // Games played, or puzzles solved for the Puzzles rating
  @Prop({ default: 0 })
  count: number;
}

@Schema({ _id: false })
export class CoachTip {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  action: string;
}

// timestamps adds createdAt and updatedAt; createdAt is the "joined" date
@Schema({ timestamps: true })
export class Member {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: 0 })
  gamesPlayed: number;

  @Prop({ default: '' })
  favoriteOpenings: string;

  @Prop({ type: [Rating], default: [] })
  ratings: Rating[];

  // Blitz rating at the end of each of the last weeks, oldest first
  @Prop({ type: [Number], default: [] })
  blitzHistory: number[];

  @Prop({ type: CoachTip })
  coachTip?: CoachTip;

  createdAt: Date;
}

export type MemberDocument = HydratedDocument<Member>;
export const MemberSchema = SchemaFactory.createForClass(Member);
