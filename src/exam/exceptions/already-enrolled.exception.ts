import { BadRequestException } from '@nestjs/common';

export class AlreadyEnrolledException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : 'You are already enrolled';
    super({
      message,
      exception: AlreadyEnrolledException.name,
    });
  }
}
