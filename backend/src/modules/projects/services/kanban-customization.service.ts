import type { KanbanColumn, KanbanTag } from '@prisma/client';
import { prisma } from '../../../prisma.js';

export class KanbanCustomizationService {
  async addColumn(kanbanId: string, title: string, order?: number): Promise<KanbanColumn> {
    return await prisma.kanbanColumn.create({
      data: { kanbanId, title, order: order || 0 }
    });
  }
  async updateColumn(id: string, title?: string, order?: number): Promise<KanbanColumn> {
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (order !== undefined) data.order = order;
    return await prisma.kanbanColumn.update({ where: { id }, data });
  }
  async removeColumn(id: string): Promise<KanbanColumn> {
    return await prisma.kanbanColumn.delete({ where: { id } });
  }
  
  async addTag(kanbanId: string, name: string): Promise<KanbanTag> {
    return await prisma.kanbanTag.create({
      data: { kanbanId, name }
    });
  }
  async updateTag(id: string, name?: string): Promise<KanbanTag> {
    const data: any = {};
    if (name !== undefined) data.name = name;
    return await prisma.kanbanTag.update({ where: { id }, data });
  }
  async removeTag(id: string): Promise<KanbanTag> {
    return await prisma.kanbanTag.delete({ where: { id } });
  }
}
export const kanbanCustomizationService = new KanbanCustomizationService();
