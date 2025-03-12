import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TodoService } from '../todo/todo.service';
import {
  CreateTodoRequest,
  DeleteResponse,
  Empty,
  TodoById,
  TodoResponse,
  TodosResponse,
  UpdateTodoRequest,
} from './interfaces/todo.interface';

@Controller()
export class TodoGrpcController {
  private readonly logger = new Logger(TodoGrpcController.name);

  constructor(private readonly todoService: TodoService) {}

  @GrpcMethod('TodoService', 'CreateTodo')
  async createTodo(data: CreateTodoRequest): Promise<TodoResponse> {
    this.logger.log(
      `Received CreateTodo gRPC request from Service A: ${JSON.stringify(data)}`,
    );

    // Handling the gRPC request directly in service-b's database
    const result = await this.todoService.createTodoInOwnDatabase(data);

    // Convert database entity to gRPC response
    const response: TodoResponse = {
      id: result.id,
      title: result.title,
      completed: result.completed,
    };

    return response;
  }

  @GrpcMethod('TodoService', 'GetTodos')
  async getTodos(data: Empty): Promise<TodosResponse> {
    this.logger.log('Received GetTodos gRPC request from Service A');

    const result = await this.todoService.findAllInOwnDatabase();

    const response: TodosResponse = {
      todos: result.todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
      })),
    };

    return response;
  }

  @GrpcMethod('TodoService', 'GetTodoById')
  async getTodoById(data: TodoById): Promise<TodoResponse> {
    this.logger.log(
      `Received GetTodoById gRPC request from Service A for ID: ${data.id}`,
    );

    try {
      const todo = await this.todoService.findOneInOwnDatabase(data.id);

      return {
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
      };
    } catch (error) {
      this.logger.error(`Error finding todo: ${error.message}`);
      throw error;
    }
  }

  @GrpcMethod('TodoService', 'UpdateTodo')
  async updateTodo(data: UpdateTodoRequest): Promise<TodoResponse> {
    this.logger.log(
      `Received UpdateTodo gRPC request from Service A: ${JSON.stringify(data)}`,
    );

    try {
      const todo = await this.todoService.updateInOwnDatabase(data.id, {
        title: data.title,
        completed: data.completed,
      });

      const response: TodoResponse = {
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
      };

      return response;
    } catch (error) {
      this.logger.error(`Error updating todo: ${error.message}`);
      throw error;
    }
  }

  @GrpcMethod('TodoService', 'DeleteTodo')
  async deleteTodo(data: TodoById): Promise<DeleteResponse> {
    this.logger.log(
      `Received DeleteTodo gRPC request from Service A for ID: ${data.id}`,
    );

    try {
      const result = await this.todoService.removeFromOwnDatabase(data.id);

      const response: DeleteResponse = {
        success: result.success,
      };

      return response;
    } catch (error) {
      this.logger.error(`Error deleting todo: ${error.message}`);
      throw error;
    }
  }
}
