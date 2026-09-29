import type {
  Project,
  Kanban,
  KanbanColumn,
  KanbanTag,
  Note,
  UpdateLog,
  Member,
  Task,
  Subtask,
  ProjectStatus,
  ProjectType,
} from '@prisma/client';

export type {
  Project,
  Kanban,
  KanbanColumn,
  KanbanTag,
  Note,
  UpdateLog,
  Member,
  Task,
  Subtask,
  ProjectStatus,
  ProjectType,
};

export interface CreateProjectInput {
  title: string;
  description?: string | null | undefined;
  businessLogic?: string | null | undefined;
  status?: string | undefined;
  type?: ProjectType | string | undefined;
  githubRepo?: string | null | undefined;
  settings?: any | undefined;
}

export interface UpdateProjectInput {
  title?: string | undefined;
  description?: string | null | undefined;
  businessLogic?: string | null | undefined;
  status?: string | undefined;
  type?: ProjectType | string | undefined;
  githubRepo?: string | null | undefined;
  settings?: any | undefined;
}

export interface ProjectFilterOptions {
  status?: string | undefined;
  type?: ProjectType | string | undefined;
}

export type ProjectWithDetails = Project & {
  kanbans: (Kanban & { tasks: (Task & { subtasks: Subtask[] })[] })[];
  notes: Note[];
  updateLogs: UpdateLog[];
  members: Member[];
};

export interface CreateKanbanInput {
  projectId: string;
  title: string;
}

export interface UpdateKanbanInput {
  title?: string | undefined;
}

export type KanbanWithTasks = Kanban & {
  tasks: (Task & { subtasks: Subtask[]; tags: KanbanTag[] })[];
  columns: KanbanColumn[];
  tags: KanbanTag[];
};

export interface CreateTaskInput {
  kanbanId: string;
  title: string;
  description?: string | null | undefined;
  status?: string | undefined;
  columnId?: string | undefined;
  tagIds?: string[] | undefined;
  dueDate?: Date | string | null | undefined;
  isSprintActive?: boolean | undefined;
}

export interface UpdateTaskInput {
  kanbanId?: string | undefined;
  title?: string | undefined;
  description?: string | null | undefined;
  status?: string | undefined;
  columnId?: string | null | undefined;
  tagIds?: string[] | undefined;
  dueDate?: Date | string | null | undefined;
  isSprintActive?: boolean | undefined;
}

export interface TaskFilterOptions {
  kanbanId?: string | undefined;
  projectId?: string | undefined;
  status?: string | undefined;
  columnId?: string | undefined;
  isSprintActive?: boolean | undefined;
  hasDueDate?: boolean | undefined;
}

export type TaskWithSubtasks = Task & {
  subtasks: Subtask[];
  kanban?: Kanban;
  column?: KanbanColumn | null;
  tags?: KanbanTag[];
};

export interface CreateMemberInput {
  projectId: string;
  name: string;
  role: string;
  email?: string | null | undefined;
}

export interface UpdateMemberInput {
  name?: string | undefined;
  role?: string | undefined;
  email?: string | null | undefined;
}

export interface CreateLogInput {
  projectId: string;
  title: string;
  content: string;
  author?: string | undefined;
}

export interface LogFilterOptions {
  projectId?: string | undefined;
}
