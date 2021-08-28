import { NotFoundException } from '@nestjs/common';

export class NotEnrolledException extends NotFoundException {
  constructor(message?: string) {
    message = message ? message : 'Not Enrolled Yet';
    super({
      message,
      exception: NotEnrolledException.name,
    });
  }
}
