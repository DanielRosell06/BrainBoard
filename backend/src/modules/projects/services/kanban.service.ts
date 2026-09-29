import type { Kanban } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';
import type {
  CreateKanbanInput,
  UpdateKanbanInput,
  KanbanWithTasks,
} from '../projects.types.js';

export class KanbanService {
  async listKanbansByProject(projectId: string): Promise<KanbanWithTasks[]> {
    if (!projectId || typeof projectId !== 'string') {
      throw new ValidationError('Project ID is required');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return await prisma.kanban.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: {
        columns: true,
        tags: true,
        tasks: {
          orderBy: { createdAt: 'asc' },
          include: {
            subtasks: {
              orderBy: { createdAt: 'asc' },
            },
            tags: true,
          },
        },
      },
    });
  }

  async getKanbanById(id: string): Promise<KanbanWithTasks | null> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Kanban ID is required');
    }

    return await prisma.kanban.findUnique({
      where: { id },
      include: {
        columns: true,
        tags: true,
        tasks: {
          orderBy: { createdAt: 'asc' },
          include: {
            subtasks: {
              orderBy: { createdAt: 'asc' },
            },
            tags: true,
          },
        },
      },
    });
  }

  async createKanban(data: CreateKanbanInput): Promise<KanbanWithTasks> {
    if (!data.projectId || typeof data.projectId !== 'string') {
      throw new ValidationError('Project ID is required');
    }

    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      throw new ValidationError('Title is required');
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return await prisma.kanban.create({
      data: {
        projectId: data.projectId,
        title: data.title.trim(),
        columns: {
          create: [
            { title: 'A Fazer', order: 0 },
            { title: 'Em Andamento', order: 1 },
            { title: 'Concluído', order: 2 },
          ],
        },
      },
      include: {
        columns: { orderBy: { order: 'asc' } },
        tags: true,
        tasks: {
          include: { subtasks: true, tags: true, column: true },
        },
      },
    });
  }

  async updateKanban(id: string, data: UpdateKanbanInput): Promise<KanbanWithTasks> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Kanban ID is required');
    }

    const updateData: {
      title?: string;
    } = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new ValidationError('Title cannot be empty');
      }
      updateData.title = data.title.trim();
    }

    try {
      return await prisma.kanban.update({
        where: { id },
        data: updateData,
        include: {
          columns: true,
          tags: true,
          tasks: {
            include: { subtasks: true, tags: true },
          },
        },
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Kanban not found');
      }
      throw error;
    }
  }

  async deleteKanban(id: string): Promise<Kanban> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Kanban ID is required');
    }

    try {
      return await prisma.kanban.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Kanban not found');
      }
      throw error;
    }
  }
}

export const kanbanService = new KanbanService();
