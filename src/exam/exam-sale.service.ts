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
import { ExamService } from './exam.service';
import { UserDocument } from 'src/user/schemas/user.schema';
import { ExamDocument } from './schema/exam.schema';
import { AlreadyBoughtExamException } from './exceptions/already-bought-exam.exception';
import { PaymentInProcessException } from './exceptions/payment-in-process.exception';
import { PaginationOption } from '../common/pagination-option';
import { ExamSaleQueryBuilder } from './query/exam-sale-query-builder';
import axios from 'axios';
import { OrderNotCreatedException } from './exceptions/order-not-created.exception';
import { FreeExamException } from './exceptions/free-exam.exception';
import { ExamEnrollmentService } from './exam-enrollment.service';
import { EnrollForExamDto } from './dto/enroll-for-exam.dto';

@Injectable()
export class ExamSaleService {
  constructor(
    @InjectModel(ExamSale.name) public examSaleModel: Model<ExamSaleDocument>,
    private examService: ExamService,
    private userService: UserService,
    private configService: ConfigService,
    private enrollmentService: ExamEnrollmentService,
  ) {}

  async buy(examId: string, userId: string) {
    const exam = await this.examService.exists(examId);
    const user = await this.userService.exists(userId);

    if (exam.price == 0) {
      throw new FreeExamException();
    }

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

    try {
      const payload = this.getBillPayload(user, exam, examSale);
      const { data } = await this.createMedaOrder(payload);
      examSale.set({
        billReferenceNumber: data.billReferenceNumber,
      });

      await examSale.save();
      return { redirectUrl: data.link.href, orderId: examSale._id };
    } catch (e) {
      console.log(e);

      await this.examSaleModel.deleteOne({ _id: examSale._id });
      throw new OrderNotCreatedException();
    }
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

  async onPaymentStatusChenged(examSaleId, status: ExamSaleStatus) {
    const examSale = await this.examSaleModel.findById(examSaleId);
    if (examSale && status == ExamSaleStatus.COMPLETE) {
      const enrollmentDto: EnrollForExamDto = {
        exam: examSale.exam,
        examinee: examSale.buyer,
      };
      await this.enrollmentService.enroll(enrollmentDto, false);
      examSale.set('status', ExamSaleStatus.COMPLETE);
      await examSale.save();
    }
  }

  private getBillPayload(
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
        returnUrl:
          this.configService.get<string>('ESCH_MEDA_PAY_RETURN_URL') +
          '?exam_sale_id=' +
          examSale._id,
        cancelUrl:
          this.configService.get<string>('ESCH_MEDA_PAY_RETURN_URL') +
          '?exam_sale_id=' +
          examSale._id,
        callbackUrl:
          this.configService.get<string>('ESCH_MEDA_PAY_RETURN_URL') +
          '?exam_sale_id=' +
          examSale._id,
      },
    };
  }

  private async createMedaOrder(payload) {
    return await axios.post(
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
  }

  async exists(exam: string, buyer: string) {
    const examSale = await this.examSaleModel.findOne({
      exam,
      buyer,
    });

    return examSale;
  }
}
