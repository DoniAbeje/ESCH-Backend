import { BadRequestException } from '@nestjs/common';

export class QuestionAlreadyAddedException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : 'Question already added';
    super({
      message,
      exception: QuestionAlreadyAddedException.name,
    });
  }
}
