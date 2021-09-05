import { IsNumber } from 'class-validator';

export class ExamReportDto {
  // @IsNumber()
  // totalNoExamsTaken: string;

  @IsNumber()
  noOfQuestion?: number;

  @IsNumber()
  noOfAnsweredQuestion?: number;

  @IsNumber()
  noOfCorrectAnswers?: number;
}
