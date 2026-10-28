import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PuzzleService } from './puzzle.service';

@Controller('puzzles')
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  // GET /puzzles → every puzzle, easiest first
  @Get()
  getAll() {
    return this.puzzleService.getAll();
  }

  // POST /puzzles/6650f0.../result with { "username": "khamid", "solved": true }
  @Post(':id/result')
  saveResult(
    @Param('id') id: string,
    @Body('username') username: string,
    @Body('solved') solved: boolean,
  ) {
    return this.puzzleService.saveResult(id, username, solved);
  }
}
