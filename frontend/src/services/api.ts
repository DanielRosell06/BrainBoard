import type {
  Project,
  ProjectSummary,
  Task,
  Subtask,
  Member,
  UpdateLog,
  CreateProjectInput,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateMemberInput,
  CreateUpdateLogInput,
  TaskStatus,
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  CalendarEventProjection,
  Whiteboard,
  Checklist,
  ChecklistItem,
  Bookmark,
  CreateBookmarkInput,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn('[api] VITE_API_URL não definida em produção. Usando URL relativa.');
}

// ---- Custom error class ------------------------------------
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---- Generic fetch helper with timeout ---------------------
async function request<T>(path: string, options?: RequestInit, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let message: string;
      try { message = JSON.parse(body)?.error ?? body; } catch { message = body || res.statusText; }
      throw new ApiError(res.status, message);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// Projects API
// ============================================================
export const projectsApi = {
  list(): Promise<ProjectSummary[]> {
    return request('/api/projects');
  },

  get(id: string): Promise<Project> {
    return request(`/api/projects/${id}`);
  },

  create(input: CreateProjectInput): Promise<Project> {
    return request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: UpdateProjectInput): Promise<Project> {
    return request(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  updateBusinessLogic(id: string, businessLogic: string): Promise<Project> {
    return request(`/api/projects/${id}/business-logic`, {
      method: 'PATCH',
      body: JSON.stringify({ businessLogic }),
    });
  },

  updateSettings(
    id: string,
    settings: { githubRepo?: string; settings?: Record<string, unknown> }
  ): Promise<Project> {
    return request(`/api/projects/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },

  delete(id: string): Promise<void> {
    return request(`/api/projects/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// Kanbans API
// ============================================================
export const kanbansApi = {
  list(projectId: string): Promise<import('../types').Kanban[]> {
    return request(`/api/projects/${projectId}/kanbans`);
  },

  create(projectId: string, input: import('../types').CreateKanbanInput): Promise<import('../types').Kanban> {
    return request(`/api/projects/${projectId}/kanbans`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(
    projectId: string,
    kanbanId: string,
    input: Partial<import('../types').CreateKanbanInput> & { order?: number }
  ): Promise<import('../types').Kanban> {
    return request(`/api/projects/${projectId}/kanbans/${kanbanId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  delete(projectId: string, kanbanId: string): Promise<void> {
    return request(`/api/projects/${projectId}/kanbans/${kanbanId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// Kanban Customization API
// ============================================================
export const kanbanColumnsApi = {
  create(kanbanId: string, input: { title: string; order?: number }): Promise<import('../types').KanbanColumn> {
    return request(`/api/kanbans/${kanbanId}/columns`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  update(columnId: string, input: { title?: string; order?: number }): Promise<import('../types').KanbanColumn> {
    return request(`/api/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  delete(columnId: string): Promise<void> {
    return request(`/api/columns/${columnId}`, {
      method: 'DELETE',
    });
  },
};

export const kanbanTagsApi = {
  create(kanbanId: string, input: { name: string; color?: string }): Promise<import('../types').KanbanTag> {
    return request(`/api/kanbans/${kanbanId}/tags`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  update(tagId: string, input: { name?: string; color?: string }): Promise<import('../types').KanbanTag> {
    return request(`/api/tags/${tagId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  delete(tagId: string): Promise<void> {
    return request(`/api/tags/${tagId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// Notes API
// ============================================================
export const notesApi = {
  list(projectId: string): Promise<import('../types').Note[]> {
    return request(`/api/projects/${projectId}/notes`);
  },

  create(projectId: string, input: { title: string; content: string }): Promise<import('../types').Note> {
    return request(`/api/projects/${projectId}/notes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(
    _projectId: string,
    noteId: string,
    input: { title?: string; content?: string; order?: number }
  ): Promise<import('../types').Note> {
    return request(`/api/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  delete(_projectId: string, noteId: string): Promise<void> {
    return request(`/api/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// Tasks API
// ============================================================
export const tasksApi = {
  list(kanbanId: string): Promise<Task[]> {
    return request(`/api/kanbans/${kanbanId}/tasks`);
  },

  listAll(filters?: {
    status?: TaskStatus;
    hasDueDate?: boolean;
    kanbanId?: string;
    projectId?: string;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.hasDueDate !== undefined) params.set('hasDueDate', String(filters.hasDueDate));
    if (filters?.kanbanId) params.set('kanbanId', filters.kanbanId);
    if (filters?.projectId) params.set('projectId', filters.projectId);
    const qs = params.toString();
    return request(`/api/tasks${qs ? `?${qs}` : ''}`);
  },

  create(kanbanId: string, input: CreateTaskInput): Promise<Task> {
    return request(`/api/kanbans/${kanbanId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: UpdateTaskInput): Promise<Task> {
    return request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  updateStatus(id: string, status?: string, columnId?: string | null): Promise<Task> {
    return request(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, columnId }),
    });
  },


  delete(id: string): Promise<void> {
    return request(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  addSubtask(taskId: string, title: string): Promise<Subtask> {
    return request<Subtask>(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  toggleSubtask(subtaskId: string, isDone: boolean): Promise<Subtask> {
    return request<Subtask>(`/api/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isDone }),
    });
  },

  deleteSubtask(subtaskId: string): Promise<void> {
    return request(`/api/subtasks/${subtaskId}`, { method: 'DELETE' });
  },
};



// ============================================================
// Members API
// ============================================================
export const membersApi = {
  list(projectId: string): Promise<Member[]> {
    return request(`/api/projects/${projectId}/members`);
  },

  create(projectId: string, input: CreateMemberInput): Promise<Member> {
    return request(`/api/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  delete(projectId: string, memberId: string): Promise<void> {
    return request(`/api/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// Update Logs API
// ============================================================
export const updateLogsApi = {
  list(projectId: string): Promise<UpdateLog[]> {
    return request(`/api/projects/${projectId}/update-logs`);
  },

  create(projectId: string, input: CreateUpdateLogInput): Promise<UpdateLog> {
    return request(`/api/projects/${projectId}/update-logs`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  delete(projectId: string, logId: string): Promise<void> {
    return request(`/api/projects/${projectId}/update-logs/${logId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// Appointments API
// ============================================================
export const appointmentsApi = {
  list(filters?: { startDate?: string; endDate?: string; isCompleted?: boolean }): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.isCompleted !== undefined) params.set('isCompleted', String(filters.isCompleted));
    const qs = params.toString();
    return request(`/api/appointments${qs ? `?${qs}` : ''}`);
  },

  get(id: string): Promise<Appointment> {
    return request(`/api/appointments/${id}`);
  },

  create(input: CreateAppointmentInput): Promise<Appointment> {
    return request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: UpdateAppointmentInput): Promise<Appointment> {
    return request(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  toggleCompleted(id: string, isCompleted: boolean): Promise<Appointment> {
    return request(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
    });
  },

  delete(id: string): Promise<void> {
    return request(`/api/appointments/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// Calendar API
// ============================================================
export const calendarApi = {
  getEvents(filters?: {
    startDate?: string;
    endDate?: string;
    includeCompleted?: boolean;
    projectId?: string;
  }): Promise<CalendarEventProjection[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.includeCompleted !== undefined) params.set('includeCompleted', String(filters.includeCompleted));
    if (filters?.projectId) params.set('projectId', filters.projectId);
    const qs = params.toString();
    return request(`/api/calendar/events${qs ? `?${qs}` : ''}`);
  },
};



// ============================================================
// Whiteboards API
// ============================================================
export const whiteboardsApi = {
  list(projectId: string): Promise<Whiteboard[]> { return request(`/api/projects/${projectId}/whiteboards`); },
  create(projectId: string, input: { title: string; data?: Record<string, unknown> }): Promise<Whiteboard> { return request(`/api/projects/${projectId}/whiteboards`, { method: 'POST', body: JSON.stringify(input) }); },
  update(_projectId: string, id: string, input: { title?: string; data?: Record<string, unknown>; order?: number }): Promise<Whiteboard> { return request(`/api/whiteboards/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); },
  delete(_projectId: string, id: string): Promise<void> { return request(`/api/whiteboards/${id}`, { method: 'DELETE' }); },
};

// ============================================================
// Checklists API
// ============================================================
export const checklistsApi = {
  list(projectId: string): Promise<Checklist[]> { return request(`/api/projects/${projectId}/checklists`); },
  get(id: string): Promise<Checklist> { return request(`/api/checklists/${id}`); },
  create(projectId: string, input: { title: string }): Promise<Checklist> { return request(`/api/projects/${projectId}/checklists`, { method: 'POST', body: JSON.stringify(input) }); },
  update(id: string, input: { title?: string; order?: number }): Promise<Checklist> { return request(`/api/checklists/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); },
  delete(id: string): Promise<void> { return request(`/api/checklists/${id}`, { method: 'DELETE' }); },
  addItem(checklistId: string, text: string): Promise<ChecklistItem> { return request(`/api/checklists/${checklistId}/items`, { method: 'POST', body: JSON.stringify({ text }) }); },
  toggleItem(itemId: string, isDone: boolean): Promise<ChecklistItem> { return request(`/api/checklist-items/${itemId}/toggle`, { method: 'PATCH', body: JSON.stringify({ isDone }) }); },
  updateItem(itemId: string, input: { text?: string; order?: number }): Promise<ChecklistItem> { return request(`/api/checklist-items/${itemId}`, { method: 'PATCH', body: JSON.stringify(input) }); },
  deleteItem(itemId: string): Promise<void> { return request(`/api/checklist-items/${itemId}`, { method: 'DELETE' }); },
};

// ============================================================
// Bookmarks API
// ============================================================
export const bookmarksApi = {
  list(projectId: string): Promise<Bookmark[]> { return request(`/api/projects/${projectId}/bookmarks`); },
  create(projectId: string, input: CreateBookmarkInput): Promise<Bookmark> { return request(`/api/projects/${projectId}/bookmarks`, { method: 'POST', body: JSON.stringify(input) }); },
  update(id: string, input: Partial<CreateBookmarkInput> & { order?: number }): Promise<Bookmark> { return request(`/api/bookmarks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); },
  delete(id: string): Promise<void> { return request(`/api/bookmarks/${id}`, { method: 'DELETE' }); },
};

// ============================================================
// Chat API
// ============================================================
export const chatApi = {
  listConversations(): Promise<import('../types').ChatConversation[]> {
    return request('/api/chat/conversations');
  },
  createConversation(title?: string): Promise<import('../types').ChatConversation> {
    return request('/api/chat/conversations', { method: 'POST', body: JSON.stringify({ title }) });
  },
  getConversation(id: string): Promise<import('../types').ChatConversation> {
    return request(`/api/chat/conversations/${id}`);
  },
  deleteConversation(id: string): Promise<void> {
    return request(`/api/chat/conversations/${id}`, { method: 'DELETE' });
  },
  sendMessage(conversationId: string, content: string): Promise<import('../types').ChatMessage> {
    return request(`/api/chat/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
  },
  async sendMessageStream(
    conversationId: string,
    content: string,
    onChunk: (text: string) => void,
    onTitle?: (title: string) => void
  ): Promise<import('../types').ChatMessage> {
    const res = await fetch(`${BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Erro ao enviar mensagem');
    }

    if (!res.body) {
      throw new Error('No readable stream');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalMessage: any = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // last incomplete line

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (currentEvent === 'chunk') {
              onChunk(data);
            } else if (currentEvent === 'title' && onTitle) {
              onTitle(data);
            } else if (currentEvent === 'done') {
              finalMessage = data;
            }
          } catch (e) {
            console.error('Failed to parse SSE data', e);
          }
        }
      }
    }

    return finalMessage || { role: 'assistant', content: 'Erro ao obter resposta.', id: Date.now().toString(), conversationId, createdAt: new Date().toISOString() };
  },
};
