import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { QaTestHelperService } from '../src/qa/test-helper.service';
import { configApp } from '../src/utils/config-app';

describe('QA Module (e2e)', () => {
  let app: INestApplication;
  let qaTestHelper: QaTestHelperService;
  const baseUrl = '/qa';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    qaTestHelper =
      moduleFixture.get<QaTestHelperService>(QaTestHelperService);
    configApp(app);

    await app.init();
  });

  beforeEach(async () => {
    await qaTestHelper.clearAnswers();
    await qaTestHelper.clearQuestions();
  });

  afterAll(async () => {
    await app.close();
  });
});
