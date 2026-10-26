import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The frontend runs on another port, so the browser needs permission to call us
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  });

  // 4000, because the Next.js frontend already uses 3000
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
