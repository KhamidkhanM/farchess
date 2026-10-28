import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TournamentService } from './tournament.service';

@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  // GET /tournaments → events that have not started yet
  @Get()
  getUpcoming() {
    return this.tournamentService.getUpcoming();
  }

  // POST /tournaments/6650f0.../join with { "username": "khamid" }
  @Post(':id/join')
  join(@Param('id') id: string, @Body('username') username: string) {
    return this.tournamentService.join(id, username);
  }

  // POST /tournaments/6650f0.../leave with { "username": "khamid" }
  @Post(':id/leave')
  leave(@Param('id') id: string, @Body('username') username: string) {
    return this.tournamentService.leave(id, username);
  }
}
