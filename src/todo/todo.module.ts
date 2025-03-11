import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { TodoGrpcClient } from '../grpc/todo.client';
import { TodoGrpcController } from '../grpc/todo.controller';
import { Todo } from '../entity/todo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Todo]),
    
    // Registers gRPC client to connect to todo-service-a
    ClientsModule.registerAsync([
      {
        name: 'TODO_SERVICE_A',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'todo',
            protoPath: join(__dirname, '../grpc/proto/todo.proto'),
            url: configService.get('SERVICE_A_GRPC_URL', 'localhost:5001'),
          },
        }),
      },
    ]),
  ],
  controllers: [TodoController, TodoGrpcController],
  providers: [TodoService, TodoGrpcClient],
})
export class TodoModule {}