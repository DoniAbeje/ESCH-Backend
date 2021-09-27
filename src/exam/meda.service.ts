import { Injectable } from '@nestjs/common';
import {
  BillCreatedResponse,
  IPaymentGateway,
} from './IPaymentGateway.service';
import axios from 'axios';
import { UserDocument } from 'src/user/schemas/user.schema';
import { ExamDocument } from './schema/exam.schema';
import {
  ExamSale,
  ExamSaleDocument,
  ExamSaleStatus,
} from './schema/exam-sale.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MedaPaymentGatewayService implements IPaymentGateway {
  constructor(private configService: ConfigService) {}
  private getBillPayload(
    user: UserDocument,
    exam: ExamDocument,
    examSale: ExamSaleDocument,
  ) {
    return {
      purchaseDetails: {
        orderId: examSale._id,
        description: exam.description,
        amount: examSale.price,
        customerName: `${user.firstName} ${user.lastName}`,
        customerPhoneNumber: user.phone,
      },
      redirectUrls: {
        returnUrl:
          this.configService.get<string>('ESCH_MEDA_PAY_RETURN_URL') +
          '?exam_sale_id=' +
          examSale._id,
        cancelUrl:
          this.configService.get<string>('ESCH_MEDA_PAY_CANCEL_URL') +
          '?exam_sale_id=' +
          examSale._id,
        callbackUrl:
          this.configService.get<string>('ESCH_MEDA_PAY_CALLBACK_URL') +
          '?exam_sale_id=' +
          examSale._id,
      },
    };
  }

  async createBill(
    user: UserDocument,
    exam: ExamDocument,
    examSale: ExamSaleDocument,
  ): Promise<BillCreatedResponse> {
    const payload = this.getBillPayload(user, exam, examSale);
    const { data } = await axios.post(
      this.configService.get<string>('ESCH_MEDAPAY_CREATE_ORDER_URL'),
      payload,
      {
        headers: {
          Authorization:
            'Bearer ' +
            this.configService.get<string>('ESCH_MEDAPAY_BEARER_TOKEN'),
        },
      },
    );
    const billCreated: BillCreatedResponse = {
      reference: data.billReferenceNumber,
      redirectUrl: data.link.href,
    };
    return billCreated;
  }
}
