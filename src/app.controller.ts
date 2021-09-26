import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { GetAuth } from './common/decorators/get-auth.decorator';
import { UserRole } from './user/schemas/user.schema';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GetAuth('/report', 'Get dashboard report', UserRole.ADMIN)
  async stat() {
    return await this.appService.getStat();
  }
}
