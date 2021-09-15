import { BadGatewayException } from '@nestjs/common';

export class OrderNotCreatedException extends BadGatewayException {
  constructor(message?: string) {
    message = message ? message : 'Unable to create order';
    super({
      message,
      exception: OrderNotCreatedException.name,
    });
  }
}
