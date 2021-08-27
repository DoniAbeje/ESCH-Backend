import { BadRequestException } from '@nestjs/common';

export class AnswerKeyNotPartOfChoiceException extends BadRequestException {
  constructor(message?: string) {
    message = message
      ? message
      : 'Correct answer key is not part of the choice';
    super({
      message,
      exception: AnswerKeyNotPartOfChoiceException.name,
    });
  }
}
