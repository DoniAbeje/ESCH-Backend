import { INestApplication, ValidationPipe } from '@nestjs/common';

export function configApp(app: INestApplication) {
  app.enableCors();
  return app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
}
