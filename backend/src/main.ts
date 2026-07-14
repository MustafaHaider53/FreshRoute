import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for React frontend (default local port 5173)
  app.enableCors({
    origin: '*', // For development flexibility
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable global path prefix e.g., http://localhost:3000/api/auth/login
  app.setGlobalPrefix('api');

  // Enable global DTO validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties not defined in the DTO
      transform: true, // Automatically converts payloads to typed DTO objects
    }),
  );

  // Set up Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('FreshRoute Supply Chain API')
    .setDescription('The core API service layer for the FreshRoute agricultural marketplace.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[FreshRoute] NestJS backend is running at http://localhost:${port}/api`);
  console.log(`[FreshRoute] Interactive Swagger API documentation is available at http://localhost:${port}/api/docs`);
}
bootstrap();
