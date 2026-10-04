import type { Bookmark } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';

export class BookmarkService {
  async listBookmarksByProject(projectId: string): Promise<Bookmark[]> {
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

    return await prisma.bookmark.findMany({
      where: { projectId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getBookmarkById(id: string): Promise<Bookmark | null> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Bookmark ID is required');
    }

    return await prisma.bookmark.findUnique({
      where: { id },
    });
  }

  async createBookmark(
    projectId: string,
    data: { title: string; url: string; description?: string; group?: string; icon?: string }
  ): Promise<Bookmark> {
    if (!projectId || typeof projectId !== 'string') {
      throw new ValidationError('Project ID is required');
    }

    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      throw new ValidationError('Title is required');
    }

    if (!data.url || typeof data.url !== 'string' || !data.url.trim()) {
      throw new ValidationError('URL is required');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return await prisma.bookmark.create({
      data: {
        projectId,
        title: data.title.trim(),
        url: data.url.trim(),
        description: data.description ?? null,
        group: data.group ?? null,
        icon: data.icon ?? null,
      },
    });
  }

  async updateBookmark(
    id: string,
    data: { title?: string; url?: string; description?: string; group?: string; icon?: string; order?: number }
  ): Promise<Bookmark> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Bookmark ID is required');
    }

    const updateData: any = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new ValidationError('Title cannot be empty');
      }
      updateData.title = data.title.trim();
    }

    if (data.url !== undefined) {
      if (typeof data.url !== 'string' || !data.url.trim()) {
        throw new ValidationError('URL cannot be empty');
      }
      updateData.url = data.url.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.group !== undefined) {
      updateData.group = data.group;
    }

    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }

    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    try {
      return await prisma.bookmark.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Bookmark not found');
      }
      throw error;
    }
  }

  async deleteBookmark(id: string): Promise<Bookmark> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Bookmark ID is required');
    }

    try {
      return await prisma.bookmark.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Bookmark not found');
      }
      throw error;
    }
  }
}

export const bookmarkService = new BookmarkService();
