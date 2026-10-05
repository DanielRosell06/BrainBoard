// ============================================================
// BrainBoard V2 — Domain Types
// ============================================================

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type StageStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskStatus = string;
export type ProjectType = 'SOFTWARE';
export type ActiveView = 'PROJECTS' | 'PROJECT_OVERVIEW' | 'BOARD' | 'NOTE' | 'CALENDAR' | 'CHAT' | 'WHITEBOARD' | 'CHECKLIST';

// ---- Kanban Column & Tag -----------------------------------
export interface KanbanColumn {
  id: string;
  title: string;
  order: number;
  kanbanId: string;
}

export interface KanbanTag {
  id: string;
  name: string;
  kanbanId: string;
}

// ---- Subtask -----------------------------------------------
export interface Subtask {
  id: string;
  title: string;
  isDone: boolean;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Task --------------------------------------------------
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  kanbanId: string;
  columnId: string | null;
  column?: KanbanColumn | null;
  tags?: KanbanTag[];
  dueDate?: string | null;
  subtasks: Subtask[];
  kanban?: Kanban;
  createdAt: string;
  updatedAt: string;
}

// ---- Kanban (Board) -------------------------------------
export interface Kanban {
  id: string;
  title: string;
  projectId: string;
  order: number;
  tasks: Task[];
  columns: KanbanColumn[];
  tags: KanbanTag[];
  createdAt: string;
  updatedAt: string;
}

// ---- Note --------------------------------------------------
export interface Note {
  id: string;
  title: string;
  content: string;
  projectId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Member ------------------------------------------------
export interface Member {
  id: string;
  name: string;
  role: string;
  email: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// ---- UpdateLog ---------------------------------------------
export interface UpdateLog {
  id: string;
  title: string;
  content: string;
  author: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLink {
  id: string;
  title: string;
  url: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Project (full — with relations) -----------------------
export interface Project {
  id: string;
  title: string;
  description: string | null;
  businessLogic: string | null;
  status: ProjectStatus;
  type?: ProjectType;
  githubRepo: string | null;
  settings: Record<string, unknown> | null;
  order: number;
  isFavorite: boolean;
  whiteboards: Whiteboard[];
  checklists: Checklist[];
  bookmarks: Bookmark[];
  kanbans: Kanban[];
  notes: Note[];
  updateLogs: UpdateLog[];
  members: Member[];
  links: ProjectLink[];
  createdAt: string;
  updatedAt: string;
}

// ---- Project (list item — without heavy relations) ---------
export interface ProjectSummary {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  type?: ProjectType;
  githubRepo: string | null;
  order: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  kanbans?: Kanban[];
  notes?: Note[];
  checklists?: Checklist[];
  whiteboards?: Whiteboard[];
  _count?: {
    kanbans: number;
    notes: number;
    members: number;
    updateLogs: number;
    links: number;
  };
}

// ---- Whiteboard -----------------------------------------------
export interface Whiteboard {
  id: string;
  title: string;
  data: Record<string, unknown>;
  projectId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Checklist -----------------------------------------------
export interface ChecklistItem {
  id: string;
  text: string;
  isDone: boolean;
  order: number;
  checklistId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  title: string;
  projectId: string;
  items: ChecklistItem[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Bookmark -----------------------------------------------
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string | null;
  group: string | null;
  projectId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Input types -------------------------------------------
export interface CreateWhiteboardInput { title: string; data?: Record<string, unknown>; }
export interface CreateChecklistInput { title: string; }
export interface CreateBookmarkInput { title: string; url: string; description?: string; group?: string; }

export interface CreateProjectInput {
  title: string;
  description?: string;
  businessLogic?: string;
  status?: ProjectStatus;
  type?: ProjectType;
  githubRepo?: string;
  settings?: Record<string, unknown>;
  isFavorite?: boolean;
}

// DRY: todos os campos de criação são opcionais na atualização
export type UpdateProjectInput = Partial<CreateProjectInput> & { order?: number };

export interface CreateKanbanInput {
  title: string;
}

export type UpdateKanbanInput = Partial<CreateKanbanInput> & { order?: number };

export interface CreateNoteInput {
  title: string;
  content?: string;
}
export type UpdateNoteInput = Partial<CreateNoteInput> & { order?: number };

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  columnId?: string;
  tagIds?: string[];
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  columnId?: string | null;
  tagIds?: string[];
  kanbanId?: string;
  dueDate?: string | null;
}

export interface UpdateTaskStatusInput {
  status?: TaskStatus;
  columnId?: string | null;
}

export interface CreateMemberInput {
  name: string;
  role: string;
  email?: string;
}

export interface CreateUpdateLogInput {
  title: string;
  content: string;
  author?: string;
}

// ---- Appointment Domain Types -----------------------------
export interface Appointment {
  id: string;
  title: string;
  description: string | null;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  locationOrLink: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  title: string;
  startTime: string;
  endTime: string;
  description?: string | null;
  locationOrLink?: string | null;
}

export interface UpdateAppointmentInput {
  title?: string;
  startTime?: string;
  endTime?: string;
  description?: string | null;
  locationOrLink?: string | null;
  isCompleted?: boolean;
}

// ---- Unified Calendar Event Projection --------------------
export interface CalendarEventProjection {
  id: string;
  sourceId: string;
  sourceType: 'APPOINTMENT' | 'TASK_DEADLINE';
  title: string;
  description: string | null;
  start: string; // ISO string
  end: string;   // ISO string
  locationOrLink?: string | null;
  isCompleted: boolean;
  color: string;
  projectTitle?: string;
  stageTitle?: string;
  projectType?: string;
  status?: string;
}


// ---- UI helpers --------------------------------------------
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planejamento',
  ACTIVE: 'Em Andamento',
  COMPLETED: 'Concluído',
  ARCHIVED: 'Arquivado',
};

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Andamento',
  DONE: 'Concluído',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNING: 'bg-amber-100 text-amber-700 border-amber-200',
  ACTIVE: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ARCHIVED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const STAGE_STATUS_COLORS: Record<StageStatus, string> = {
  PLANNING: 'bg-slate-100 text-slate-600 border-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

// ---- Chat Types --------------------------------------------
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  conversationId: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}
