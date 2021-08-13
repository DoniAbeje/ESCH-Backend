import { BadRequestException } from '@nestjs/common';

export class DuplicateChoiceKeyFoundException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : 'Duplicate key found';
    super({
      message,
      exception: DuplicateChoiceKeyFoundException.name,
    });
  }
}
