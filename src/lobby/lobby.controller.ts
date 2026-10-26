import { Controller, Get } from '@nestjs/common';
import { LobbyService } from './lobby.service';

@Controller('lobby')
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  // GET /lobby → everything the lobby page needs in one request
  @Get()
  getLobby() {
    return this.lobbyService.getLobby();
  }
}
