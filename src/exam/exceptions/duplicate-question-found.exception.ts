import { BadRequestException } from '@nestjs/common';

export class DuplicateQuestionFoundException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : 'Duplicate question found';
    super({
      message,
      exception: DuplicateQuestionFoundException.name,
    });
  }
}
