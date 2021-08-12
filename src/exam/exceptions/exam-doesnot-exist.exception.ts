import { NotFoundException } from '@nestjs/common';

export class ExamDoesNotExistException extends NotFoundException {
  constructor(message?: string) {
    message = message ? message : "Exam doesn't exist";
    super({
      message,
      exception: ExamDoesNotExistException.name,
    });
  }
}
