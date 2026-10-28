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

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

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

  // GET /games/featured
  @Get('featured')
  getFeatured() {
    return this.gameService.getFeatured();
  }

  // GET /games/6650f0... (must come after the routes above, or "live" would be read as an id)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.gameService.getById(id);
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
