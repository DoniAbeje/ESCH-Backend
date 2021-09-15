import { BadRequestException } from '@nestjs/common';

export class PaymentInProcessException extends BadRequestException {
  constructor(message?: string) {
    message = message ? message : 'Payment is in process';
    super({
      message,
      exception: PaymentInProcessException.name,
    });
  }
}
