import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GameService } from './game.service';
import { PlayService } from './play.service';

@Controller('games')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly playService: PlayService,
  ) {}

  // GET /games?player=khamid&limit=5 → that player's finished games
  @Get()
  getFinished(
    @Query('player') player: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.gameService.getFinishedByPlayer(
      player ?? '',
      Math.min(limit, 50),
    );
  }

  // GET /games/live
  @Get('live')
  getLive() {
    return this.gameService.getLive();
  }

  // GET /games/open?timeControl=3%2B2 → games waiting for a second player
  @Get('open')
  getOpen(@Query('timeControl') timeControl?: string) {
    return this.gameService.getOpen(timeControl);
  }

  // GET /games/featured
  @Get('featured')
  getFeatured() {
    return this.gameService.getFeatured();
  }

  // GET /games/6650f0... (must come after the routes above, or "live" would be read as an id)
  @Get(':id')
  getById(@Param('id') id: string) {
    // The play service also ends the game if a clock ran out
    return this.playService.getById(id);
  }

  // POST /games with { "username": "khamid", "timeControl": "3+2", "color": "white" }
  // color can also be "black" or "random"
  @Post()
  create(
    @Body('username') username: string,
    @Body('timeControl') timeControl: string,
    @Body('color') color: string,
  ) {
    return this.playService.create(username, timeControl, color);
  }

  // POST /games/6650f0.../join with { "username": "opponent" }
  @Post(':id/join')
  join(@Param('id') id: string, @Body('username') username: string) {
    return this.playService.join(id, username);
  }

  // POST /games/6650f0.../move with { "username": "khamid", "move": "e4" }
  @Post(':id/move')
  move(
    @Param('id') id: string,
    @Body('username') username: string,
    @Body('move') move: string,
  ) {
    return this.playService.move(id, username, move);
  }

  // POST /games/6650f0.../resign with { "username": "khamid" }
  @Post(':id/resign')
  resign(@Param('id') id: string, @Body('username') username: string) {
    return this.playService.resign(id, username);
  }

  // POST /games/6650f0.../draw with { "username": "khamid" }: offers a draw, or accepts one
  @Post(':id/draw')
  draw(@Param('id') id: string, @Body('username') username: string) {
    return this.playService.draw(id, username);
  }

  // POST /games/6650f0.../chat with { "from": "khamid", "text": "gg" }
  @Post(':id/chat')
  addChat(
    @Param('id') id: string,
    @Body('from') from: string,
    @Body('text') text: string,
  ) {
    return this.gameService.addChat(id, from, text);
  }
}
