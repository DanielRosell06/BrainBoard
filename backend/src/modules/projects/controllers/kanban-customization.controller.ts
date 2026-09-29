import type { Request, Response } from 'express';
import { kanbanCustomizationService } from '../services/kanban-customization.service.js';

export const addKanbanColumn = async (req: Request, res: Response) => {
  try {
    const kanbanId = String(req.params.kanbanId);
    const { title, order } = req.body;
    const column = await kanbanCustomizationService.addColumn(kanbanId, title, order);
    res.json(column);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const updateKanbanColumn = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.columnId);
    const { title, order } = req.body;
    const column = await kanbanCustomizationService.updateColumn(id, title, order);
    res.json(column);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const deleteKanbanColumn = async (req: Request, res: Response) => {
  try {
    await kanbanCustomizationService.removeColumn(String(req.params.columnId));
    res.status(204).send();
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const addKanbanTag = async (req: Request, res: Response) => {
  try {
    const kanbanId = String(req.params.kanbanId);
    const { name, color } = req.body;
    const tag = await kanbanCustomizationService.addTag(kanbanId, name, color);
    res.json(tag);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const updateKanbanTag = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.tagId);
    const { name, color } = req.body;
    const tag = await kanbanCustomizationService.updateTag(id, name, color);
    res.json(tag);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const deleteKanbanTag = async (req: Request, res: Response) => {
  try {
    await kanbanCustomizationService.removeTag(String(req.params.tagId));
    res.status(204).send();
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};
