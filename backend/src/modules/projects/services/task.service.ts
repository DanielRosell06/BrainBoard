import type { Task } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterOptions,
  TaskWithSubtasks,
} from '../projects.types.js';

export class TaskService {
  async listTasks(filters?: TaskFilterOptions): Promise<TaskWithSubtasks[]> {
    const where: any = {};

    if (filters?.kanbanId) {
      where.kanbanId = filters.kanbanId;
    }

    if (filters?.projectId) {
      where.kanban = { projectId: filters.projectId };
    }

    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.columnId) {
      where.columnId = filters.columnId;
    }

    if (filters?.hasDueDate === true) {
      where.dueDate = { not: null };
    }

    return await prisma.task.findMany({
      where,
      include: { subtasks: true, kanban: true, column: true, tags: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTaskById(id: string): Promise<TaskWithSubtasks | null> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Task ID is required');
    }

    return await prisma.task.findUnique({
      where: { id },
      include: { subtasks: true, kanban: true, column: true, tags: true },
    });
  }

  async createTask(data: CreateTaskInput): Promise<TaskWithSubtasks> {
    if (!data.kanbanId || typeof data.kanbanId !== 'string') {
      throw new ValidationError('Kanban ID is required');
    }

    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      throw new ValidationError('Title is required');
    }

    const kanban = await prisma.kanban.findUnique({
      where: { id: data.kanbanId },
      select: { id: true },
    });
    if (!kanban) {
      throw new NotFoundError('Kanban not found');
    }

    let dueDate: Date | null = null;
    if (data.dueDate !== undefined && data.dueDate !== null) {
      const parsed = new Date(data.dueDate);
      if (isNaN(parsed.getTime())) {
        throw new ValidationError('Invalid dueDate format');
      }
      dueDate = parsed;
    }
    
    const createData: any = {
      kanbanId: data.kanbanId,
      title: data.title.trim(),
      description: data.description !== undefined && data.description !== null
        ? String(data.description).trim()
        : null,
      status: data.status || 'TODO',
      dueDate,
    };
    
    if (data.columnId) {
      createData.columnId = data.columnId;
    }
    
    if (data.tagIds && Array.isArray(data.tagIds) && data.tagIds.length > 0) {
      createData.tags = {
        connect: data.tagIds.map(id => ({ id }))
      };
    }

    return await prisma.task.create({
      data: createData,
      include: { subtasks: true, kanban: true, column: true, tags: true },
    });
  }

  async updateTask(id: string, data: UpdateTaskInput): Promise<TaskWithSubtasks> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Task ID is required');
    }

    const updateData: any = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.columnId !== undefined) {
      updateData.columnId = data.columnId;
    }

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new ValidationError('Title cannot be empty');
      }
      updateData.title = data.title.trim();
    }

    if (data.kanbanId !== undefined) {
      if (typeof data.kanbanId !== 'string' || !data.kanbanId.trim()) {
        throw new ValidationError('Kanban ID cannot be empty');
      }
      const kanban = await prisma.kanban.findUnique({
        where: { id: data.kanbanId },
        select: { id: true },
      });
      if (!kanban) {
        throw new NotFoundError('Kanban not found');
      }
      updateData.kanbanId = data.kanbanId;
    }

    if (data.description !== undefined) {
      updateData.description =
        data.description === null ? null : String(data.description).trim();
    }

    if (data.dueDate !== undefined) {
      if (data.dueDate === null) {
        updateData.dueDate = null;
      } else {
        const parsed = new Date(data.dueDate);
        if (isNaN(parsed.getTime())) {
          throw new ValidationError('Invalid dueDate format');
        }
        updateData.dueDate = parsed;
      }
    }
    
    if (data.tagIds !== undefined) {
      if (data.tagIds === null) {
        updateData.tags = { set: [] };
      } else if (Array.isArray(data.tagIds)) {
        updateData.tags = { set: data.tagIds.map(id => ({ id })) };
      }
    }

    try {
      return await prisma.task.update({
        where: { id },
        data: updateData,
        include: { subtasks: true, kanban: true, column: true, tags: true },
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Task not found');
      }
      throw error;
    }
  }

  async deleteTask(id: string): Promise<Task> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Task ID is required');
    }

    try {
      return await prisma.task.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Task not found');
      }
      throw error;
    }
  }
}

export const taskService = new TaskService();
