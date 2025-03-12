import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Create a logger instance for the bootstrap process
  const logger = new Logger('Bootstrap');

  // Create the main HTTP application
  const app = await NestFactory.create(AppModule);

  // Get the ConfigService from the application to access environment variables
  const configService = app.get(ConfigService);

  // Add validation pipe to automatically validate incoming requests
  // based on the validation decorators in the DTOs
  app.useGlobalPipes(new ValidationPipe());

  // Create and connect gRPC microservice to handle requests from todo-service-a
  const grpcHost = configService.get('GRPC_HOST', '0.0.0.0');
  const grpcPort = configService.get('GRPC_PORT', '5001');
  const httpPort = configService.get('PORT', '3001');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'todo',
      protoPath: join(__dirname, './grpc/proto/todo.proto'),
      url: `${grpcHost}:${grpcPort}`,
    },
  });

  // Start both the HTTP and gRPC servers
  // startAllMicroservices() starts the gRPC server
  await app.startAllMicroservices();

  // app.listen() starts the HTTP server for REST API
  await app.listen(httpPort);

  logger.log(
    `todo-service-b REST API is running on: http://localhost:${httpPort}`,
  );
  logger.log(
    `todo-service-b gRPC server is running on: ${grpcHost}:${grpcPort}`,
  );
}
bootstrap();
