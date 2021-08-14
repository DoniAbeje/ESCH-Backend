import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';

@Module({
  providers: [],
  imports:[UserModule],
  exports: [],
})
export class CommonModule {}
