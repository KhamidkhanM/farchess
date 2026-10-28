import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { MemberService } from './member.service';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // GET /members?search=play → up to 20 players whose name contains "play"
  @Get()
  search(@Query('search') search?: string) {
    return this.memberService.search(search);
  }

  // GET /members/khamid
  @Get(':username')
  getMember(@Param('username') username: string) {
    return this.memberService.getByUsername(username);
  }

  // GET /members/khamid/friends
  @Get(':username/friends')
  getFriends(@Param('username') username: string) {
    return this.memberService.getFriends(username);
  }

  // POST /members/khamid/friends with { "friend": "opponent" }
  @Post(':username/friends')
  addFriend(
    @Param('username') username: string,
    @Body('friend') friend: string,
  ) {
    return this.memberService.addFriend(username, friend);
  }

  // DELETE /members/khamid/friends/opponent
  @Delete(':username/friends/:friend')
  removeFriend(
    @Param('username') username: string,
    @Param('friend') friend: string,
  ) {
    return this.memberService.removeFriend(username, friend);
  }
}
