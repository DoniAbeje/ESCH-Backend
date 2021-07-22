import { BadRequestException } from '@nestjs/common';

export class QuestionDoesNotExistException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : "Question doesn't exist";
    super({
      message,
      exception: QuestionDoesNotExistException.name,
    });
  }
}
