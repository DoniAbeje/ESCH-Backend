import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configApp } from './utils/config-app';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configApp(app);

  const options = new DocumentBuilder()
    .setTitle('ESCH')
    .setDescription('ESCH API description')
    .setVersion('1.0')
    // .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('doc', app, document);

  await app.listen(3000);
}
bootstrap();
