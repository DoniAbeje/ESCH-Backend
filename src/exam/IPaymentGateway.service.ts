import { UserDocument } from '../user/schemas/user.schema';
import { ExamSaleDocument } from './schema/exam-sale.schema';
import { ExamDocument } from './schema/exam.schema';

export interface IPaymentGateway {

  createBill(
    user: UserDocument,
    exam: ExamDocument,
    examSale: ExamSaleDocument,
  ): Promise<BillCreatedResponse>;
}

export class BillCreatedResponse {
  reference: String;
  redirectUrl: String;
}