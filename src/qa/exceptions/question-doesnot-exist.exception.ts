import { NotFoundException } from '@nestjs/common';

export class QuestionDoesNotExistException extends NotFoundException {
  constructor(message?: string) {
    message = message ? message : "Question doesn't exist";
    super({
      message,
      exception: QuestionDoesNotExistException.name,
    });
  }
}
