import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';

export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(new ZodValidationPipe());
}

export function configureSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Account Management API')
    .setDescription(
      'REST API for banking account management — deposits, withdrawals, and transaction statements.',
    )
    .setVersion('1.0')
    .addTag('accounts', 'Account lifecycle operations')
    .addTag('transactions', 'Deposits, withdrawals, and statement retrieval')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(document));
}
