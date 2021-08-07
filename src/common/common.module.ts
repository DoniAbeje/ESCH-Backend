import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { TestHelperService } from './services/test-helper.service';

@Module({
  providers: [TestHelperService],
  imports:[UserModule],
  exports: [TestHelperService],
})
export class CommonModule {}
