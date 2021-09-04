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

    let examSale = await this.exists(examId, userId, false);

    if (!examSale) {
      examSale = await this.examSaleModel.create({
        exam: exam._id,
        buyer: userId,
        price: exam.price,
      });
    } else {
      if (examSale.status == ExamSaleStatus.COMPLETE) {
        // throw
      }

      if (examSale.status == ExamSaleStatus.PENDING) {
        // throw
      }
    }

    // create a bill medaPay
    const SAMPLE_BILL = {
      paymentDetails: {
        orderId: examSale._id,
        description: exam.description,
        amount: examSale.price,
        customerName: `${user.firstName} ${user.lastName}`,
        customerPhoneNumber: user.phone,
      },
      redirectUrls: {
        returnUrl: '',
        cancelUrl: '',
        callbackUrl: '',
      },
    };

    const createBillResponse = await this.MedaPay.create(SAMPLE_BILL);
    console.log(createBillResponse.billReferenceNumber);

    examSale.set({
      billReferenceNumber: createBillResponse.billReferenceNumber,
      status: ExamSaleStatus.PENDING,
    });

    await examSale.save();

    return examSale;
  }

  async exists(exam: string, buyer: string, throwException = true) {
    const examSale = await this.examSaleModel.findOne({
      exam,
      buyer,
    });

    if (!examSale && throwException) {
      //throw exception
    }

    return examSale;
  }
}
