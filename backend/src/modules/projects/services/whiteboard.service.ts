import type { Whiteboard } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';

export class WhiteboardService {
  async listWhiteboardsByProject(projectId: string): Promise<Whiteboard[]> {
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

    return await prisma.whiteboard.findMany({
      where: { projectId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getWhiteboardById(id: string): Promise<Whiteboard | null> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Whiteboard ID is required');
    }

    return await prisma.whiteboard.findUnique({
      where: { id },
    });
  }

  async createWhiteboard(projectId: string, title: string, data?: any): Promise<Whiteboard> {
    if (!projectId || typeof projectId !== 'string') {
      throw new ValidationError('Project ID is required');
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new ValidationError('Title is required');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return await prisma.whiteboard.create({
      data: {
        projectId,
        title: title.trim(),
        data: data || {},
      },
    });
  }

  async updateWhiteboard(id: string, data: { title?: string; data?: any; order?: number }): Promise<Whiteboard> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Whiteboard ID is required');
    }

    const updateData: any = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new ValidationError('Title cannot be empty');
      }
      updateData.title = data.title.trim();
    }

    if (data.data !== undefined) {
      updateData.data = data.data;
    }

    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    try {
      return await prisma.whiteboard.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Whiteboard not found');
      }
      throw error;
    }
  }

  async deleteWhiteboard(id: string): Promise<Whiteboard> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Whiteboard ID is required');
    }

    try {
      return await prisma.whiteboard.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Whiteboard not found');
      }
      throw error;
    }
  }
}

export const whiteboardService = new WhiteboardService();
