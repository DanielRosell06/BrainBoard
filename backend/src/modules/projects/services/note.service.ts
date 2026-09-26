import type { Note } from '@prisma/client';
import { prisma } from '../../../prisma.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';

export class NoteService {
  async listNotesByProject(projectId: string): Promise<Note[]> {
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

    return await prisma.note.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNoteById(id: string): Promise<Note | null> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Note ID is required');
    }

    return await prisma.note.findUnique({
      where: { id },
    });
  }

  async createNote(projectId: string, title: string, content: string): Promise<Note> {
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

    return await prisma.note.create({
      data: {
        projectId,
        title: title.trim(),
        content: content || '',
      },
    });
  }

  async updateNote(id: string, data: { title?: string; content?: string }): Promise<Note> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Note ID is required');
    }

    const updateData: {
      title?: string;
      content?: string;
    } = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new ValidationError('Title cannot be empty');
      }
      updateData.title = data.title.trim();
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    try {
      return await prisma.note.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Note not found');
      }
      throw error;
    }
  }

  async deleteNote(id: string): Promise<Note> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Note ID is required');
    }

    try {
      return await prisma.note.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Note not found');
      }
      throw error;
    }
  }
}

export const noteService = new NoteService();
