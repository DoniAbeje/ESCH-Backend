import { NotFoundException } from '@nestjs/common';

export class AnswerDoesNotExistException extends NotFoundException {
  constructor(message?: string) {
    message = message ? message : "Answer doesn't exist";
    super({
      message,
      exception: AnswerDoesNotExistException.name,
    });
  }
}
