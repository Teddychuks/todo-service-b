import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';
import { 
  Todo, 
  CreateTodoDto,
  UpdateTodoDto, 
  Empty, 
  TodoServiceClient,
  TODO_PACKAGE_NAME,
  TODO_SERVICE_NAME
} from '../proto/todo';
import * as grpc from '@grpc/grpc-js';

@Injectable()
export class RemoteTodoService implements OnModuleInit {
  private readonly logger = new Logger('RemoteTodoService-B');
  private todoService: TodoServiceClient;

  @Client({
    transport: Transport.GRPC,
    options: {
      package: TODO_PACKAGE_NAME,
      protoPath: join(__dirname, '../proto/todo.proto'),
      url: '13.61.177.222:5002',
      credentials: grpc.credentials.createSsl() // Todo Service A
    },
  })
  private client: ClientGrpc;

  onModuleInit() {
    this.todoService = this.client.getService<TodoServiceClient>(TODO_SERVICE_NAME);
    this.logger.log('Remote Todo client initialized for Service A');
  }

  async createInRemoteService(data: CreateTodoDto): Promise<Todo> {
    this.logger.log(`Creating todo in Service A: ${JSON.stringify(data)}`);
    return firstValueFrom(this.todoService.create(data));
  }

  async findAllFromRemoteService(): Promise<Todo[]> {
    this.logger.log('Fetching todos from Service A');
    const response = await firstValueFrom(this.todoService.findAll({} as Empty));
    return response.todos;
  }
  
  async findOneFromRemoteService(id: string): Promise<Todo> {
    this.logger.log(`Fetching todo with id ${id} from Service A`);
    return firstValueFrom(this.todoService.findOne({ id }));
  }
  
  async updateInRemoteService(data: UpdateTodoDto): Promise<Todo> {
    this.logger.log(`Updating todo in Service A: ${JSON.stringify(data)}`);
    return firstValueFrom(this.todoService.update(data));
  }
  
  async removeFromRemoteService(id: string): Promise<void> {
    this.logger.log(`Removing todo with id ${id} from Service A`);
    await firstValueFrom(this.todoService.remove({ id }));
  }
}