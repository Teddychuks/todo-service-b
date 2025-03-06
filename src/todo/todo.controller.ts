import {  Controller, Logger} from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from './entities/todo.entity';
import { GrpcMethod } from '@nestjs/microservices';
import { 
  TodoList, 
  Empty, 
  TodoById, 
  CreateTodoDto, 
  UpdateTodoDto,
  Todo as ProtoTodo
} from '../proto/todo';
import { Metadata } from '@grpc/grpc-js';

@Controller()
export class TodoController {
  private readonly logger = new Logger('TodoController-B');

  constructor(private readonly todoService: TodoService) {}

  @GrpcMethod('TodoService', 'FindAll')
  async findAll(data: Empty, metadata: Metadata): Promise<TodoList> {
    this.logger.log('gRPC FindAll called on Service B');
    const isRemote = metadata.get('remote');
    
    if (isRemote && isRemote[0]) {
      this.logger.log('Forwarding FindAll request to Service A');
      const todos = await this.todoService.findAllFromServiceA();
      return {
        todos: Array.isArray(todos) 
          ? todos.map((todo: any): ProtoTodo => ({ 
              id: String(todo.id), 
              title: todo.title || '', 
              completed: Boolean(todo.completed) 
            }))
          : []
      };
    } else {
      const todos = await this.todoService.findAll();
      return {
        todos: todos.map((todo: Todo): ProtoTodo => ({ 
          id: String(todo.id), 
          title: todo.title || '', 
          completed: Boolean(todo.completed)
        })),
      };
    }
  }

  @GrpcMethod('TodoService', 'FindOne')
  async findOne(data: TodoById, metadata: Metadata): Promise<ProtoTodo> {
    this.logger.log(`gRPC FindOne called on Service B with ID: ${data.id}`);
    const isRemote = metadata.get('remote');
    
    if (isRemote && isRemote[0]) {
      this.logger.log(`Forwarding FindOne request to Service A for ID: ${data.id}`);
      const todo = await this.todoService.findOneFromServiceA(data.id);
      if (!todo) {
        throw new Error(`Todo with ID ${data.id} not found in Service A`);
      }
      return { 
        id: String(todo.id), 
        title: todo.title || '', 
        completed: Boolean(todo.completed)
      };
    } else {
      const todo = await this.todoService.findOne(data.id);
      if (!todo) {
        throw new Error(`Todo with ID ${data.id} not found`);
      }
      return { 
        id: String(todo.id), 
        title: todo.title || '', 
        completed: Boolean(todo.completed)
      };
    }
  }

  @GrpcMethod('TodoService', 'Create')
  async create(data: CreateTodoDto, metadata: Metadata): Promise<ProtoTodo> {
    this.logger.log(`gRPC Create called on Service B with data: ${JSON.stringify(data)}`);
    const isRemote = metadata.get('remote');
    
    if (isRemote && isRemote[0]) {
      this.logger.log('Forwarding Create request to Service A');
      const todo = await this.todoService.createInServiceA(data);
      return { 
        id: String(todo.id), 
        title: todo.title || '', 
        completed: Boolean(todo.completed)
      };
    } else {
      const todo = await this.todoService.create(data);
      return { 
        id: String(todo.id), 
        title: todo.title || '', 
        completed: Boolean(todo.completed)
      };
    }
  }

  @GrpcMethod('TodoService', 'Update')
  async update(data: UpdateTodoDto, metadata: Metadata): Promise<ProtoTodo> {
    this.logger.log(`gRPC Update called on Service B for ID: ${data.id}`);
    const isRemote = metadata.get('remote');
    
    if (isRemote && isRemote[0]) {
      this.logger.log(`Forwarding Update request to Service A for ID: ${data.id}`);
      const result = await this.todoService.updateInServiceA(data.id, data);
      return { 
        id: String(result.id), 
        title: result.title || '', 
        completed: Boolean(result.completed)
      };
    } else {
      const todo = await this.todoService.update(data.id, data);
      if (!todo) {
        throw new Error(`Todo with ID ${data.id} not found`);
      }
      return { 
        id: String(todo.id), 
        title: todo.title || '', 
        completed: Boolean(todo.completed)
      };
    }
  }

  @GrpcMethod('TodoService', 'Remove')
  async remove(data: TodoById, metadata: Metadata): Promise<Empty> {
    this.logger.log(`gRPC Remove called on Service B for ID: ${data.id}`);
    const isRemote = metadata.get('remote');
    
    if (isRemote && isRemote[0]) {
      this.logger.log(`Forwarding Remove request to Service A for ID: ${data.id}`);
      await this.todoService.removeFromServiceA(data.id);
    } else {
      await this.todoService.remove(data.id);
    }
    return {};
  }
}