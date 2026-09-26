import { Status } from '@prisma/client';
import type { Task } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterOptions,
  TaskWithSubtasks,
} from '../projects.types.js';

export const VALID_STATUSES: Status[] = ['TODO', 'IN_PROGRESS', 'DONE'];

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
      if (!VALID_STATUSES.includes(filters.status as Status)) {
        throw new ValidationError(
          `Invalid status: ${filters.status}. Must be one of: ${VALID_STATUSES.join(', ')}`
        );
      }
      where.status = filters.status as Status;
    }

    if (filters?.isSprintActive !== undefined) {
      where.isSprintActive = Boolean(filters.isSprintActive);
    }

    if (filters?.hasDueDate === true) {
      where.dueDate = { not: null };
    }

    return await prisma.task.findMany({
      where,
      include: { subtasks: true, kanban: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTaskById(id: string): Promise<TaskWithSubtasks | null> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Task ID is required');
    }

    return await prisma.task.findUnique({
      where: { id },
      include: { subtasks: true, kanban: true },
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

    let status: Status = 'TODO';
    if (data.status !== undefined) {
      if (!VALID_STATUSES.includes(data.status as Status)) {
        throw new ValidationError(
          `Invalid status: ${data.status}. Must be one of: ${VALID_STATUSES.join(', ')}`
        );
      }
      status = data.status as Status;
    }

    let dueDate: Date | null = null;
    if (data.dueDate !== undefined && data.dueDate !== null) {
      const parsed = new Date(data.dueDate);
      if (isNaN(parsed.getTime())) {
        throw new ValidationError('Invalid dueDate format');
      }
      dueDate = parsed;
    }

    const isSprintActive = data.isSprintActive !== undefined ? Boolean(data.isSprintActive) : false;

    return await prisma.task.create({
      data: {
        kanbanId: data.kanbanId,
        title: data.title.trim(),
        description:
          data.description !== undefined && data.description !== null
            ? String(data.description).trim()
            : null,
        status,
        dueDate,
        isSprintActive,
      },
      include: { subtasks: true, kanban: true },
    });
  }

  async updateTask(id: string, data: UpdateTaskInput): Promise<TaskWithSubtasks> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Task ID is required');
    }

    const updateData: {
      status?: Status;
      title?: string;
      description?: string | null;
      kanbanId?: string;
      dueDate?: Date | null;
      isSprintActive?: boolean;
    } = {};

    if (data.status !== undefined) {
      if (!VALID_STATUSES.includes(data.status as Status)) {
        throw new ValidationError(
          `Invalid status: ${data.status}. Must be one of: ${VALID_STATUSES.join(', ')}`
        );
      }
      updateData.status = data.status as Status;
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

    if (data.isSprintActive !== undefined) {
      updateData.isSprintActive = Boolean(data.isSprintActive);
    }

    try {
      return await prisma.task.update({
        where: { id },
        data: updateData,
        include: { subtasks: true, kanban: true },
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
