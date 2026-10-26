import { Controller, Get, Param } from '@nestjs/common';
import { MemberService } from './member.service';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // GET /members/khamid
  @Get(':username')
  getMember(@Param('username') username: string) {
    return this.memberService.getByUsername(username);
  }
}
