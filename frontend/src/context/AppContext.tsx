import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectsApi, kanbansApi, notesApi, tasksApi, calendarApi } from '../services/api';
import { useToast } from './ToastContext';
import type {
  Project,
  ProjectSummary,
  Task,
  Subtask,
  CreateProjectInput,
  CreateTaskInput,
  Note,
} from '../types';

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AppContextValue {
  // Data
  projects: ProjectSummary[];
  activeProject: Project | null;
  activeProjectId: string | null;
  activeKanbanId: string | null;
  activeNoteId: string | null;
  activeWhiteboardId: string | null;
  activeChecklistId: string | null;
  activeChatId: string | null;
  calendarCount: number;
  searchQuery: string;

  // Loading / Connection
  loading: boolean;
  loadingProject: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  error: string | null;

  // Modal open state
  isCreateTaskModalOpen: boolean;
  isCreateProjectModalOpen: boolean;
  isCreateKanbanModalOpen: boolean;
  isCreateNoteModalOpen: boolean;
  isCreateAppointmentModalOpen: boolean;
  createTaskDefaultStageId: string | undefined;

  // Setters / Actions
  setProjects: React.Dispatch<React.SetStateAction<ProjectSummary[]>>;
  setActiveProject: React.Dispatch<React.SetStateAction<Project | null>>;
  setSearchQuery: (q: string) => void;
  setActiveKanbanId: (id: string | null) => void;
  setActiveNoteId: (id: string | null) => void;
  setActiveWhiteboardId: (id: string | null) => void;
  setActiveChecklistId: (id: string | null) => void;
  setActiveChatId: (id: string | null) => void;

  setIsCreateTaskModalOpen: (v: boolean) => void;
  setIsCreateProjectModalOpen: (v: boolean) => void;
  setIsCreateKanbanModalOpen: (v: boolean) => void;
  setIsCreateNoteModalOpen: (v: boolean) => void;
  setIsCreateAppointmentModalOpen: (v: boolean) => void;
  setCreateTaskDefaultStageId: (id: string | undefined) => void;

  // Data handlers
  loadProjects: (silent?: boolean) => Promise<ProjectSummary[]>;
  loadActiveProject: (id: string, silent?: boolean) => Promise<Project | null>;
  syncAll: (silent?: boolean) => Promise<void>;

  handleSelectProject: (id: string | null) => void;
  handleCreateProject: (input: CreateProjectInput) => Promise<void>;
  handleCreateKanban: (projectId: string, input: { title: string }) => Promise<void>;
  handleCreateNote: (projectId: string, input: { title: string; content?: string }) => Promise<void>;
  handleNoteUpdated: (updatedNote: Note) => void;
  handleCreateTask: (kanbanId: string, input: CreateTaskInput, initialSubtasks?: string[]) => Promise<void>;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  handleMoveTask: (id: string, newStatus: string, columnId?: string | null, destinationIndex?: number) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
  handleAddSubtask: (taskId: string, title: string) => Promise<void>;
  handleToggleSubtask: (id: string, isDone: boolean) => Promise<void>;
  handleDeleteSubtask: (id: string) => Promise<void>;
  handleOpenCreateTask: (stageId?: string) => void;
  handleDeleteProject: (id: string, title: string) => Promise<void>;
  handleToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  handleArchiveProject: (id: string, title: string) => Promise<void>;

  // Derived
  displayedTasks: Task[];
}

// ─── Context & hook ───────────────────────────────────────────────────────────

export const AppContext = createContext<AppContextValue | null>(null);

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeKanbanId, setActiveKanbanId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeWhiteboardId, setActiveWhiteboardId] = useState<string | null>(null);
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProject, setLoadingProject] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [calendarCount, setCalendarCount] = useState<number>(0);

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateKanbanModalOpen, setIsCreateKanbanModalOpen] = useState(false);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false);
  const [createTaskDefaultStageId, setCreateTaskDefaultStageId] = useState<string | undefined>(undefined);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // ── Data loaders ────────────────────────────────────────────────────────────

  const loadProjects = useCallback(async (silent = false): Promise<ProjectSummary[]> => {
    try {
      if (!silent) setError(null);
      const data = await projectsApi.list();
      setProjects(data);
      setIsConnected(true);
      return data;
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      if (!silent) {
        setError('Não foi possível conectar ao servidor backend. Verifique se o serviço está ativo.');
      }
      setIsConnected(false);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadActiveProject = useCallback(async (id: string, silent = false): Promise<Project | null> => {
    if (!silent) setLoadingProject(true);
    try {
      if (!silent) setError(null);
      const data = await projectsApi.get(id);
      setActiveProject(data);
      setIsConnected(true);
      return data;
    } catch (err: any) {
      console.error(`Failed to load project ${id}:`, err);
      if (!silent) {
        setError('Não foi possível carregar os detalhes do projeto selecionado.');
      }
      return null;
    } finally {
      if (!silent) setLoadingProject(false);
    }
  }, []);

  const syncAll = useCallback(async (silent = true) => {
    if (!silent) setIsSyncing(true);
    try {
      const currentList = await loadProjects(silent);
      if (activeProjectId) {
        await loadActiveProject(activeProjectId, silent);
      } else if (currentList && currentList.length > 0) {
        setActiveProjectId(currentList[0].id);
        await loadActiveProject(currentList[0].id, silent);
      }
      try {
        const eventsList = await calendarApi.getEvents({ includeCompleted: false }).catch(() => []);
        setCalendarCount(eventsList.length);
      } catch (e) {
        // Non-blocking
      }
      setIsConnected(true);
    } catch (err) {
      console.error('Auto-sync error:', err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [loadProjects, loadActiveProject, activeProjectId]);

  // ── Initial load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    loadProjects(false).then((data) => {
      if (data && data.length > 0 && !activeProjectId) {
        // Don't force-select a project on initial load — let the URL drive it
      }
    });
    calendarApi.getEvents({ includeCompleted: false }).then((e) => setCalendarCount(e.length)).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Background polling ───────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') syncAll(true);
    }, 3500);

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') syncAll(true);
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [syncAll]);

  // ── Sync activeProjectId from URL ────────────────────────────────────────────
  // When user lands on /projects/:id directly, extract id from path and load
  useEffect(() => {
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    if (match) {
      const urlProjectId = match[1];
      if (urlProjectId !== activeProjectId) {
        setActiveProjectId(urlProjectId);
        loadActiveProject(urlProjectId, false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSelectProject = (id: string | null) => {
    if (!id) {
      setActiveProjectId(null);
      setActiveProject(null);
      setActiveKanbanId(null);
      setActiveNoteId(null);
      setActiveWhiteboardId(null);
      setActiveChecklistId(null);
      navigate('/projects');
    } else {
      if (activeProjectId === id && activeProject) {
        navigate(`/projects/${id}`);
        return;
      }
      setActiveProjectId(id);
      loadActiveProject(id).then((proj) => {
        if (proj) navigate(`/projects/${id}`);
      });
    }
  };

  const handleCreateProject = async (input: CreateProjectInput) => {
    const newProject = await projectsApi.create(input);
    await loadProjects();
    setActiveProjectId(newProject.id);
    setActiveProject(newProject);
    // Navigate to the first kanban if available, else project overview
    if (newProject.kanbans && newProject.kanbans.length > 0) {
      setActiveKanbanId(newProject.kanbans[0].id);
      navigate(`/projects/${newProject.id}/kanban/${newProject.kanbans[0].id}`);
    } else {
      navigate(`/projects/${newProject.id}`);
    }
  };

  const handleCreateKanban = async (projectId: string, input: { title: string }) => {
    const newKanban = await kanbansApi.create(projectId, input);
    const completeKanban = { ...newKanban, tasks: newKanban.tasks || [] };
    setActiveProject((prev) => {
      if (!prev) return null;
      return { ...prev, kanbans: [...(prev.kanbans || []), completeKanban] };
    });
    setActiveKanbanId(completeKanban.id);
    navigate(`/projects/${projectId}/kanban/${completeKanban.id}`);
  };

  const handleCreateNote = async (projectId: string, input: { title: string; content?: string }) => {
    const newNote = await notesApi.create(projectId, { title: input.title, content: input.content || '' });
    setActiveProject((prev) => {
      if (!prev) return null;
      return { ...prev, notes: [...(prev.notes || []), newNote] };
    });
    setActiveNoteId(newNote.id);
    navigate(`/projects/${projectId}/notes/${newNote.id}`);
  };

  const handleNoteUpdated = useCallback((updatedNote: Note) => {
    setActiveProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        notes: (prev.notes || []).map((n) => (n.id === updatedNote.id ? updatedNote : n)),
      };
    });
  }, []);

  const handleCreateTask = async (
    kanbanId: string,
    input: CreateTaskInput,
    initialSubtasks?: string[]
  ) => {
    const newTask = await tasksApi.create(kanbanId, input);
    let createdSubtasks: Subtask[] = [];
    if (initialSubtasks && initialSubtasks.length > 0) {
      for (const stTitle of initialSubtasks) {
        if (stTitle.trim()) {
          try {
            const st = await tasksApi.addSubtask(newTask.id, stTitle.trim());
            createdSubtasks.push(st);
          } catch (e) {
            console.error('Failed to create initial subtask:', e);
          }
        }
      }
    }
    const completeTask: Task = {
      ...newTask,
      subtasks: newTask.subtasks && newTask.subtasks.length > 0 ? newTask.subtasks : createdSubtasks,
    };
    setActiveProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        kanbans: (prev.kanbans || []).map((kanban) =>
          kanban.id === kanbanId
            ? { ...kanban, tasks: [...(kanban.tasks || []), completeTask] }
            : kanban
        ),
      };
    });
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!activeProject) return;
    const prevProject = activeProject;

    setActiveProject({
      ...activeProject,
      kanbans: activeProject.kanbans.map((k) => ({
        ...k,
        tasks: k.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      })),
    });

    try {
      const { columnId, column, kanban, subtasks, tags, ...updateData } = updates as any;
      if (tags) updateData.tagIds = tags.map((t: any) => t.id);
      const updatedServerTask = await tasksApi.update(taskId, updateData);
      setActiveProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          kanbans: prev.kanbans.map((k) => ({
            ...k,
            tasks: k.tasks.map((t) => (t.id === taskId ? { ...t, ...updatedServerTask } : t)),
          })),
        };
      });
    } catch (err) {
      console.error('Failed to update task:', err);
      setActiveProject(prevProject);
    }
  };

  const handleMoveTask = async (id: string, newStatus: string, columnId?: string | null, destinationIndex?: number) => {
    if (!activeProject) return;
    const prevProject = activeProject;

    setActiveProject({
      ...activeProject,
      kanbans: activeProject.kanbans.map((kanban) => {
        // If we are moving within the same kanban, we should reorder tasks
        const taskToMove = kanban.tasks.find(t => t.id === id);
        if (!taskToMove) return kanban;

        let newTasks = [...kanban.tasks];
        
        // Remove task from its original position
        newTasks = newTasks.filter(t => t.id !== id);

        // Update task properties
        const updatedTask = { ...taskToMove, status: newStatus, columnId: columnId || null };

        // Insert at the new position if specified
        if (destinationIndex !== undefined && columnId) {
          // Find all tasks that are currently in the destination column
          const colTasks = newTasks.filter(t => t.columnId === columnId || (t.columnId == null && kanban.columns[0]?.id === columnId));
          
          // Insert it into the specific index of the column
          colTasks.splice(destinationIndex, 0, updatedTask);
          
          // Now we need to merge this back into the main tasks array
          // Since the order in the main array dictates the visual order for this column,
          // we can just put all the destination column tasks at the end or replace them
          newTasks = newTasks.filter(t => t.columnId !== columnId && !(t.columnId == null && kanban.columns[0]?.id === columnId));
          newTasks.push(...colTasks);
        } else {
          // Otherwise just append
          newTasks.push(updatedTask);
        }

        return { ...kanban, tasks: newTasks };
      }),
    });

    try {
      await tasksApi.updateStatus(id, newStatus, columnId || null);
    } catch (err) {
      console.error('Failed to update task status:', err);
      setActiveProject(prevProject);
      toast('Erro ao atualizar status da tarefa.', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!activeProject) return;
    const prevProject = activeProject;

    setActiveProject({
      ...activeProject,
      kanbans: activeProject.kanbans.map((kanban) => ({
        ...kanban,
        tasks: kanban.tasks.filter((t) => t.id !== id),
      })),
    });

    try {
      await tasksApi.delete(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setActiveProject(prevProject);
      toast('Erro ao excluir tarefa.', 'error');
    }
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    const newSubtask = await tasksApi.addSubtask(taskId, title);
    setActiveProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        kanbans: prev.kanbans.map((kanban) => ({
          ...kanban,
          tasks: kanban.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] } : t
          ),
        })),
      };
    });
  };

  const handleToggleSubtask = async (id: string, isDone: boolean) => {
    if (!activeProject) return;
    const prevProject = activeProject;

    setActiveProject({
      ...activeProject,
      kanbans: activeProject.kanbans.map((kanban) => ({
        ...kanban,
        tasks: kanban.tasks.map((t) => ({
          ...t,
          subtasks: (t.subtasks || []).map((st) => (st.id === id ? { ...st, isDone } : st)),
        })),
      })),
    });

    try {
      await tasksApi.toggleSubtask(id, isDone);
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
      setActiveProject(prevProject);
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    if (!activeProject) return;
    const prevProject = activeProject;

    setActiveProject({
      ...activeProject,
      kanbans: activeProject.kanbans.map((kanban) => ({
        ...kanban,
        tasks: kanban.tasks.map((t) => ({
          ...t,
          subtasks: (t.subtasks || []).filter((st) => st.id !== id),
        })),
      })),
    });

    try {
      await tasksApi.deleteSubtask(id);
    } catch (err) {
      console.error('Failed to delete subtask:', err);
      setActiveProject(prevProject);
    }
  };

  const handleOpenCreateTask = (stageId?: string) => {
    setCreateTaskDefaultStageId(stageId);
    setIsCreateTaskModalOpen(true);
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${title}" e todos os seus dados?`)) {
      try {
        await projectsApi.delete(id);
        if (activeProjectId === id) {
          handleSelectProject(null);
        }
        await loadProjects();
      } catch (err) {
        console.error('Failed to delete project:', err);
        toast('Erro ao excluir projeto.', 'error');
      }
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await projectsApi.update(id, { isFavorite });
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, isFavorite } : p));
      if (activeProject && activeProject.id === id) {
        setActiveProject({ ...activeProject, isFavorite });
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleArchiveProject = async (id: string, title: string) => {
    if (window.confirm(`Deseja arquivar o projeto "${title}"?`)) {
      try {
        await projectsApi.update(id, { status: 'ARCHIVED' });
        setProjects((prev) => prev.map((p) => p.id === id ? { ...p, status: 'ARCHIVED' } : p));
        if (activeProject && activeProject.id === id) {
          setActiveProject({ ...activeProject, status: 'ARCHIVED' });
        }
      } catch (err) {
        console.error('Failed to archive project:', err);
      }
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────────

  const activeTasks = useMemo<Task[]>(() => {
    if (!activeProject || !activeProject.kanbans || !activeKanbanId) return [];
    const activeKanban = activeProject.kanbans.find((k) => k.id === activeKanbanId);
    return activeKanban?.tasks || [];
  }, [activeProject, activeKanbanId]);

  const displayedTasks = useMemo(() => {
    if (!searchQuery.trim()) return activeTasks;
    const q = searchQuery.toLowerCase().trim();
    return activeTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [activeTasks, searchQuery]);

  // ── Value ──────────────────────────────────────────────────────────────────────

  const value: AppContextValue = {
    projects,
    activeProject,
    activeProjectId,
    activeKanbanId,
    activeNoteId,
    activeWhiteboardId,
    activeChecklistId,
    activeChatId,
    calendarCount,
    searchQuery,
    loading,
    loadingProject,
    isConnected,
    isSyncing,
    error,
    isCreateTaskModalOpen,
    isCreateProjectModalOpen,
    isCreateKanbanModalOpen,
    isCreateNoteModalOpen,
    isCreateAppointmentModalOpen,
    createTaskDefaultStageId,
    setProjects,
    setActiveProject,
    setSearchQuery,
    setActiveKanbanId,
    setActiveNoteId,
    setActiveWhiteboardId,
    setActiveChecklistId,
    setActiveChatId,
    setIsCreateTaskModalOpen,
    setIsCreateProjectModalOpen,
    setIsCreateKanbanModalOpen,
    setIsCreateNoteModalOpen,
    setIsCreateAppointmentModalOpen,
    setCreateTaskDefaultStageId,
    loadProjects,
    loadActiveProject,
    syncAll,
    handleSelectProject,
    handleCreateProject,
    handleCreateKanban,
    handleCreateNote,
    handleNoteUpdated,
    handleCreateTask,
    handleUpdateTask,
    handleMoveTask,
    handleDeleteTask,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleOpenCreateTask,
    handleDeleteProject,
    handleToggleFavorite,
    handleArchiveProject,
    displayedTasks,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
