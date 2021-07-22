import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/utils/user.decorator';
import { RaiseQuestionDto } from './dto/raise-question.dto';
import { QaService } from './qa.service';

@ApiTags('Question and Answer')
@Controller('question')
export class QaController {
  constructor(private qaService: QaService) {}

  @ApiTags('Raise Question')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/')
  async raiseQuestion(
    @Body() raiseQuestionDto: RaiseQuestionDto,
    @User() user,
  ) {
    raiseQuestionDto.askedBy = user.id;
    const question = await this.qaService.raiseQuestion(raiseQuestionDto);
    return { _id: question._id };
  }

  @ApiTags('Fetch Questions')
  @Get('/')
  async fetchAll(){
    return this.qaService.findAllQuestions();
  }
}
