import { BadRequestException } from '@nestjs/common';

export class AlreadyBoughtExamException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : 'Already Bought The Exam';
    super({
      message,
      exception: AlreadyBoughtExamException.name,
    });
  }
}
