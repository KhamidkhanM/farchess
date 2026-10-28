import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Move } from 'chess.js';
import { Game, GameResult } from './game.schema';
import { Member } from '../member/member.schema';
import { TIME_CONTROLS } from '../lobby/time-controls';
import {
  boardResult,
  lossFor,
  material,
  parseTimeControl,
  replay,
} from './play-rules';

type Side = 'white' | 'black';

// How many rating points a rated game is worth, up or down
const RATING_STEP = 8;
// The rating used for players who have none for this kind of game yet
const START_RATING = 1500;

// A game as it comes from the database
type SavedGame = Game & { _id: unknown };

// Playing a game between two members: create, join, move, resign and draw.
// There is no login yet, so each request says which username is playing.
@Injectable()
export class PlayService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<Game>,
    @InjectModel(Member.name) private memberModel: Model<Member>,
  ) {}

  // Opens a new game with one seat taken. The other player joins with the link.
  async create(username: unknown, timeControl: unknown, color: unknown) {
    const name = this.checkName(username);
    if (typeof timeControl !== 'string' || !parseTimeControl(timeControl)) {
      throw new BadRequestException('Send a time control like "3+2"');
    }
    const time = parseTimeControl(timeControl)!;
    const rating = await this.ratingOf(name, timeControl);
    const side: Side =
      color === 'white' || color === 'black'
        ? color
        : Math.random() < 0.5
          ? 'white'
          : 'black';
    const seat = (player: string, value: number) => ({
      username: player,
      rating: value,
      ratingChange: 0,
      clock: time.base,
    });

    const game = await this.gameModel.create({
      white: side === 'white' ? seat(name, rating) : seat('', 0),
      black: side === 'black' ? seat(name, rating) : seat('', 0),
      status: 'waiting',
      timeControl,
    });
    return game.toObject();
  }

  // Loads a game, and ends it first if the player to move ran out of time
  async getById(id: string) {
    const game = await this.load(id);
    if (game.status !== 'live' || !game.turnStartedAt) return game;
    const side = this.sideToMove(game);
    const left = game[side].clock - this.secondsSince(game.turnStartedAt);
    if (left > 0) return game;
    return this.finish(game, lossFor(side), 'timeout', {
      [`${side}.clock`]: 0,
    });
  }

  // Takes the free seat. The clock starts now.
  async join(id: string, username: unknown) {
    const name = this.checkName(username);
    const game = await this.load(id);
    const isPlayer = [game.white.username, game.black.username].includes(name);
    // Opening your own link again changes nothing
    if (isPlayer) return game;
    if (game.status !== 'waiting') {
      throw new BadRequestException('This game already has two players');
    }

    const free: Side = game.white.username ? 'black' : 'white';
    const rating = await this.ratingOf(name, game.timeControl);
    // status: 'waiting' in the filter means two people can never take the same seat
    const updated = await this.gameModel
      .findOneAndUpdate(
        { _id: id, status: 'waiting' },
        {
          $set: {
            [`${free}.username`]: name,
            [`${free}.rating`]: rating,
            status: 'live',
            turnStartedAt: new Date(),
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!updated) throw new ConflictException('Someone else took the seat');
    return updated;
  }

  async move(id: string, username: unknown, move: unknown) {
    const name = this.checkName(username);
    const game = await this.getById(id);
    if (game.status !== 'live') {
      throw new BadRequestException('This game is not being played');
    }
    const chess = replay(game.moves);
    const side = this.sideToMove(game);
    if (game[side].username !== name) {
      throw new BadRequestException('It is not your turn');
    }

    let played: Move;
    try {
      played = chess.move(move as string);
    } catch {
      throw new BadRequestException(`${String(move)} is not a legal move`);
    }

    // Take the thinking time off the clock, then add the increment
    const increment = parseTimeControl(game.timeControl)?.increment ?? 0;
    const used = game.turnStartedAt ? this.secondsSince(game.turnStartedAt) : 0;
    const clock = Math.max(0, Math.round(game[side].clock - used + increment));

    // moves: { $size } makes sure nobody else moved while we were checking
    const updated = await this.gameModel
      .findOneAndUpdate(
        { _id: id, status: 'live', moves: { $size: game.moves.length } },
        {
          $push: { moves: played.san },
          $set: {
            fen: chess.fen().split(' ')[0],
            lastMove: [played.from, played.to],
            evaluation: material(chess),
            [`${side}.clock`]: clock,
            turnStartedAt: new Date(),
            // Making a move turns down a draw offer
            drawOffer: '',
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!updated) {
      throw new ConflictException('The game changed. Reload and try again.');
    }

    const over = boardResult(chess);
    return over ? this.finish(updated, over.result, over.reason) : updated;
  }

  async resign(id: string, username: unknown) {
    const name = this.checkName(username);
    const game = await this.getById(id);

    // Before anyone joined, "resign" just cancels the game
    if (game.status === 'waiting') {
      return this.gameModel
        .findOneAndUpdate(
          { _id: id, status: 'waiting' },
          { $set: { status: 'finished', endReason: 'cancelled' } },
          { new: true },
        )
        .lean()
        .exec();
    }
    if (game.status !== 'live') {
      throw new BadRequestException('This game is already over');
    }
    return this.finish(game, lossFor(this.sideOf(game, name)), 'resignation');
  }

  // Offers a draw, or accepts the other player's offer
  async draw(id: string, username: unknown) {
    const name = this.checkName(username);
    const game = await this.getById(id);
    if (game.status !== 'live') {
      throw new BadRequestException('This game is not being played');
    }
    this.sideOf(game, name);
    if (game.drawOffer && game.drawOffer !== name) {
      return this.finish(game, '1/2-1/2', 'agreement');
    }
    return this.gameModel
      .findByIdAndUpdate(id, { $set: { drawOffer: name } }, { new: true })
      .lean()
      .exec();
  }

  // Ends the game and moves both players' ratings
  private async finish(
    game: SavedGame,
    result: GameResult,
    reason: string,
    extra: Record<string, unknown> = {},
  ) {
    const step = game.rated && result !== '1/2-1/2' ? RATING_STEP : 0;
    const whiteChange = result === '1-0' ? step : -step;

    const updated = await this.gameModel
      .findOneAndUpdate(
        { _id: game._id, status: 'live' },
        {
          $set: {
            status: 'finished',
            result,
            endReason: reason,
            drawOffer: '',
            'white.ratingChange': whiteChange,
            'black.ratingChange': -whiteChange,
            ...extra,
          },
        },
        { new: true },
      )
      .lean()
      .exec();
    // Already finished by another request: just send it back
    if (!updated) return this.load(String(game._id));

    if (game.rated) {
      const kind = this.ratingKind(game.timeControl);
      const players: [string, number][] = [
        [game.white.username, whiteChange],
        [game.black.username, -whiteChange],
      ];
      await Promise.all(
        players.map(([username, change]) =>
          this.memberModel
            .updateOne(
              { username, 'ratings.kind': kind },
              {
                $inc: {
                  'ratings.$.value': change,
                  'ratings.$.change': change,
                  'ratings.$.count': 1,
                  gamesPlayed: 1,
                },
              },
            )
            .exec(),
        ),
      );
    }
    return updated;
  }

  private async load(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Game not found');
    const game = await this.gameModel.findById(id).lean().exec();
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }

  private checkName(username: unknown) {
    if (typeof username !== 'string' || !username.trim()) {
      throw new BadRequestException(
        'Send your username, like { "username": "khamid" }',
      );
    }
    return username.trim().toLowerCase();
  }

  // White moves when the number of moves is even
  private sideToMove(game: SavedGame): Side {
    return game.moves.length % 2 === 0 ? 'white' : 'black';
  }

  private sideOf(game: SavedGame, name: string): Side {
    if (game.white.username === name) return 'white';
    if (game.black.username === name) return 'black';
    throw new BadRequestException('You are not playing in this game');
  }

  private secondsSince(date: Date) {
    return (Date.now() - new Date(date).getTime()) / 1000;
  }

  // Bullet, Blitz or Rapid. Classical games count as Rapid.
  private ratingKind(timeControl: string) {
    const kind = TIME_CONTROLS.find((item) => item.time === timeControl)?.kind;
    return kind === 'Bullet' || kind === 'Blitz' ? kind : 'Rapid';
  }

  private async ratingOf(username: string, timeControl: string) {
    const member = await this.memberModel.findOne({ username }).lean().exec();
    if (!member) throw new NotFoundException(`No member called ${username}`);
    const kind = this.ratingKind(timeControl);
    return (
      member.ratings.find((rating) => rating.kind === kind)?.value ??
      START_RATING
    );
  }
}
