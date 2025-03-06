import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './entities/todo.entity';
import { RemoteTodoService } from './remote-todo.service';
import { CreateTodoDto, UpdateTodoDto } from '../proto/todo';

@Injectable()
export class TodoService {
  private readonly logger = new Logger('TodoService-B');

  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
    private remoteTodoService: RemoteTodoService
  ) {}

  async findAll(): Promise<Todo[]> {
    this.logger.log('Finding all todos from Service B');
    return this.todoRepository.find();
  }

  async findOne(id: string): Promise<Todo | null> {
    this.logger.log(`Finding todo with id ${id} from Service B`);
    return this.todoRepository.findOne({ where: { id } });
  }

  async create(data: CreateTodoDto): Promise<Todo> {
    this.logger.log(`Creating todo in Service B: ${JSON.stringify(data)}`);
    
    const todo = this.todoRepository.create({
      title: data.title,
    });
    
    return this.todoRepository.save(todo);
  }

  async createInServiceA(data: CreateTodoDto): Promise<any> {
    this.logger.log(`Requesting to create todo in Service A: ${JSON.stringify(data)}`);
    return this.remoteTodoService.createInRemoteService(data);
  }

  async findAllFromServiceA(): Promise<any[]> {
    this.logger.log('Requesting todos from Service A');
    return this.remoteTodoService.findAllFromRemoteService();
  }
  
  async findOneFromServiceA(id: string): Promise<any> {
    this.logger.log(`Requesting todo with id ${id} from Service A`);
    return this.remoteTodoService.findOneFromRemoteService(id);
  }

  async update(id: string, data: Partial<UpdateTodoDto>): Promise<Todo | null> {
    this.logger.log(`Updating todo with id ${id} in Service B`);
    await this.todoRepository.update(id, {
      title: data.title,
      completed: data.completed,
    });
    
    return this.todoRepository.findOne({ where: { id } });
  }
  
  async updateInServiceA(id: string, data: Partial<UpdateTodoDto>): Promise<any> {
    this.logger.log(`Requesting to update todo with id ${id} in Service A`);
    return this.remoteTodoService.updateInRemoteService({
      id,
      title: data.title || '',
      completed: data.completed || false
    });
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing todo with id ${id} from Service B`);
    await this.todoRepository.delete(id);
  }
  
  async removeFromServiceA(id: string): Promise<void> {
    this.logger.log(`Requesting to remove todo with id ${id} from Service A`);
    await this.remoteTodoService.removeFromRemoteService(id);
  }
}