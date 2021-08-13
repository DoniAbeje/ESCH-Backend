import { BadRequestException } from '@nestjs/common';

export class DuplicateChoiceValueFoundException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : 'Duplicate choice value found';
    super({
      message,
      exception: DuplicateChoiceValueFoundException.name,
    });
  }
}
