import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Learning Management API')
    .setDescription('API documentation for Learning Management project')
    .setVersion('1.0')
    .addTag('User Management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Learning Management API Docs',
    swaggerOptions: { docExpansion: 'none' },
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
