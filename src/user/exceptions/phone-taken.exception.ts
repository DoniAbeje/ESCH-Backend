import { BadRequestException } from '@nestjs/common';

export class PhoneTakenException extends BadRequestException {
  constructor() {
    super({
      message: 'Phone alreay taken',
      exception: PhoneTakenException.name,
    });
  }
}
