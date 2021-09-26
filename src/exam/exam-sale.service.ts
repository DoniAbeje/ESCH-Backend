import { Inject, Injectable } from '@nestjs/common';
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

import { AlreadyBoughtExamException } from './exceptions/already-bought-exam.exception';
import { PaymentInProcessException } from './exceptions/payment-in-process.exception';
import { PaginationOption } from '../common/pagination-option';
import { ExamSaleQueryBuilder } from './query/exam-sale-query-builder';
import { OrderNotCreatedException } from './exceptions/order-not-created.exception';
import { FreeExamException } from './exceptions/free-exam.exception';
import { ExamEnrollmentService } from './exam-enrollment.service';
import { EnrollForExamDto } from './dto/enroll-for-exam.dto';
import { IPaymentGateway } from './IPaymentGateway.service';

@Injectable()
export class ExamSaleService {
  constructor(
    @InjectModel(ExamSale.name) public examSaleModel: Model<ExamSaleDocument>,
    private examService: ExamService,
    private userService: UserService,
    private enrollmentService: ExamEnrollmentService,
    @Inject('IPaymentGateway')
    private paymentGateway: IPaymentGateway,
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
      const billCreated = await this.paymentGateway.createBill(
        user,
        exam,
        examSale,
      );
      examSale.set({
        billReferenceNumber: billCreated.reference,
      });

      await examSale.save();
      return { redirectUrl: billCreated.redirectUrl, orderId: examSale._id };
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

  async onPaymentStatusChanged(examSaleId, status: ExamSaleStatus) {
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

  async count(status: ExamSaleStatus) {
    return await this.examSaleModel.countDocuments({ status });
  }

  async exists(exam: string, buyer: string) {
    const examSale = await this.examSaleModel.findOne({
      exam,
      buyer,
    });

    return examSale;
  }
}
