import type { Request, Response } from 'express';
import { projectService, VALID_PROJECT_STATUSES, VALID_PROJECT_TYPES } from '../services/project.service.js';
import { kanbanService } from '../services/kanban.service.js';
import { noteService } from '../services/note.service.js';
import { updateLogService } from '../services/update-log.service.js';
import { memberService } from '../services/member.service.js';
import { taskService } from '../services/task.service.js';
import { subtaskService } from '../services/subtask.service.js';
import { whiteboardService } from '../services/whiteboard.service.js';
import { checklistService } from '../services/checklist.service.js';
import { bookmarkService } from '../services/bookmark.service.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';

// ==========================================
// PROJECTS CONTROLLER
// ==========================================

export const listProjects = async (req: Request, res: Response) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const type = req.query.type ? String(req.query.type) : undefined;

    if (status && !VALID_PROJECT_STATUSES.includes(status as any)) {
      return res.status(400).json({
        error: `Invalid project status: ${status}. Must be one of: ${VALID_PROJECT_STATUSES.join(', ')}`,
      });
    }
    if (type && !VALID_PROJECT_TYPES.includes(type as any)) {
      return res.status(400).json({
        error: `Invalid project type: ${type}. Must be one of: ${VALID_PROJECT_TYPES.join(', ')}`,
      });
    }

    const projects = await projectService.listProjects({
      status,
      type,
    });
    res.json(projects);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const project = await projectService.getProjectById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { title, description, businessLogic, status, type, githubRepo, settings } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (status !== undefined && !VALID_PROJECT_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid project status: ${status}. Must be one of: ${VALID_PROJECT_STATUSES.join(', ')}`,
      });
    }
    if (type !== undefined && !VALID_PROJECT_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid project type: ${type}. Must be one of: ${VALID_PROJECT_TYPES.join(', ')}`,
      });
    }

    const project = await projectService.createProject({
      title,
      description,
      businessLogic,
      status,
      type,
      githubRepo,
      settings,
    });
    res.status(201).json(project);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { title, description, businessLogic, status, type, githubRepo, settings, order } = req.body;

    if (status !== undefined && !VALID_PROJECT_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid project status: ${status}. Must be one of: ${VALID_PROJECT_STATUSES.join(', ')}`,
      });
    }
    if (type !== undefined && !VALID_PROJECT_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid project type: ${type}. Must be one of: ${VALID_PROJECT_TYPES.join(', ')}`,
      });
    }
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const project = await projectService.updateProject(id, {
      title,
      description,
      businessLogic,
      status,
      type,
      githubRepo,
      settings,
      order,
    });
    res.json(project);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateBusinessLogic = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { businessLogic } = req.body;
    if (businessLogic === undefined || typeof businessLogic !== 'string') {
      return res.status(400).json({ error: 'businessLogic string is required' });
    }

    const project = await projectService.updateBusinessLogic(id, businessLogic);
    res.json(project);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateProjectSettings = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { githubRepo, settings, businessLogic } = req.body;

    const project = await projectService.updateProjectSettings(id, {
      githubRepo,
      settings,
      businessLogic,
    });
    res.json(project);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await projectService.deleteProject(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// PROJECT LINKS CONTROLLER
// ==========================================

export const createProjectLink = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { title, url } = req.body;
    const link = await projectService.createLink(projectId, { title, url });
    res.status(201).json(link);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return res.status(404).json({ error: 'Project not found' });
    res.status(500).json({ error: error.message });
  }
};

export const updateProjectLink = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { title, url } = req.body;
    const link = await projectService.updateLink(id, { title, url });
    res.json(link);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return res.status(404).json({ error: 'Link not found' });
    res.status(500).json({ error: error.message });
  }
};

export const deleteProjectLink = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await projectService.deleteLink(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// KANBANS CONTROLLER
// ==========================================

export const listKanbansByProject = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const kanbans = await kanbanService.listKanbansByProject(projectId);
    res.json(kanbans);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const createKanban = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { title } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const kanban = await kanbanService.createKanban({
      projectId,
      title,
    });
    res.status(201).json(kanban);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && (error.code === 'P2003' || error.code === 'P2025'))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getKanbanById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const kanban = await kanbanService.getKanbanById(id);
    if (!kanban) {
      return res.status(404).json({ error: 'Kanban not found' });
    }
    res.json(kanban);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateKanban = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { title, order } = req.body;

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const kanban = await kanbanService.updateKanban(id, {
      title,
      order,
    });
    res.json(kanban);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Kanban not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteKanban = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await kanbanService.deleteKanban(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Kanban not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// NOTES CONTROLLER
// ==========================================

export const listNotesByProject = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const notes = await noteService.listNotesByProject(projectId);
    res.json(notes);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { title, content } = req.body;
    const note = await noteService.createNote(projectId, title, content);
    res.status(201).json(note);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getNoteById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const note = await noteService.getNoteById(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { title, content, order } = req.body;
    const note = await noteService.updateNote(id, { title, content, order });
    res.json(note);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await noteService.deleteNote(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// UPDATE LOGS CONTROLLER
// ==========================================

export const listLogsByProject = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const logs = await updateLogService.listLogsByProject(projectId, limit);
    res.json(logs);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const createLog = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { title, content, author } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const log = await updateLogService.createLog({
      projectId,
      title,
      content,
      author,
    });
    res.status(201).json(log);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && (error.code === 'P2003' || error.code === 'P2025'))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getLogById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const log = await updateLogService.getLogById(id);
    if (!log) {
      return res.status(404).json({ error: 'UpdateLog not found' });
    }
    res.json(log);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteLog = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await updateLogService.deleteLog(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'UpdateLog not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// MEMBERS CONTROLLER
// ==========================================

export const listMembersByProject = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const members = await memberService.listMembersByProject(projectId);
    res.json(members);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const createMember = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { name, role, email } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!role || typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const member = await memberService.createMember({
      projectId,
      name,
      role,
      email,
    });
    res.status(201).json(member);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && (error.code === 'P2003' || error.code === 'P2025'))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getMemberById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const member = await memberService.getMemberById(id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateMember = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, role, email } = req.body;

    const member = await memberService.updateMember(id, {
      name,
      role,
      email,
    });
    res.json(member);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await memberService.deleteMember(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// TASKS CONTROLLER
// ==========================================

export const listTasks = async (req: Request, res: Response) => {
  try {
    const { status, isSprintActive, hasDueDate, projectId, columnId } = req.query;
    const kanbanId = req.query.kanbanId ? String(req.query.kanbanId).trim() : undefined;
    const projId = projectId ? String(projectId).trim() : undefined;
    const statusStr = status ? String(status) : undefined;
    const colId = columnId ? String(columnId) : undefined;

    const tasks = await taskService.listTasks({
      kanbanId,
      projectId: projId,
      status: statusStr,
      columnId: colId,
      isSprintActive: isSprintActive !== undefined ? isSprintActive === 'true' : undefined,
      hasDueDate: hasDueDate !== undefined ? hasDueDate === 'true' : undefined,
    });
    res.json(tasks);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const listTasksByKanban = async (req: Request, res: Response) => {
  try {
    const kanbanId = String(req.params.kanbanId);
    const tasks = await taskService.listTasks({ kanbanId });
    res.json(tasks);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const task = await taskService.getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const kanbanIdFromParams = req.params?.kanbanId;
    const { title, kanbanId: kanbanIdFromBody, description, status, columnId, tagIds, dueDate, isSprintActive } = req.body;
    const rawKanbanId = kanbanIdFromParams || kanbanIdFromBody;
    const kanbanId = rawKanbanId ? String(rawKanbanId).trim() : '';

    if (!kanbanId) {
      return res.status(400).json({ error: 'kanbanId is required' });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await taskService.createTask({
      kanbanId,
      title: title.trim(),
      description: description ? String(description).trim() : null,
      status,
      columnId,
      tagIds,
      dueDate,
      isSprintActive,
    });
    res.status(201).json(task);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && (error.code === 'P2003' || error.code === 'P2025'))) {
      return res.status(404).json({ error: 'Kanban not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status, columnId, tagIds, title, description, kanbanId, dueDate, isSprintActive } = req.body;

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const task = await taskService.updateTask(id, {
      status,
      columnId,
      tagIds,
      title,
      description,
      kanbanId,
      dueDate,
      isSprintActive,
    });
    res.json(task);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status, columnId } = req.body;
    if (status === undefined && columnId === undefined) {
      return res.status(400).json({ error: 'Status or columnId is required' });
    }
    const task = await taskService.updateTask(id, { status, columnId });
    res.json(task);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await taskService.deleteTask(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// SUBTASKS CONTROLLER
// ==========================================

export const createSubtask = async (req: Request, res: Response) => {
  try {
    const taskId = String(req.params.id);
    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const subtask = await subtaskService.createSubtask(taskId, title);
    res.status(201).json(subtask);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && (error.code === 'P2003' || error.code === 'P2025'))) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const toggleSubtask = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const isDone = typeof req.body.isDone === 'boolean' ? req.body.isDone : undefined;
    const subtask = await subtaskService.toggleSubtask(id, isDone);
    res.json(subtask);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteSubtask = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await subtaskService.deleteSubtask(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof NotFoundError || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// WHITEBOARDS CONTROLLER
// ==========================================

export const listWhiteboardsByProject = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const items = await whiteboardService.listWhiteboardsByProject(projectId);
    res.json(items);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const getWhiteboardById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const item = await whiteboardService.getWhiteboardById(id);
    if (!item) return res.status(404).json({ error: 'Whiteboard not found' });
    res.json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const createWhiteboard = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { title, data } = req.body;
    const item = await whiteboardService.createWhiteboard(projectId, title, data);
    res.status(201).json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updateWhiteboard = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const item = await whiteboardService.updateWhiteboard(id, req.body);
    res.json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError || (error && error.code === 'P2025')) return res.status(404).json({ error: 'Whiteboard not found' });
    res.status(500).json({ error: error.message });
  }
};

export const deleteWhiteboard = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await whiteboardService.deleteWhiteboard(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError || (error && error.code === 'P2025')) return res.status(404).json({ error: 'Whiteboard not found' });
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// CHECKLISTS CONTROLLER
// ==========================================

export const listChecklistsByProject = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const items = await checklistService.listChecklistsByProject(projectId);
    res.json(items);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const getChecklistById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const item = await checklistService.getChecklistById(id);
    if (!item) return res.status(404).json({ error: 'Checklist not found' });
    res.json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const createChecklist = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const { title } = req.body;
    const item = await checklistService.createChecklist(projectId, title);
    res.status(201).json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updateChecklist = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const item = await checklistService.updateChecklist(id, req.body);
    res.json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError || (error && error.code === 'P2025')) return res.status(404).json({ error: 'Checklist not found' });
    res.status(500).json({ error: error.message });
  }
};

export const deleteChecklist = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await checklistService.deleteChecklist(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError || (error && error.code === 'P2025')) return res.status(404).json({ error: 'Checklist not found' });
    res.status(500).json({ error: error.message });
  }
};

export const addChecklistItem = async (req: Request, res: Response) => {
  try {
    const checklistId = String(req.params.id);
    const { text } = req.body;
    const item = await checklistService.addItem(checklistId, text);
    res.status(201).json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updateChecklistItem = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const item = await checklistService.updateItem(id, req.body);
    res.json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError || (error && error.code === 'P2025')) return res.status(404).json({ error: 'Checklist item not found' });
    res.status(500).json({ error: error.message });
  }
};

export const toggleChecklistItem = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { isDone } = req.body;
    const item = await checklistService.toggleItem(id, isDone);
    res.json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError || (error && error.code === 'P2025')) return res.status(404).json({ error: 'Checklist item not found' });
    res.status(500).json({ error: error.message });
  }
};

export const deleteChecklistItem = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await checklistService.deleteItem(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError || (error && error.code === 'P2025')) return res.status(404).json({ error: 'Checklist item not found' });
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// BOOKMARKS CONTROLLER
// ==========================================

export const listBookmarksByProject = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const items = await bookmarkService.listBookmarksByProject(projectId);
    res.json(items);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const getBookmarkById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const item = await bookmarkService.getBookmarkById(id);
    if (!item) return res.status(404).json({ error: 'Bookmark not found' });
    res.json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const createBookmark = async (req: Request, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const item = await bookmarkService.createBookmark(projectId, req.body);
    res.status(201).json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updateBookmark = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const item = await bookmarkService.updateBookmark(id, req.body);
    res.json(item);
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError || (error && error.code === 'P2025')) return res.status(404).json({ error: 'Bookmark not found' });
    res.status(500).json({ error: error.message });
  }
};

export const deleteBookmark = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await bookmarkService.deleteBookmark(id);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof NotFoundError || (error && error.code === 'P2025')) return res.status(404).json({ error: 'Bookmark not found' });
    res.status(500).json({ error: error.message });
  }
};
