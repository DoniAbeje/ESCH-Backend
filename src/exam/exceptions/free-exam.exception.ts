import { BadRequestException } from '@nestjs/common';

export class FreeExamException extends BadRequestException {
  constructor(message?: string) {
    message = message
      ? message
      : 'You can not buy this exam because it is free';
    super({
      message,
      exception: FreeExamException.name,
    });
  }
}
