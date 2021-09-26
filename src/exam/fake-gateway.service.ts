import { Injectable } from '@nestjs/common';
import {
  BillCreatedResponse,
  IPaymentGateway,
} from './IPaymentGateway.service';
import { UserDocument } from 'src/user/schemas/user.schema';
import { ExamDocument } from './schema/exam.schema';
import { ExamSaleDocument } from './schema/exam-sale.schema';

@Injectable()
export class FakeGatewayService implements IPaymentGateway {
  async createBill(
    user: UserDocument,
    exam: ExamDocument,
    examSale: ExamSaleDocument,
  ): Promise<BillCreatedResponse> {
    const billCreated: BillCreatedResponse = {
      reference: 'TR5676431',
      redirectUrl:
        'https://open.spotify.com/track/0b18g3G5spr4ZCkz7Y6Q0Q?si=23546f8437d24fb6',
    };
    return billCreated;
  }
}
