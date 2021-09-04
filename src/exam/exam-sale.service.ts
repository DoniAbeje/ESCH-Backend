import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import {
  ExamSale,
  ExamSaleDocument,
  ExamSaleStatus,
} from './schema/exam-sale.schema';
import * as medapay from 'medapay';
import MedaPay from 'medapay/lib/medapay';
import { ExamService } from './exam.service';
import { UserDocument } from 'src/user/schemas/user.schema';
import { ExamDocument } from './schema/exam.schema';
import { AlreadyBoughtExamException } from './exceptions/already-bought-exam.exception';
import { PaymentInProcessException } from './exceptions/payment-in-process.exception';
import { PaginationOption } from '../common/pagination-option';
import { ExamSaleQueryBuilder } from './query/exam-sale-query-builder';
const IS_SANDBOX = true;

@Injectable()
export class ExamSaleService {
  private MedaPay: MedaPay;
  constructor(
    @InjectModel(ExamSale.name) public examSaleModel: Model<ExamSaleDocument>,
    private examService: ExamService,
    private userService: UserService,
    configService: ConfigService,
  ) {
    this.MedaPay = medapay.init(
      { bearerToken: configService.get<string>('ESCH_MEDAPAY_BEARER_TOKEN') },
      IS_SANDBOX,
    );
  }

  async buy(examId: string, userId: string) {
    const exam = await this.examService.exists(examId);
    const user = await this.userService.exists(userId);

    let examSale = await this.exists(examId, userId);

    if (examSale) {
      if (examSale.status == ExamSaleStatus.COMPLETE) {
        throw new AlreadyBoughtExamException();
      } else if (examSale.status == ExamSaleStatus.PENDING) {
        throw new PaymentInProcessException();
      }
    }

    examSale = await this.examSaleModel.create({
      exam: exam._id,
      buyer: userId,
      price: exam.price,
    });

    // create a bill medaPay
    // const SAMPLE_BILL = this.createBill(user, exam, examSale);

    // const createBillResponse = await this.MedaPay.create(SAMPLE_BILL);
    // console.log(createBillResponse.billReferenceNumber);

    // examSale.set({
    //   billReferenceNumber: createBillResponse.billReferenceNumber,
    // });

    // await examSale.save();

    return examSale;
  }

  async fetchAll(
    paginationOption: PaginationOption = PaginationOption.DEFAULT,
    buyers: string[] = [],
  ) {
    return (
      await new ExamSaleQueryBuilder(this.examSaleModel)
        .paginate(paginationOption)
        .filterByBuyers(buyers)
        .populateExam()
        .populateBuyer()
        .exec()
    ).all();
  }

  private createBill(
    user: UserDocument,
    exam: ExamDocument,
    examSale: ExamSaleDocument,
  ) {
    return {
      paymentDetails: {
        orderId: examSale._id,
        description: exam.description,
        amount: examSale.price,
        customerName: `${user.firstName} ${user.lastName}`,
        customerPhoneNumber: user.phone,
      },
      redirectUrls: {
        returnUrl: `https://esch.com/exam/${examSale._id}/return`,
        cancelUrl: `https://esch.com/exam/${examSale._id}/cancel`,
        callbackUrl: `https://esch.com/exam/${examSale._id}/callback`,
      },
    };
  }

  async exists(exam: string, buyer: string) {
    const examSale = await this.examSaleModel.findOne({
      exam,
      buyer,
    });

    return examSale;
  }
}
