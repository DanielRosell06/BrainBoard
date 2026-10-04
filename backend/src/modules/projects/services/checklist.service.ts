import type { Checklist, ChecklistItem } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';

export class ChecklistService {
  async listChecklistsByProject(projectId: string): Promise<(Checklist & { items: ChecklistItem[] })[]> {
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

    return await prisma.checklist.findMany({
      where: { projectId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getChecklistById(id: string): Promise<(Checklist & { items: ChecklistItem[] }) | null> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Checklist ID is required');
    }

    return await prisma.checklist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async createChecklist(projectId: string, title: string): Promise<Checklist> {
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

    return await prisma.checklist.create({
      data: {
        projectId,
        title: title.trim(),
      },
    });
  }

  async updateChecklist(id: string, data: { title?: string; order?: number }): Promise<Checklist> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Checklist ID is required');
    }

    const updateData: any = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new ValidationError('Title cannot be empty');
      }
      updateData.title = data.title.trim();
    }

    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    try {
      return await prisma.checklist.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Checklist not found');
      }
      throw error;
    }
  }

  async deleteChecklist(id: string): Promise<Checklist> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Checklist ID is required');
    }

    try {
      return await prisma.checklist.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Checklist not found');
      }
      throw error;
    }
  }

  async addItem(checklistId: string, text: string): Promise<ChecklistItem> {
    if (!checklistId || typeof checklistId !== 'string') {
      throw new ValidationError('Checklist ID is required');
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new ValidationError('Text is required');
    }

    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      select: { id: true },
    });
    if (!checklist) {
      throw new NotFoundError('Checklist not found');
    }

    return await prisma.checklistItem.create({
      data: {
        checklistId,
        text: text.trim(),
        isDone: false,
      },
    });
  }

  async updateItem(id: string, data: { text?: string; isDone?: boolean; order?: number }): Promise<ChecklistItem> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Item ID is required');
    }

    const updateData: any = {};

    if (data.text !== undefined) {
      if (typeof data.text !== 'string' || !data.text.trim()) {
        throw new ValidationError('Text cannot be empty');
      }
      updateData.text = data.text.trim();
    }

    if (data.isDone !== undefined) {
      updateData.isDone = data.isDone;
    }

    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    try {
      return await prisma.checklistItem.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Checklist item not found');
      }
      throw error;
    }
  }

  async toggleItem(id: string, isDone?: boolean): Promise<ChecklistItem> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Item ID is required');
    }

    const item = await prisma.checklistItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundError('Checklist item not found');
    }

    const newIsDone = isDone !== undefined ? isDone : !item.isDone;

    return await prisma.checklistItem.update({
      where: { id },
      data: { isDone: newIsDone },
    });
  }

  async deleteItem(id: string): Promise<ChecklistItem> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Item ID is required');
    }

    try {
      return await prisma.checklistItem.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Checklist item not found');
      }
      throw error;
    }
  }
}

export const checklistService = new ChecklistService();
