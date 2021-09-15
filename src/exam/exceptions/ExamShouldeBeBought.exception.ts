import { BadRequestException } from '@nestjs/common';

export class ExamShouldBeBoughtException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : 'You need to buy this exam';
    super({
      message,
      exception: ExamShouldBeBoughtException.name,
    });
  }
}
