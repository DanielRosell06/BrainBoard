import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { projectsApi, kanbansApi, notesApi, tasksApi, calendarApi } from './services/api';
import type {
  Project,
  ProjectSummary,
  Task,
  Subtask,
  ActiveView,
  CreateProjectInput,
  CreateTaskInput,
} from './types';
import { Navbar } from './components/Navbar';
import { TopHeader } from './components/TopHeader';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectList } from './components/ProjectList';
import { ProjectOverview } from './components/ProjectOverview';
import { CalendarView } from './components/calendar/CalendarView';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { CreateKanbanModal } from './components/CreateKanbanModal';
import { CreateNoteModal } from './components/CreateNoteModal';
import { CreateAppointmentModal } from './components/calendar/CreateAppointmentModal';
import { ChatView } from './components/chat/ChatView';
import { NoteEditorView } from './components/notes/NoteEditorView';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeKanbanId, setActiveKanbanId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<ActiveView>('PROJECTS');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProject, setLoadingProject] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Badges counters
  
  const [calendarCount, setCalendarCount] = useState<number>(0);

  // Modals state
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState<boolean>(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState<boolean>(false);
  const [isCreateKanbanModalOpen, setIsCreateKanbanModalOpen] = useState<boolean>(false);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState<boolean>(false);
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState<boolean>(false);
  const [createTaskDefaultStageId, setCreateTaskDefaultStageId] = useState<string | undefined>(undefined);
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load project list from backend (supports silent refresh)
  const loadProjects = useCallback(async (silent = false) => {
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

  // Load full active project with stages & tasks (supports silent refresh)
  const loadActiveProject = useCallback(async (id: string, silent = false) => {
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

  // Master sync function
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
        // Non-blocking for badge updates
      }

      setIsConnected(true);
    } catch (err) {
      console.error('Auto-sync error:', err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [loadProjects, loadActiveProject, activeProjectId]);

  // Initial load
  useEffect(() => {
    loadProjects(false).then((data) => {
      if (data && data.length > 0 && !activeProjectId) {
        setActiveProjectId(data[0].id);
        loadActiveProject(data[0].id, false);
      }
    });

    
    calendarApi.getEvents({ includeCompleted: false }).then((e) => setCalendarCount(e.length)).catch(() => {});
  }, [loadProjects, activeProjectId, loadActiveProject]);

  // Real-time automatic background polling (every 3.5 seconds) & focus sync
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncAll(true);
      }
    }, 3500);

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        syncAll(true);
      }
    };

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [syncAll]);

  const handleSelectProject = (id: string | null) => {
    if (!id) {
      setActiveProjectId(null);
      setActiveProject(null);
      setCurrentView('PROJECTS');
      setActiveKanbanId(null);
      setActiveNoteId(null);
    } else {
      // Se o projeto já está ativo, apenas garante que está carregado
      // sem sobrescrever a seleção atual (kanban/note/view)
      if (activeProjectId === id && activeProject) {
        return;
      }
      setActiveProjectId(id);
      loadActiveProject(id).then(proj => {
        if (proj) {
          setCurrentView('PROJECT_OVERVIEW');
        }
      });
    }
  };

  // Flattened tasks from active kanban
  const activeTasks = useMemo<Task[]>(() => {
    if (!activeProject || !activeProject.kanbans || !activeKanbanId) return [];
    const activeKanban = activeProject.kanbans.find((k) => k.id === activeKanbanId);
    return activeKanban?.tasks || [];
  }, [activeProject, activeKanbanId]);

  // Filter tasks by search query
  const displayedTasks = useMemo(() => {
    if (!searchQuery.trim()) return activeTasks;
    const q = searchQuery.toLowerCase().trim();
    return activeTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [activeTasks, searchQuery]);


  // Project Creation Handler
  const handleCreateProject = async (input: CreateProjectInput) => {
    const newProject = await projectsApi.create(input);
    await loadProjects();
    setActiveProjectId(newProject.id);
    setActiveProject(newProject);
    setCurrentView('BOARD');
  };

  // Kanban Creation Handler
  const handleCreateKanban = async (projectId: string, input: { title: string }) => {
    const newKanban = await kanbansApi.create(projectId, input);
    const completeKanban = {
      ...newKanban,
      tasks: newKanban.tasks || [],
    };
    setActiveProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        kanbans: [...(prev.kanbans || []), completeKanban],
      };
    });
    setActiveKanbanId(completeKanban.id);
    setCurrentView('BOARD');
  };

  const handleCreateNote = async (projectId: string, input: { title: string; content?: string }) => {
    const newNote = await notesApi.create(projectId, { title: input.title, content: input.content || '' });
    setActiveProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        notes: [...(prev.notes || []), newNote],
      };
    });
    setActiveNoteId(newNote.id);
    setCurrentView('NOTE');
  };

  // Note Update Handler (chamado pelo auto-save do editor)
  const handleNoteUpdated = useCallback((updatedNote: import('./types').Note) => {
    setActiveProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        notes: (prev.notes || []).map((n) =>
          n.id === updatedNote.id ? updatedNote : n
        ),
      };
    });
  }, []);

  // Task Creation Handler
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
        tasks: k.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      })),
    });

    try {
      const { columnId, column, kanban, subtasks, tags, ...updateData } = updates as any;
      if (tags) {
        updateData.tagIds = tags.map((t: any) => t.id);
      }
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

  // Task Move / Status Update Handler
  const handleMoveTask = async (id: string, newStatus: string, columnId?: string | null) => {
    if (!activeProject) return;
    const prevProject = activeProject;

    // Optimistic update
    setActiveProject({
      ...activeProject,
      kanbans: activeProject.kanbans.map((kanban) => ({
        ...kanban,
        tasks: kanban.tasks.map((t) =>
          t.id === id ? { ...t, status: newStatus, columnId: columnId || null } : t
        ),
      })),
    });

    try {
      await tasksApi.updateStatus(id, newStatus, columnId || null);
    } catch (err) {
      console.error('Failed to update task status:', err);
      setActiveProject(prevProject);
      alert('Erro ao atualizar status da tarefa.');
    }
  };

  // Task Delete Handler
  const handleDeleteTask = async (id: string) => {
    if (!activeProject) return;
    const prevProject = activeProject;

    // Optimistic update
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
      alert('Erro ao excluir tarefa.');
    }
  };

  // Subtask Add Handler
  const handleAddSubtask = async (taskId: string, title: string) => {
    const newSubtask = await tasksApi.addSubtask(taskId, title);
    setActiveProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        kanbans: prev.kanbans.map((kanban) => ({
          ...kanban,
          tasks: kanban.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
              : t
          ),
        })),
      };
    });
  };

  // Subtask Toggle Handler
  const handleToggleSubtask = async (id: string, isDone: boolean) => {
    if (!activeProject) return;
    const prevProject = activeProject;

    // Optimistic update
    setActiveProject({
      ...activeProject,
      kanbans: activeProject.kanbans.map((kanban) => ({
        ...kanban,
        tasks: kanban.tasks.map((t) => ({
          ...t,
          subtasks: (t.subtasks || []).map((st) =>
            st.id === id ? { ...st, isDone } : st
          ),
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

  // Subtask Delete Handler
  const handleDeleteSubtask = async (id: string) => {
    if (!activeProject) return;
    const prevProject = activeProject;

    // Optimistic update
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
        alert('Erro ao excluir projeto.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col md:flex-row">
      {/* Lateral Sidebar Navigation */}
        <Navbar
          currentView={currentView}
          onSelectView={setCurrentView}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          activeKanbanId={activeKanbanId}
          onSelectKanban={setActiveKanbanId}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
          onOpenCreateModal={() => handleOpenCreateTask()}
          onOpenCreateKanban={() => setIsCreateKanbanModalOpen(true)}
          onOpenCreateNote={() => setIsCreateNoteModalOpen(true)}
          isConnected={isConnected}
          
          calendarCount={calendarCount}
          activeChatId={activeChatId}
          onSelectChat={(id) => {
            setActiveChatId(id);
            setCurrentView('CHAT');
          }}
        />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-neutral-50">
        {/* Modern Top Header */}
        <TopHeader
          currentView={currentView}
          onSelectView={setCurrentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateModal={() => handleOpenCreateTask()}
          onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
          onOpenCreateAppointmentModal={() => setIsCreateAppointmentModalOpen(true)}
          isConnected={isConnected}
          isSyncing={isSyncing}
          onRefresh={() => syncAll(false)}
          activeProject={activeProject}
          onBackToProjects={() => handleSelectProject(null)}
        />

        {/* Main Content Area */}
        <main className={`flex-1 w-full mx-auto min-w-0 ${currentView === 'CHAT' ? 'max-w-none px-0 py-0' : 'max-w-7xl px-8 lg:px-12 py-8 space-y-8'}`}>
          {/* Error Banner se conexão falhar */}
          {error && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-100 text-neutral-600 text-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-neutral-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  loadProjects();
                  if (activeProjectId) loadActiveProject(activeProjectId);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-semibold transition-colors border border-neutral-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconectar</span>
              </button>
            </div>
          )}

          {/* Loading View */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-3">
              <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
            </div>
          ) : currentView === 'PROJECT_OVERVIEW' ? (
            activeProject && (
              <ProjectOverview
                project={activeProject}
                onSelectKanban={(kId) => {
                  setActiveKanbanId(kId);
                  setCurrentView('BOARD');
                }}
                onSelectNote={(nId) => {
                  setActiveNoteId(nId);
                  setCurrentView('NOTE');
                }}
                onOpenCreateKanban={() => setIsCreateKanbanModalOpen(true)}
                onOpenCreateNote={() => setIsCreateNoteModalOpen(true)}
                onProjectUpdated={(updatedProject) => {
                  setActiveProject(updatedProject);
                  setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                }}
              />
            )
          ) : currentView === 'PROJECTS' ? (
            /* Portfolio View: List of all projects */
            <ProjectList
              projects={projects}
              onSelectProject={handleSelectProject}
              onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
              searchQuery={searchQuery}
              onDeleteProject={handleDeleteProject}
            />

          ) : currentView === 'CALENDAR' ? (
            /* Calendar & Appointments View */
            <CalendarView onSelectProject={handleSelectProject} />
          ) : currentView === 'CHAT' ? (
            /* AI Assistant Chat View */
            <ChatView activeChatId={activeChatId} />
          ) : !activeProjectId ? (
            /* Fallback to Project List if Board has no active project */
            <ProjectList
              projects={projects}
              onSelectProject={handleSelectProject}
              onOpenCreateProjectModal={() => setIsCreateProjectModalOpen(true)}
              searchQuery={searchQuery}
              onDeleteProject={handleDeleteProject}
            />
          ) : loadingProject ? (
            /* Loading Active Project */
            <div className="flex flex-col items-center justify-center py-32 space-y-3">
              <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
            </div>

          ) : currentView === 'NOTE' ? (
            /* Active Project Note View — Rich Text Editor */
            activeNoteId && activeProject ? (
              <NoteEditorView
                noteId={activeNoteId}
                project={activeProject}
                onNoteUpdated={handleNoteUpdated}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 min-h-[600px]">
                <div className="text-center py-20 px-4">
                  <h3 className="text-sm font-semibold text-neutral-900">Selecione uma nota</h3>
                  <p className="text-xs text-neutral-500 mt-1">Escolha uma nota na barra lateral para começar a editar.</p>
                </div>
              </div>
            )
          ) : (
            /* Active Project Kanban View */
            <KanbanBoard
              project={activeProject}
              kanban={activeProject?.kanbans?.find(k => k.id === activeKanbanId) || null}
              tasks={displayedTasks}
              onMoveTask={handleMoveTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={handleToggleSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onOpenCreateTask={handleOpenCreateTask}
              onOpenCreateModal={() => handleOpenCreateTask()}
              onRefreshKanban={() => { if (activeProjectId) loadActiveProject(activeProjectId, true); }}
            />
          )}
        </main>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Create Kanban Modal */}
      {activeProjectId && (
        <CreateKanbanModal
          isOpen={isCreateKanbanModalOpen}
          onClose={() => setIsCreateKanbanModalOpen(false)}
          projectId={activeProjectId}
          onCreateKanban={handleCreateKanban}
        />
      )}

      {/* Create Note Modal */}
      {activeProjectId && (
        <CreateNoteModal
          isOpen={isCreateNoteModalOpen}
          onClose={() => setIsCreateNoteModalOpen(false)}
          projectId={activeProjectId}
          onCreateNote={handleCreateNote}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => {
          setIsCreateTaskModalOpen(false);
          setCreateTaskDefaultStageId(undefined);
        }}
        kanbans={activeProject?.kanbans || []}
        defaultKanbanId={createTaskDefaultStageId}
        onCreateTask={handleCreateTask}
      />

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateAppointmentModalOpen}
        onClose={() => setIsCreateAppointmentModalOpen(false)}
        onAppointmentCreated={() => syncAll(true)}
      />


    </div>
  );
};
