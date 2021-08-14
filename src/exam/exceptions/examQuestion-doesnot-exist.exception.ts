import { NotFoundException } from '@nestjs/common';

export class ExamQuestionDoesNotExistException extends NotFoundException {
  constructor(message?: string) {
    message = message ? message : "Exam Question doesn't exist";
    super({
      message,
      exception: ExamQuestionDoesNotExistException.name,
    });
  }
}
