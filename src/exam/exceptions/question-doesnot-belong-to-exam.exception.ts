import { BadRequestException } from '@nestjs/common';

export class QuestionDoesNotBelongToExamException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : 'Question Does Not Belong To Exam';
    super({
      message,
      exception: QuestionDoesNotBelongToExamException.name,
    });
  }
}
